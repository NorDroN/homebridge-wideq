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
    const Characteristic = this.platform.Characteristic;

    this.createOrUpdateService(
      accessory,
      'TempRefrigerator',
      this.platform.Service.Thermostat,
      [{
        characteristic: Characteristic.CurrentTemperature,
        getter: () => status?.tempRefrigeratorC,
        options: { minValue: 1, maxValue: 7 }, // TODO magic consts
      }, {
        characteristic: Characteristic.TargetTemperature,
        setter: value => device.setTempRefrigeratorC(value),
        options: { minValue: 1, maxValue: 7 }, // TODO magic consts
      }],
    );

    this.createOrUpdateService(
      accessory,
      'TempFreezer',
      this.platform.Service.Thermostat,
      [{
        characteristic: Characteristic.CurrentTemperature,
        getter: () => status?.tempFreezerC,
        options: { minValue: -23, maxValue: -15 }, // TODO magic consts
      }, {
        characteristic: Characteristic.TargetTemperature,
        setter: value => device.setTempFreezerC(value),
        options: { minValue: -23, maxValue: -15 }, // TODO magic consts
      }],
    );

    this.createOrUpdateService(
      accessory,
      'DoorOpened',
      this.platform.Service.ContactSensor,
      [{
        characteristic: Characteristic.ContactSensorState,
        getter: () => status?.doorOpened,
      }],
    );

    //if (device.model.value('EcoFriendly')) {
    this.createOrUpdateService(
      accessory,
      'EcoEnabled',
      this.platform.Service.Switch,
      [{
        characteristic: Characteristic.On,
        getter: () => status?.ecoEnabled,
        setter: value => device.setEcoEnabled(value),
      }],
    );

    this.createOrUpdateService(
      accessory,
      'IcePlusStatus',
      this.platform.Service.Switch,
      [{
        characteristic: Characteristic.On,
        getter: () => status?.icePlusStatus,
        setter: value => device.setIcePlusStatus(value),
      }],
    );
  }
}
