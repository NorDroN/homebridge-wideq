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

  public getAccessoryInformation(device: DeviceInfo): any {
    return {
      'Manufacturer': 'LG',
      'Model': device.modelId,
      'SerialNumber': device.id,
    };
  }

  public parserAccessories(device: ACDevice, status?: ACStatus) {
    const uuid = this.getAccessoryUUID(device.device.id);
    const accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if (!accessory) return;

    this.createService(
      accessory,
      'HeaterCooler',
      this.platform.Service.HeaterCooler,
      this.platform.Characteristic.Active,
      status?.isOn,
      device.setOn
    );

    this.createService(
      accessory,
      'HeaterCooler',
      this.platform.Service.HeaterCooler,
      this.platform.Characteristic.CurrentTemperature,
      status?.currentTempInCelsius,
      device.setCelsius
    );
  }
}
