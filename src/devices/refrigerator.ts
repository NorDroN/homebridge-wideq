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

  public updateAccessoryStatuses(device: RefrigeratorDevice, accessory: any, status?: RefrigeratorStatus) {
    this.createOrUpdateService(
      accessory,
      'TempRefrigerator',
      this.platform.Service.TemperatureSensor,
      this.platform.Characteristic.CurrentTemperature,
      status?.tempRefrigeratorC,
      device.setTempRefrigeratorC
    );

    this.createOrUpdateService(
      accessory,
      'TempFreezer',
      this.platform.Service.TemperatureSensor,
      this.platform.Characteristic.CurrentTemperature,
      status?.tempFreezerC,
      device.setTempFreezerC
    );

    this.createOrUpdateService(
      accessory,
      'DoorOpened',
      this.platform.Service.ContactSensor,
      this.platform.Characteristic.ContactSensorState,
      status?.doorOpened
    );

    this.createOrUpdateService(
      accessory,
      'EcoEnabled',
      this.platform.Service.Switch,
      this.platform.Characteristic.On,
      status?.ecoEnabled,
      device.setEcoEnabled
    );

    this.createOrUpdateService(
      accessory,
      'IcePlusStatus',
      this.platform.Service.Switch,
      this.platform.Characteristic.On,
      status?.icePlusStatus,
      device.setIcePlusStatus
    );
  }
}
