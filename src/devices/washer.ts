import { DeviceInfo, WasherDevice, WasherStatus } from 'wideq';
import { WideQ } from '../index';
import { AccessoryParser } from './accessory';

export class WasherParser extends AccessoryParser {
  constructor(
    public platform: WideQ,
    public accessoryType: string,
  ) {
    super(platform, accessoryType);
  }

  public getAccessoryCategory(device: DeviceInfo): any {
    return this.platform.Accessory.Categories.OTHER;
  }

  public updateAccessoryStatuses(device: WasherDevice, accessory: any, status?: WasherStatus) {
    const Characteristic = this.platform.Characteristic;

    this.createOrUpdateService(
      accessory,
      'Power',
      this.platform.Service.Switch,
      [{
        characteristic: Characteristic.On,
        getter: () => status?.isOn,
        setter: value => device.setOn(value),
      }],
    );
  }
}
