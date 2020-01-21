export default class ConfigUtil {
  constructor(
    public config: any,
  ) {
  }

  public debug = () => !!this.config.debug;
}
