'use strict';

let { Client, NotLoggedInError } = require('wideq');
const LogUtil = require('./lib/LogUtil.js');
const AccessoryUtil = require('./lib/AccessoryUtil.js');
const DeviceUtil = require('./lib/DeviceUtil.js');

const packageFile = require('./package.json');

const delay = (ms) => new Promise(_ => setTimeout(_, ms))

var Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform('homebridge-wideq', 'WideQ', WideQ, true);
};

function WideQ(log, config, api) {
  if (!api || !config) return;

  this.log = log;
  this.logger = new LogUtil(null, log);
  this.DeviceUtil = new DeviceUtil();
  this.AccessoryUtil = new AccessoryUtil();

  this.config = config;

  this.debug = !!this.config.debug;
  this.config.interval = this.config.interval || 10;
  this.config.country = this.config.country || 'RU';
  this.config.language = this.config.language || 'ru-RU';
  this.config.devices = Array.isArray(this.config.devices) ? this.config.devices : [];

  if (api.version < 2.2) {
    throw new Error('Unexpected API version. Please update your homebridge!');
  }

  this.log('**************************************************************');
  this.log('WideQ v' + packageFile.version + ' by NorDroN');
  this.log('GitHub: https://github.com/NorDroN/homebridge-wideq');
  this.log('Email: nordron@live.ru');
  this.log('**************************************************************');

  if (!this.config.refresh_token) {
    this.logger.error('Please add refresh_token!');
    return;
  }

  if (!this.config.devices.length) {
    this.logger.error('Please add devices!');
    return;
  }

  this.api = api;
  this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
}

WideQ.prototype = {

  didFinishLaunching: async function () {
    if (this.debug) this.logger.info('Create client from token');
    const client = await Client.loadFromToken(this.config.refresh_token, this.config.country, this.config.language);

    const promises = this.config.devices.map(async deviceConfig => {
      if (this.debug) this.logger.info(`Get device (${JSON.stringify(deviceConfig)})`);
      const device = await client.getDevice(deviceConfig.id);
      this.DeviceUtil.addOrUpdate(deviceConfig.id, { device: device, config: deviceConfig });
      
      if (!this.AccessoryUtil.getByUUID(deviceConfig.id)) {
        const accessory = this.createAccessory(deviceConfig, device);
        this.addAccessory(accessory);
      }
    });
    await Promise.all(promises);

    await this.runMonitoring(client);
  },

  createAccessory: function (deviceConfig, device) {
    // let uuid = UUIDGen.generate(deviceConfig.name);
    let accessory = new Accessory(deviceConfig.name, deviceConfig.id);

    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'LG')
      .setCharacteristic(Characteristic.Model, deviceConfig.model);
    // .setCharacteristic(Characteristic.SerialNumber, serial)
    // .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    this.addServices(accessory, deviceConfig);

    return accessory;
  },

  addAccessory: function (accessory) {
    if (accessory) {
      this.logger.info("Add Accessory: ", accessory.displayName);

      this.AccessoryUtil.add(accessory);
      this.api.registerPlatformAccessories('homebridge-wideq', 'WideQ', [accessory]);
    }
  },

  removeAccessory: function (accessory) {
    if (accessory) {
      this.logger.info("Remove Accessory: ", accessory.displayName);

      this.api.unregisterPlatformAccessories('homebridge-wideq', 'WideQ', [accessory]);
      this.AccessoryUtil.remove(accessory);
    }
  },

  configureAccessory: function (accessory) {
    this.logger.info("Configure Accessory: ", accessory.displayName);

    this.AccessoryUtil.add(accessory);
  },

  runMonitoring: async function (client) {
    const devices = Object.values(this.DeviceUtil.getAll());
    if (this.debug) this.logger.info(`Run monitoring ${devices.length} devices from ${JSON.stringify(this.DeviceUtil.getAll())}`);

    const startMonitorPromises = devices.map(async ({ device }) => {
      if (this.debug) this.logger.info(`Load device and start monitoring (id = ${device.device.id})`);
      await device.load();
      await device.startMonitor();
    });
    await Promise.all(startMonitorPromises);

    try {
      for (; ;) {
        await delay(this.config.interval * 1000);
        const promises = devices.map(async ({ device, config }) => {
          try {
            if (this.debug) this.logger.info('polling...');
            const status = await device.poll();
            if (!status) {
              this.logger.info('no status');
              return;
            }

            if (this.debug) {
              const keys = Reflect.ownKeys(status.constructor.prototype);
              for (const key of keys) {
                if (typeof key === 'string' && !['constructor'].includes(key)) {
                  this.logger.info(`- ${key}: ${String(Reflect.get(status, key))}`);
                }
              }
            }

            this.receiveStatus(device, config, status);
          } catch (e) {
            if (e instanceof NotLoggedInError) {
              await device.stopMonitor();
              await client.refresh();
              this.logger.info(client.devices);
            }

            this.logger.error(e);
          }
        });
        await Promise.all(promises);
      }
    } catch (e) {
      this.logger.error(e);
    } finally {
      devices.forEach(async d => {
        await d.stopMonitor();
      });
    }
  },

  receiveStatus: function (device, deviceConfig, status) {
    const accessory = this.AccessoryUtil.getByUUID(device.device.id);
    if (accessory) {
      this.addServices(accessory, deviceConfig, status);
    }
  },

  addServices: function (accessory, deviceConfig, status) {
    const characteristics = deviceConfig.characteristics && deviceConfig.characteristics.length ?
      deviceConfig.characteristics :
      [];

    characteristics.forEach(d => this.addService(accessory, d, status[d.name]));
  },

  addService: function (accessory, serviceConfig, value) {
    let service = accessory.getService(serviceConfig.name);

    if (!service) {
      switch (serviceConfig.type.toLowerCase()) {
        case "temperature":
          service = new Service.TemperatureSensor(serviceConfig.title || serviceConfig.name, serviceConfig.name);

          // service.getCharacteristic(Characteristic.CurrentTemperature)
          //   .setProps({
          //     minValue: -100,
          //     maxValue: 100
          //   });

          break;
        case "humidity":
          service = new Service.HumiditySensor(serviceConfig.title || serviceConfig.name, serviceConfig.name);
          break;
        case "contact":
          service = new Service.ContactSensor(serviceConfig.title || serviceConfig.name, serviceConfig.name);
          break;
      }
      accessory.addService(service);
    }

    switch (serviceConfig.type.toLowerCase()) {
      case "temperature":
        service.setCharacteristic(Characteristic.CurrentTemperature, value);
        break;
      case "humidity":
        service.setCharacteristic(Characteristic.CurrentRelativeHumidity, value);
        break;
      case "contact":
        service.setCharacteristic(Characteristic.ContactSensorState, value === "OPEN" ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED : Characteristic.ContactSensorState.CONTACT_DETECTED);
        break;
    }
  }

};

