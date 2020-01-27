import { WasherDevice, WasherStatus } from 'wideq';
import { WideQ } from '../index';
import { AccessoryParser } from './accessory';

export class WasherParser extends AccessoryParser {
  constructor(
    public platform: WideQ,
    public accessoryType: string,
  ) {
    super(platform, accessoryType);
  }

  public getAccessoryCategory(deviceSid: string): any {
    return this.platform.Accessory.Categories.OTHER;
  }

  public getAccessoryInformation(deviceSid: string): any {
    return {
      'Manufacturer': 'LG',
      'Model': 'Washer',
      'SerialNumber': deviceSid
    };
  }

  public getServices(jsonObj: any, accessoryName: string) {
    const result: any[] = [];

    const service1 = new this.platform.Service.Switch('Power', 'Power');
    result.push(service1);

    return result;
  }

  public parserAccessories(device: WasherDevice, status: WasherStatus) {
    const uuid = this.getAccessoryUUID(device.device.id);
    const accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if (!accessory || !status) return;

    const powerCharacteristic = accessory.getService('Power')
      .getCharacteristic(this.platform.Characteristic.On);
    if (null != status.isOn) {
      powerCharacteristic.updateValue(status.isOn);
    }
    if (powerCharacteristic.listeners('set').length === 0) {
      powerCharacteristic.on('set', (value: any, callback: any) =>
        device.setOn(value)
          .then(() => powerCharacteristic.updateValue(value))
          .catch(err => callback(err)));
    }
  }
}
