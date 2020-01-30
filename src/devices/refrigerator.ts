import { DeviceInfo, RefrigeratorDevice, RefrigeratorStatus } from 'wideq';
import { WideQ } from '../index';
import { AccessoryParser } from './accessory';

export class RefrigeratorParser extends AccessoryParser {
  constructor(
    public platform: WideQ,
    public accessoryType: string,
  ) {
    super(platform, accessoryType);
  }

  public getAccessoryCategory(device: DeviceInfo): any {
    return this.platform.Accessory.Categories.OTHER;
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

    const service1 = new this.platform.Service.TemperatureSensor('TempRefrigerator', 'TempRefrigerator');
    service1.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .setProps({
        minValue: 1,
        maxValue: 7,
      });
    // service.getCharacteristic(this.Characteristic.CurrentTemperature);
    result.push(service1);

    const service2 = new this.platform.Service.TemperatureSensor('TempFreezer', 'TempFreezer');
    service2.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .setProps({
        minValue: -23,
        maxValue: -15,
      });
    result.push(service2);

    const service3 = new this.platform.Service.ContactSensor('DoorOpened', 'DoorOpened');
    // service.getCharacteristic(this.Characteristic.ContactSensorState);
    result.push(service3);

    const service4 = new this.platform.Service.Switch('EcoEnabled', 'EcoEnabled');
    result.push(service4);

    const service5 = new this.platform.Service.Switch('IcePlusStatus', 'IcePlusStatus');
    result.push(service5);

    return result;
  }

  public parserAccessories(device: RefrigeratorDevice, status: RefrigeratorStatus) {
    const uuid = this.getAccessoryUUID(device.device.id);
    const accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if (!accessory || !status) return;

    const tempRefrigeratorCharacteristic = accessory.getService('TempRefrigerator')
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature);
    if (null != status.tempRefrigeratorC) {
      tempRefrigeratorCharacteristic.updateValue(status.tempRefrigeratorC);
    }
    if (tempRefrigeratorCharacteristic.listeners('set').length === 0) {
      tempRefrigeratorCharacteristic.on('set', (value: any, callback: any) =>
        device.setTempRefrigeratorC(value)
          .then(() => tempRefrigeratorCharacteristic.updateValue(value))
          .catch(err => callback(err)));
    }

    const tempFreezerCharacteristic = accessory.getService('TempFreezer')
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature);
    if (null != status.tempFreezerC) {
      tempFreezerCharacteristic.updateValue(status.tempFreezerC);
    }
    if (tempFreezerCharacteristic.listeners('set').length === 0) {
      tempFreezerCharacteristic.on('set', (value: any, callback: any) =>
        device.setTempFreezerC(value)
          .then(() => tempFreezerCharacteristic.updateValue(value))
          .catch(err => callback(err)));
    }

    const doorOpenedCharacteristic = accessory.getService('DoorOpened')
      .getCharacteristic(this.platform.Characteristic.ContactSensorState);
    if (null != status.doorOpened) {
      doorOpenedCharacteristic.updateValue(status.doorOpened);
    }

    const ecoEnabledCharacteristic = accessory.getService('EcoEnabled')
      .getCharacteristic(this.platform.Characteristic.On);
    if (null != status.ecoEnabled) {
      ecoEnabledCharacteristic.updateValue(status.ecoEnabled);
    }
    if (ecoEnabledCharacteristic.listeners('set').length === 0) {
      ecoEnabledCharacteristic.on('set', (value: any, callback: any) =>
        device.setEcoEnabled(value)
          .then(() => ecoEnabledCharacteristic.updateValue(value))
          .catch(err => callback(err)));
    }

    const icePlusStatusCharacteristic = accessory.getService('IcePlusStatus')
      .getCharacteristic(this.platform.Characteristic.On);
    if (null != status.icePlusStatus) {
      icePlusStatusCharacteristic.updateValue(status.icePlusStatus);
    }
    if (icePlusStatusCharacteristic.listeners('set').length === 0) {
      icePlusStatusCharacteristic.on('set', (value: any, callback: any) =>
        device.setIcePlusStatus(value)
          .then(() => icePlusStatusCharacteristic.updateValue(value))
          .catch(err => callback(err)));
    }
  }
}
