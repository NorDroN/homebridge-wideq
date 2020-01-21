export default class DeviceUtil {
  private devices: any = {};

  public getBySid(sid: string) {
    return (sid in this.devices) ? this.devices[sid] : null;
  }

  public add(sid: string, device: any) {
    this.devices[sid] = device;
    return device;
  }

  public update(sid: string, newDevice: any) {
    const device = this.getBySid(sid);
    if (null != device) {
      for (const item in newDevice) {
        device[item] = newDevice[item];
      }
    }
    return device;
  }

  public addOrUpdate(sid: string, newDevice: any) {
    const device = this.getBySid(sid);
    if (null == device) {
      return this.add(sid, newDevice);
    } else {
      return this.update(sid, newDevice);
    }
  }

  public remove(sid: string) {
    delete this.devices[sid];
  }

  public getAutoRemoveDevice(threshold: Number) {
    const r: any = {};

    const nowTime = Date.now();
    for (const sid in this.devices) {
      const device = this.getBySid(sid);
      if ((nowTime - device.lastUpdateTime) > threshold) {
        r[sid] = device;
      }
    }

    return r;
  }

  public getAll() {
    return this.devices;
  }
}
