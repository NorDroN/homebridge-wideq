import { Device, DeviceInfo } from 'wideq';
import { RefrigeratorParser } from '../devices/refrigerator';
import { WasherParser } from './../devices/washer';

export default class ParseUtil {
  private parsers: any = {};

  constructor(
    public platform: any,
  ) {
    this.loadParsers();
  }

  public loadParsers() {
    this.parsers = {
      'REFRIGERATOR': new RefrigeratorParser(this.platform, 'REFRIGERATOR'),
      'WASHER': new WasherParser(this.platform, 'WASHER'),
    };
  }

  public getByModel(model: string) {
    return (model in this.parsers) ? this.parsers[model] : null;
  }

  public getCreateAccessories(deviceInfo: DeviceInfo) {
    let result = [];

    const parser = this.getByModel(deviceInfo.type);
    if (parser) {
      result = parser.getCreateAccessories(deviceInfo);
    }

    return result;
  }

  public parserAccessories(device: Device, status: any) {
    let result = [];

    const parser = this.getByModel(device.device.type);
    if (parser) {
      result = parser.parserAccessories(device, status);
    }

    return result;
  }
}
