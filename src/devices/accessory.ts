import { WideQ } from '../index';

export class AccessoryParser {
  constructor(
    public platform: WideQ,
    public accessoryType: string,
  ) {
  }

  public getAccessoryUUID(deviceSid: string, accessoryType?: string) {
    switch (arguments.length) {
      case 1:
        return this.platform.UUIDGen.generate(deviceSid + this.accessoryType);
      case 2:
        return this.platform.UUIDGen.generate(deviceSid + accessoryType);
      default:
        return null;
    }
  }

  public getAccessoryCategory(deviceSid: string): any {
    return null;
  }

  public getAccessoryInformation(deviceSid: string): any {
    return {};
  }

  public getServices(jsonObj: any, accessoryName: string): any[] {
    return [];
  }

  public getCreateAccessories(jsonObj: any) {
    const deviceSid = jsonObj['id'];

    const uuid = this.getAccessoryUUID(deviceSid);
    let accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if (null == accessory) {
      const accessoryName = jsonObj['name'];
      accessory = new this.platform.PlatformAccessory(accessoryName, uuid, this.getAccessoryCategory(deviceSid));
      const accessoryInformation = this.getAccessoryInformation(deviceSid);
      accessory.getService(this.platform.Service.AccessoryInformation)
        .setCharacteristic(this.platform.Characteristic.Manufacturer, accessoryInformation['Manufacturer'] || 'Undefined')
        .setCharacteristic(this.platform.Characteristic.Model, accessoryInformation['Model'] || 'Undefined')
        .setCharacteristic(this.platform.Characteristic.SerialNumber, accessoryInformation['SerialNumber'] || 'Undefined');
      this.getServices(jsonObj, accessoryName).forEach((service, index, serviceArr) => {
        accessory.addService(service, accessoryName);
      });

      accessory.reachable = true;
      accessory.on('identify', (paired, callback) => {
        this.platform.log.debug(accessory.displayName + ' Identify!!!');
        callback();
      });

      return accessory;
    }

    return null;
  }

  public parserAccessories(jsonObj: any) { }
}
