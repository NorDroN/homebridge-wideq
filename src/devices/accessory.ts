import { Device, DeviceInfo } from 'wideq';
import { WideQ } from '../index';

export class AccessoryParser {
  constructor(
    public platform: WideQ,
    public accessoryType: string,
  ) {
  }

  public getAccessoryUUID(deviceSid: string, accessoryType?: string) {
    switch (arguments.length) {
      case 1:
        return this.platform.UUIDGen.generate(deviceSid + this.accessoryType);
      case 2:
        return this.platform.UUIDGen.generate(deviceSid + accessoryType);
      default:
        return null;
    }
  }

  public getAccessoryCategory(device: DeviceInfo): any {
    throw new Error('Not implemented.');
  }

  public getAccessoryInformation(device: DeviceInfo): any {
    throw new Error('Not implemented.');
  }

  public getServices(device: DeviceInfo): any[] {
    throw new Error('Not implemented.');
  }

  public getCreateAccessories(device: DeviceInfo) {
    const uuid = this.getAccessoryUUID(device.id);
    let accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if (null == accessory) {
      accessory = new this.platform.PlatformAccessory(device.name, uuid, this.getAccessoryCategory(device));
      const accessoryInformation = this.getAccessoryInformation(device);
      accessory.getService(this.platform.Service.AccessoryInformation)
        .setCharacteristic(this.platform.Characteristic.Manufacturer, accessoryInformation['Manufacturer'] || 'Undefined')
        .setCharacteristic(this.platform.Characteristic.Model, accessoryInformation['Model'] || 'Undefined')
        .setCharacteristic(this.platform.Characteristic.SerialNumber, accessoryInformation['SerialNumber'] || 'Undefined');
      this.getServices(device).forEach((service, index, serviceArr) => {
        accessory.addService(service, device.name);
      });

      accessory.reachable = true;
      accessory.on('identify', (paired: any, callback: any) => {
        this.platform.log.debug(accessory.displayName + ' Identify!!!');
        callback();
      });

      return accessory;
    }

    return null;
  }

  public parserAccessories(device: Device, status: any) {
    throw new Error('Not implemented.');
  }
}
