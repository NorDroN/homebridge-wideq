import { WasherDevice, WasherStatus } from 'wideq';
import { WideQ } from '../index';
import { AccessoryParser } from './accessory';

export class DefaultParser extends AccessoryParser {
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
      'SerialNumber': deviceSid
    };
  }

  public getServices(jsonObj: any, accessoryName: string) {
    const result: any[] = [];
    return result;
  }

  public parserAccessories(device: WasherDevice, status: WasherStatus) {
    const uuid = this.getAccessoryUUID(device.device.id);
    const accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if (!accessory || !status) return;
  }
}
