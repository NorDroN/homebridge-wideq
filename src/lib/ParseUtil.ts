import { RefrigeratorParser } from '../devices/refrigerator';

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
    };
  }

  public getByModel(model: string) {
    return (model in this.parsers) ? this.parsers[model] : null;
  }

  public getCreateAccessories(jsonObj: any) {
    let result = [];

    const model = jsonObj['type'];
    const parser = this.getByModel(model);
    if (parser) {
      result = parser.getCreateAccessories(jsonObj);
    }

    return result;
  }

  public parserAccessories(jsonObj: any) {
    let result = [];

    const model = jsonObj['device']['device']['type'];
    const parser = this.getByModel(model);
    if (parser) {
      result = parser.parserAccessories(jsonObj);
    }

    return result;
  }
}
