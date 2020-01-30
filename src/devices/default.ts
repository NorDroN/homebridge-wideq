import { DeviceInfo, WasherDevice, WasherStatus } from 'wideq';
import { WideQ } from '../index';
import { AccessoryParser } from './accessory';

export class DefaultParser extends AccessoryParser {
  constructor(
    public platform: WideQ,
    public accessoryType: string,
  ) {
    super(platform, accessoryType);
  }

  public getAccessoryCategory(device: DeviceInfo): any {
    return this.platform.Accessory.Categories.OTHER;
  }

  public getAccessoryInformation(device: DeviceInfo): any {
    return {
      'Manufacturer': 'LG',
      'Model': device.modelId,
      'SerialNumber': device.id,
    };
  }

  public getServices(device: DeviceInfo) {
    const result: any[] = [];

    const service1 = new this.platform.Service.ServiceLabel(device.name);
    result.push(service1);

    return result;
  }

  public parserAccessories(device: WasherDevice, status: WasherStatus) {
    const uuid = this.getAccessoryUUID(device.device.id);
    const accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if (!accessory || !status) return;
  }
}
