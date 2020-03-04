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
    this.createOrUpdateService(
      accessory,
      'HeaterCooler',
      this.platform.Service.HeaterCooler,
      this.platform.Characteristic.Active,
      status?.isOn,
      device.setOn
    );

    this.createOrUpdateService(
      accessory,
      'HeaterCooler',
      this.platform.Service.HeaterCooler,
      this.platform.Characteristic.CurrentTemperature,
      status?.currentTempInCelsius,
      device.setCelsius
    );
  }
}
