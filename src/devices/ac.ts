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

  public getServices(device: DeviceInfo) {
    const result: any[] = [];

    const service1 = new this.platform.Service.HeaterCooler('HeaterCooler', 'HeaterCooler');
    result.push(service1);

    return result;
  }

  public parserAccessories(device: ACDevice, status: ACStatus) {
    const uuid = this.getAccessoryUUID(device.device.id);
    const accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if (!accessory || !status) return;

    const activeCharacteristic = accessory.getService('HeaterCooler')
      .getCharacteristic(this.platform.Characteristic.Active);
    if (null != status.isOn) {
      activeCharacteristic.updateValue(status.isOn);
    }
    if (activeCharacteristic.listeners('set').length === 0) {
      activeCharacteristic.on('set', (value: any, callback: any) =>
        device.setOn(value)
          .then(() => activeCharacteristic.updateValue(value))
          .catch(err => callback(err)));
    }

    const tempCharacteristic = accessory.getService('HeaterCooler')
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature);
    if (null != status.currentTempInCelsius) {
      tempCharacteristic.updateValue(status.currentTempInCelsius);
    }
    if (tempCharacteristic.listeners('set').length === 0) {
      tempCharacteristic.on('set', (value: any, callback: any) =>
        device.setCelsius(value)
          .then(() => tempCharacteristic.updateValue(value))
          .catch(err => callback(err)));
    }
  }
}
