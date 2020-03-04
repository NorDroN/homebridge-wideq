import { Device, DeviceInfo } from 'wideq';
import { WideQ } from '../index';
import { AccessoryParser } from './accessory';

export class TVParser extends AccessoryParser {
  constructor(
    public platform: WideQ,
    public accessoryType: string,
  ) {
    super(platform, accessoryType);
  }

  public getAccessoryCategory(device: DeviceInfo): any {
    return this.platform.Accessory.Categories.TELEVISION;
  }

  public updateAccessoryStatuses(device: Device, accessory: any, status?: any) {
    this.createOrUpdateService(
      accessory,
      'Television',
      this.platform.Service.Television,
      this.platform.Characteristic.Active,
      status?.isOn,
      value => (device as any).setOn(value)
    );
  }
}
