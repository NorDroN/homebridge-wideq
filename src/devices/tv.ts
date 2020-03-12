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
    const Characteristic = this.platform.Characteristic;

    this.createOrUpdateService(
      accessory,
      'Television',
      this.platform.Service.Television,
      [{
        characteristic: Characteristic.Active,
        getter: () => status?.isOn,
        setter: value => (device as any).setOn(value),
      }],
    );
  }
}
