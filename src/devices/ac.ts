import { ACDevice, ACStatus, DeviceInfo } from 'wideq';
import { WideQ } from '../index';
import { AccessoryParser } from './accessory';

export class ACParser extends AccessoryParser {
  constructor(
    public platform: WideQ,
    public accessoryType: string,
  ) {
    super(platform, accessoryType);
  }

  public getAccessoryCategory(device: DeviceInfo): any {
    return this.platform.Accessory.Categories.AIR_CONDITIONER;
  }

  public updateAccessoryStatuses(device: ACDevice, accessory: any, status?: ACStatus) {
    const Characteristic = this.platform.Characteristic;

    this.createOrUpdateService(
      accessory,
      'HeaterCooler',
      this.platform.Service.HeaterCooler,
      [{
        characteristic: Characteristic.Active,
        getter: () => status?.isOn,
        setter: (value: any) => device.setOn(value),
      }, {
        characteristic: Characteristic.CurrentTemperature,
        getter:  () => status?.currentTempInCelsius,
        setter:  (value: any) => device.setCelsius(value),
      }],
    );
  }
}
