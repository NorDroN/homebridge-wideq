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

  public updateAccessoryStatuses(device: RefrigeratorDevice, accessory: any, status?: RefrigeratorStatus) {
    this.createOrUpdateService(
      accessory,
      'TempRefrigerator',
      this.platform.Service.TemperatureSensor,
      this.platform.Characteristic.CurrentTemperature,
      () => status?.tempRefrigeratorC,
      value => device.setTempRefrigeratorC(value),
      { minValue: 1, maxValue: 7 } // TODO magic consts
    );

    this.createOrUpdateService(
      accessory,
      'TempFreezer',
      this.platform.Service.TemperatureSensor,
      this.platform.Characteristic.CurrentTemperature,
      () => status?.tempFreezerC,
      value => device.setTempFreezerC(value),
      { minValue: -23, maxValue: -15 } // TODO magic consts
    );

    this.createOrUpdateService(
      accessory,
      'DoorOpened',
      this.platform.Service.ContactSensor,
      this.platform.Characteristic.ContactSensorState,
      () => status?.doorOpened
    );

      this.createOrUpdateService(
        accessory,
        'EcoEnabled',
        this.platform.Service.Switch,
        this.platform.Characteristic.On,
        () => status?.ecoEnabled,
        value => device.setEcoEnabled(value)
      );

    this.createOrUpdateService(
      accessory,
      'IcePlusStatus',
      this.platform.Service.Switch,
      this.platform.Characteristic.On,
      () => status?.icePlusStatus,
      value => device.setIcePlusStatus(value)
    );
  }
}
