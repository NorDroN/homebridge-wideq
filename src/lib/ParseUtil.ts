import { Device, DeviceInfo } from 'wideq';
import { ACParser } from '../devices/ac';
import { DefaultParser } from '../devices/default';
import { RefrigeratorParser } from '../devices/refrigerator';
import { TVParser } from '../devices/tv';
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
      'AC': new ACParser(this.platform, 'AC'),
      'WASHER': new WasherParser(this.platform, 'WASHER'),
      'TV': new TVParser(this.platform, 'TV'),
      'DEFAULT': new DefaultParser(this.platform, 'UNKNOWN'),
    };
  }

  public getByModel(model: string) {
    return (model in this.parsers) ? this.parsers[model] : this.parsers['DEFAULT'];
  }

  public getCreateAccessories(device: Device) {
    let result = [];

    const parser = this.getByModel(device.device.type);
    if (parser) {
      result = parser.getCreateAccessories(device);
    }

    return result;
  }

  public parserAccessories(device: Device, status?: any) {
    let result = [];

    const parser = this.getByModel(device.device.type);
    if (parser) {
      result = parser.parserAccessories(device, status);
    }

    return result;
  }
}
