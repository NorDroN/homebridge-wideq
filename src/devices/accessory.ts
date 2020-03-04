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

  public getCreateAccessories(device: Device) {
    const deviceInfo = device.device;
    const uuid = this.getAccessoryUUID(deviceInfo.id);
    let accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if (null == accessory) {
      accessory = new this.platform.PlatformAccessory(deviceInfo.name, uuid, this.getAccessoryCategory(deviceInfo));
      const accessoryInformation = this.getAccessoryInformation(deviceInfo);
      accessory.getService(this.platform.Service.AccessoryInformation)
        .setCharacteristic(this.platform.Characteristic.Manufacturer, accessoryInformation['Manufacturer'] || 'Undefined')
        .setCharacteristic(this.platform.Characteristic.Model, accessoryInformation['Model'] || 'Undefined')
        .setCharacteristic(this.platform.Characteristic.SerialNumber, accessoryInformation['SerialNumber'] || 'Undefined');
      this.parserAccessories(device, null);

      accessory.reachable = true;
      accessory.on('identify', (paired: any, callback: any) => {
        this.platform.log.debug(accessory.displayName + ' Identify!!!');
        callback();
      });

      return accessory;
    }

    return null;
  }

  public parserAccessories(device: Device, status?: any) {
    throw new Error('Not implemented.');
  }

  protected createService(
    accessory: any,
    name: string,
    serviceType: any,
    charactiristicType: any,
    currentValue?: any,
    setter?: (value: any) => Promise<void>,
  ) {
    let service = accessory.getService(name);
    if (!service) {
      service = accessory.addService(serviceType, name, name);
    }

    const characteristic = service.getCharacteristic(charactiristicType);
    if (setter && characteristic.listeners('set').length === 0) {
      characteristic.on('set', (value: any, callback: any) =>
        setter(value)
          .then(() => characteristic.updateValue(value))
          .catch(err => callback(err))
      );
    }

    if (null != currentValue) {
      characteristic.updateValue(currentValue);
    }
  }
}
