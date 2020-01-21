export default class AccessoryUtil {
  private accessories: any = {};

  constructor() {
    this.accessories = {};
  }

  public getByUUID(uuid: string) {
    return (uuid in this.accessories) ? this.accessories[uuid] : null;
  }

  public add(accessory: any) {
    this.accessories[accessory.UUID] = accessory;
    return accessory;
  }

  public remove(uuid: string) {
    delete this.accessories[uuid];
  }

  public getAll() {
    return this.accessories;
  }
}
