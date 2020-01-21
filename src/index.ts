import { Client, Device, NotConnectedError, NotLoggedInError } from 'wideq';
import AccessoryUtil from './lib/AccessoryUtil';
import ConfigUtil from './lib/ConfigUtil';
import DeviceUtil from './lib/DeviceUtil';
import LogUtil from './lib/LogUtil';
import ParseUtil from './lib/ParseUtil';

const packageFile = require('../package.json');

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let PlatformAccessory: any, Accessory: any, Service: any, Characteristic: any, UUIDGen: any;

export default function(homebridge: any) {
  PlatformAccessory = homebridge.platformAccessory;
  Accessory = homebridge.hap.Accessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform('homebridge-wideq', 'WideQ', WideQ, true);
}

export class WideQ {
  public Accessory = Accessory;
  public PlatformAccessory = PlatformAccessory;
  public Service = Service;
  public Characteristic = Characteristic;
  public UUIDGen = UUIDGen;

  public logger = new LogUtil(null, this.log);
  public ConfigUtil = new ConfigUtil(this.config);
  public DeviceUtil = new DeviceUtil();
  public AccessoryUtil = new AccessoryUtil();
  public ParseUtil = new ParseUtil(this);

  constructor(
    public log: any,
    public config: any,
    public api: any,
  ) {
    if (!api || !config) return;

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

  private async didFinishLaunching() {
    if (this.ConfigUtil.debug) this.logger.info('Create client from token and get devices');
    const client = await Client.loadFromToken(this.config.refresh_token, this.config.country, this.config.language);
    await client.updateDevices();

    const promises = client.devices.map(async d => {
      if (this.ConfigUtil.debug) this.logger.info(`Load device and start monitoring: ${d}`);
      const device = await client.getDevice(d.id);
      await device.load();
      await device.startMonitor();
      this.DeviceUtil.addOrUpdate(d.id, device);

      const createAccessories = this.ParseUtil.getCreateAccessories(d);
      this.registerPlatformAccessories([createAccessories]);
      // this.ParseUtil.parserAccessories(device);
    });
    await Promise.all(promises);

    await this.runMonitoring(client);
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

  private async runMonitoring(client: Client) {
    const devices = Object.values(this.DeviceUtil.getAll()) as Device[];

    try {
      for (; ;) {
        await delay(this.config.interval * 1000);
        const promises = devices.map(async (device: Device) => {
          try {
            if (this.ConfigUtil.debug) this.logger.info('polling...');
            const status = await device.poll();
            if (!status) {
              this.logger.info('no status');
              return;
            }

            if (this.ConfigUtil.debug) {
              const keys = Reflect.ownKeys(status.constructor.prototype);
              for (const key of keys) {
                if (typeof key === 'string' && !['constructor'].includes(key)) {
                  this.logger.info(`- ${key}: ${String(Reflect.get(status, key))}`);
                }
              }
            }

            this.receiveStatus(device, status);
          } catch (e) {
            this.logger.error(e);

            if (e instanceof NotLoggedInError || e instanceof NotConnectedError) {
              this.logger.info('Refresh token');
              await device.stopMonitor();
              await client.refresh();
              await device.startMonitor();
            }
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
  }

  private receiveStatus(device: any, status: any) {
    this.ParseUtil.parserAccessories(status);
  }

}
