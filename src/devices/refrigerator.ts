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

  // public getServices(device: DeviceInfo) {
  //   const result: any[] = [];

  //   const service1 = new this.platform.Service.TemperatureSensor(
  //     "TempRefrigerator",
  //     "TempRefrigerator"
  //   );
  //   service1
  //     .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
  //     .setProps({
  //       minValue: 1,
  //       maxValue: 7
  //     });
  //   // service.getCharacteristic(this.Characteristic.CurrentTemperature);
  //   result.push(service1);

  //   const service2 = new this.platform.Service.TemperatureSensor(
  //     "TempFreezer",
  //     "TempFreezer"
  //   );
  //   service2
  //     .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
  //     .setProps({
  //       minValue: -23,
  //       maxValue: -15
  //     });
  //   result.push(service2);

  //   const service3 = new this.platform.Service.ContactSensor(
  //     "DoorOpened",
  //     "DoorOpened"
  //   );
  //   // service.getCharacteristic(this.Characteristic.ContactSensorState);
  //   result.push(service3);

  //   const service4 = new this.platform.Service.Switch(
  //     "EcoEnabled",
  //     "EcoEnabled"
  //   );
  //   result.push(service4);

  //   const service5 = new this.platform.Service.Switch(
  //     "IcePlusStatus",
  //     "IcePlusStatus"
  //   );
  //   result.push(service5);

  //   return result;
  // }

  public parserAccessories(device: RefrigeratorDevice, status?: RefrigeratorStatus) {
    const uuid = this.getAccessoryUUID(device.device.id);
    const accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if (!accessory) return;

    this.createService(
      accessory,
      'TempRefrigerator',
      this.platform.Service.TemperatureSensor,
      this.platform.Characteristic.CurrentTemperature,
      status?.tempRefrigeratorC,
      device.setTempRefrigeratorC
    );

    this.createService(
      accessory,
      'TempFreezer',
      this.platform.Service.TemperatureSensor,
      this.platform.Characteristic.CurrentTemperature,
      status?.tempFreezerC,
      device.setTempFreezerC
    );

    this.createService(
      accessory,
      'DoorOpened',
      this.platform.Service.ContactSensor,
      this.platform.Characteristic.ContactSensorState,
      status?.doorOpened
    );

    this.createService(
      accessory,
      'EcoEnabled',
      this.platform.Service.Switch,
      this.platform.Characteristic.On,
      status?.ecoEnabled,
      device.setEcoEnabled
    );

    this.createService(
      accessory,
      'IcePlusStatus',
      this.platform.Service.Switch,
      this.platform.Characteristic.On,
      status?.icePlusStatus,
      device.setIcePlusStatus
    );
  }
}
