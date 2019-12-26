'use strict';

let { PythonShell } = require('python-shell');

const packageFile = require('./package.json');

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
  this.config = config;
  this.name = config['name'];
  this.accessories = [];
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
    this.log.error('Please add refresh_token!');
    return;
  }

  if (this.config.devices.length) {
    let shell = new PythonShell('script.py', {
      scriptPath: __dirname,
      args: ['-c', this.config.country, '-l', this.config.language, '-t', this.config.refresh_token, '-i', this.config.interval],
      pythonOptions: ['-u'],
      mode: 'json'
    });
    shell.on('message', this.receiveMessage.bind(this));
  }

  this.api = api;
  this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
}

WideQ.prototype = {

  didFinishLaunching: function () {
    this.config.devices.map(d => {
      if (!this.accessories.some(a => a.displayName === d.name)) {
        const accessory = this.createAccessory(d);
        this.addAccessory(accessory);
      }
    });
  },

  createAccessory: function (deviceConfig) {
    let uuid = UUIDGen.generate(deviceConfig.name);
    let accessory = new Accessory(deviceConfig.name, uuid);

    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'LG')
      .setCharacteristic(Characteristic.Model, deviceConfig.model);
    // .setCharacteristic(Characteristic.SerialNumber, serial)
    // .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    return accessory;
  },

  addAccessory: function (accessory) {
    if (accessory) {
      this.log("Add Accessory: ", accessory.displayName);

      this.accessories.push(accessory);
      this.api.registerPlatformAccessories('homebridge-wideq', 'WideQ', [accessory]);
    }
  },

  removeAccessory: function (accessory) {
    if (accessory) {
      this.log("Remove Accessory: ", accessory.displayName);

      this.api.unregisterPlatformAccessories('homebridge-wideq', 'WideQ', [accessory]);
      delete this.accessories[accessory.displayName];
    }
  },

  configureAccessory: function (accessory) {
    this.log("Configure Accessory: ", accessory.displayName);

    this.accessories.push(accessory);
  },

  receiveMessage: function (message) {
    // handle message (a line of text from stdout, parsed as JSON)
    if (message && message.id) {
      const deviceConfig = this.config.devices.find(d => d.id === message.id);
      if (deviceConfig) {
        const accessory = this.accessories.find(a => a.displayName === deviceConfig.name);
        if (accessory) {
          if (this.debug) this.log('Current message: ' + JSON.stringify(message));

          this.addServices(accessory, deviceConfig, message);
        }
      }
    }
  },

  addServices: function (accessory, deviceConfig, message) {
    const params = deviceConfig.parameters && deviceConfig.parameters.length ?
      deviceConfig.parameters :
      Object.keys(message.state).map(d => {
        // TODO add dynamic configuration
        return { name: d };
      });

    params.forEach(d => this.addService(accessory, d, message.state[d.name]));
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
        service.setCharacteristic(Characteristic.ContactSensorState, value === "OPEN");
        break;
    }
  }

};

