import { Client, Device, NotConnectedError, NotLoggedInError } from 'wideq';

import AccessoryUtil from './lib/AccessoryUtil';
import ConfigUtil from './lib/ConfigUtil';
import DeviceUtil from './lib/DeviceUtil';
import LogUtil from './lib/LogUtil';
import ParseUtil from './lib/ParseUtil';

const packageFile = require('../package.json');

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let platformAccessory: any, accessory: any, service: any, characteristic: any, UUIDGen: any;

export default function (homebridge: any) {
  platformAccessory = homebridge.platformAccessory;
  accessory = homebridge.hap.Accessory;
  service = homebridge.hap.Service;
  characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform('homebridge-wideq', 'WideQ', WideQ, true);
}

export class WideQ {
  public Accessory = accessory;
  public PlatformAccessory = platformAccessory;
  public Service = service;
  public Characteristic = characteristic;
  public UUIDGen = UUIDGen;

  public logger = new LogUtil(null, this.log);
  public ConfigUtil = new ConfigUtil(this.config);
  public DeviceUtil = new DeviceUtil();
  public AccessoryUtil = new AccessoryUtil();
  public ParseUtil = new ParseUtil(this);

  public client?: Client;

  constructor(
    public log: any,
    public config: any,
    public api: any,
  ) {
    if (!this.api || !this.config) return;

    if (this.api.version < 2.2) {
      throw new Error('Unexpected API version. Please update your homebridge!');
    }

    this.log('**************************************************************');
    this.log('WideQ v' + packageFile.version + ' by NorDroN');
    this.log('GitHub: https://github.com/NorDroN/homebridge-wideq');
    this.log('Email: nordron@live.ru');
    this.log('**************************************************************');

    if (!this.ConfigUtil.refreshToken) {
      this.logger.error('Please add refresh_token!');
      return;
    }

    this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
  }

  private async didFinishLaunching() {
    const preexistingAccessories = Object.keys(this.AccessoryUtil.getAll());
    let accessoriesToRemove = preexistingAccessories;

    if (this.ConfigUtil.debug) this.logger.info('Create client from token and get devices');
    this.client = await Client.loadFromToken(
      this.ConfigUtil.refreshToken, this.ConfigUtil.country, this.ConfigUtil.language);
    await this.client.updateDevices();

    const promises = this.client.devices.map(async d => {
      if (this.ConfigUtil.debug) this.logger.info(`Load device and start monitoring: ${d}`);
      const device = await this.client!.getDevice(d.id);
      await device.load();
      try {
        await device.startMonitor();
      } catch (e) {
        if (e instanceof NotConnectedError) {
          this.logger.info(`Device is not connected: ${d}`);
        }
      }
      this.DeviceUtil.addOrUpdate(d.id, device);

      const thisDeviceAccessoryUuid = this.ParseUtil.getByModel(device.device.type).getAccessoryUUID(d.id);

      const createAccessories = this.ParseUtil.getCreateAccessories(device);

      if (!preexistingAccessories.includes(thisDeviceAccessoryUuid)) {
        this.logger.info("Accessory "+thisDeviceAccessoryUuid+" is new – adding");
        this.registerPlatformAccessories([createAccessories]);
        this.ParseUtil.parserAccessories(device, {});
      } else {
        this.logger.info("Accessory "+thisDeviceAccessoryUuid+" is already created/cached");
        // remove
        accessoriesToRemove.splice(accessoriesToRemove.indexOf(thisDeviceAccessoryUuid), 1);
      }
    });
    await Promise.all(promises);

    this.unregisterPlatformAccessories(accessoriesToRemove.map(this.AccessoryUtil.getByUUID.bind(this.AccessoryUtil)));

    await this.runMonitoring();
  }

  private configureAccessory(accessory: any) {
    accessory.reachable = true;
    accessory.on('identify', () => {
      this.logger.debug(accessory.displayName + ' Identify!!!');
    });

    if (this.AccessoryUtil) {
      this.AccessoryUtil.add(accessory);
    }
  }

  private registerPlatformAccessories(accessories: any[]) {
    this.api.registerPlatformAccessories('homebridge-wideq', 'WideQ', accessories);
    accessories.forEach(accessory => {
      this.logger.info('Create accessory - UUID: ' + accessory.UUID);
      this.AccessoryUtil.add(accessory);
    }, this);
  }

  private unregisterPlatformAccessories(accessories: any[]) {
    this.api.unregisterPlatformAccessories('homebridge-wideq', 'WideQ', accessories);
    accessories.forEach(accessory => {
      this.logger.info('Delete accessory - UUID: ' + accessory.UUID);
      this.AccessoryUtil.remove(accessory.UUID);
    }, this);
  }

  private async runMonitoring() {
    setInterval(async () => {
      const devices = Object.values(this.DeviceUtil.getAll()) as Device[];
      const promises = devices.map(async (device: Device) => {
        const status = await this.getStatus(device);
        if (status) this.ParseUtil.parserAccessories(device, status);
      });
      await Promise.all(promises);
    }, this.ConfigUtil.interval * 1000);
  }

  public async getStatus(device: Device) {
    try {
      if (this.ConfigUtil.debug) this.logger.info(`Polling status: ${device.device}`);
      const status = await device.poll();
      if (!status) {
        this.logger.info(`No status: ${device.device}`);
        return;
      }

      if (this.ConfigUtil.debug) {
        this.logger.info(`Status: ${device.device}`);
        const keys = Reflect.ownKeys(status.constructor.prototype);
        for (const key of keys) {
          if (typeof key === 'string' && !['constructor'].includes(key)) {
            this.logger.info(`- ${key}: ${String(Reflect.get(status, key))}`);
          }
        }
      }

      return status;
    } catch (e) {
      if (e instanceof NotConnectedError) {
        this.logger.info(`Device is not connected: ${device.device}`);
        return;
      }

      this.logger.error(e);

      if (e instanceof NotLoggedInError) {
        this.logger.info('Refresh token');
        await device.stopMonitor();
        await this.client!.refresh();
        await device.startMonitor();
      }
    }
  }
}
