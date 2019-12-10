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

  createAccessory: function (device) {
    let uuid = UUIDGen.generate(device.name);
    let accessory = new Accessory(device.name, uuid);

    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'LG')
      .setCharacteristic(Characteristic.Model, device.model);
    // .setCharacteristic(Characteristic.SerialNumber, serial)
    // .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    const service1 = new Service.TemperatureSensor("Refrigerator temperature", "TempRefrigerator");
    const service2 = new Service.TemperatureSensor("Freezer temperature", "TempFreezer");
    const service3 = new Service.GarageDoorOpener("Door state", "DoorOpenState");

    // service1.addCharacteristic(Characteristic.On);

    service2.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100,
        maxValue: 100
      });

    accessory.addService(service1);
    accessory.addService(service2);
    accessory.addService(service3);

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
      const device = this.config.devices.find(d => d.id === message.id);
      if (device) {
        const accessory = this.accessories.find(a => a.displayName === device.name);
        if (accessory) {
          // this.log('Current message: ' + JSON.stringify(message));
          const service1 = accessory.getService("Refrigerator temperature");
          if (service1) {
            service1.setCharacteristic(Characteristic.CurrentTemperature, Number(message.state.TempRefrigerator));
            // service1.setCharacteristic(Characteristic.CurrentDoorState, Number(message.state.DoorOpenState));
          }
          const service2 = accessory.getService("Freezer temperature");
          if (service2) {
            service2.setCharacteristic(Characteristic.CurrentTemperature, Number(message.state.TempFreezer));
          }
          const service3 = accessory.getService("Door state");
          if (service3) {
            service3.setCharacteristic(Characteristic.CurrentDoorState, Number(message.state.DoorOpenState) ? Characteristic.CurrentDoorState.OPEN : Characteristic.CurrentDoorState.CLOSED);
          }
        }
      }
    }
  }

};

