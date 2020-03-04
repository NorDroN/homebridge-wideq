import { DeviceInfo, Device } from 'wideq';
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

  public updateAccessoryStatuses(device: Device, accessory: any, status?: any) {
    this.createOrUpdateService(
      accessory,
      device.device.name,
      this.platform.Service.ServiceLabel,
      this.platform.Characteristic.Name
    );
  }
}
