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
      'Manufacturer': 'LD',
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

  public parserAccessories(jsonObj: any) {
    const deviceSid = jsonObj['sid'];
    const uuid = this.getAccessoryUUID(deviceSid);
    const accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if (!accessory) return;

    const tempRefrigeratorCharacteristic = accessory
      .getService('TempRefrigerator')
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature);
    const value = jsonObj.tempRefrigeratorC;
    if (null != value) {
      tempRefrigeratorCharacteristic.updateValue(value);
    }

    if (tempRefrigeratorCharacteristic.listeners('get').length === 0) {
      tempRefrigeratorCharacteristic.on('get', (callback) => {
        const command = '{"cmd":"read", "sid":"' + deviceSid + '"}';
        // this.platform.sendCommand(deviceSid, command).then(result => {
        //   const value = jsonObj.tempRefrigeratorC;
        //   if (null != value) {
        //     callback(null, value);
        //   } else {
        //     callback(new Error('get value fail: ' + result));
        //   }
        // }).catch(err => {
        //   this.platform.log.error(err);
        //   callback(err);
        // });
      });
    }
  }
}
