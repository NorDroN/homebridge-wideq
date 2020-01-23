import { RefrigeratorDevice, RefrigeratorStatus } from 'wideq';
import { WideQ } from '../index';
import { AccessoryParser } from './accessory';

export class RefrigeratorParser extends AccessoryParser {
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
      'Model': 'Refrigerator',
      'SerialNumber': deviceSid
    };
  }

  public getServices(jsonObj: any, accessoryName: string) {
    const result: any[] = [];

    const service1 = new this.platform.Service.TemperatureSensor(accessoryName + '_TempRefrigerator', 'TempRefrigerator');
    // service.getCharacteristic(this.Characteristic.CurrentTemperature);
    result.push(service1);

    const service2 = new this.platform.Service.TemperatureSensor(accessoryName + '_TempFreezer', 'TempFreezer');
    service2.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100,
        maxValue: 100,
      });
    result.push(service2);

    const service3 = new this.platform.Service.ContactSensor(accessoryName + '_DoorOpened', 'DoorOpened');
    // service.getCharacteristic(this.Characteristic.ContactSensorState);
    result.push(service3);

    return result;
  }

  public parserAccessories(device: RefrigeratorDevice, status: RefrigeratorStatus) {
    const uuid = this.getAccessoryUUID(device.device.id);
    const accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if (!accessory || !status) return;

    const tempRefrigeratorCharacteristic = accessory
      .getService(this.platform.Service.TemperatureSensor) // TODO get by name
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature);
    if (null != status.tempRefrigeratorC) {
      tempRefrigeratorCharacteristic.updateValue(status.tempRefrigeratorC);
    }

    const doorOpenedCharacteristic = accessory
      .getService(this.platform.Service.ContactSensor) // TODO get by name
      .getCharacteristic(this.platform.Characteristic.ContactSensorState);
    if (null != status.doorOpened) {
      doorOpenedCharacteristic.updateValue(status.doorOpened);
    }
  }
}
