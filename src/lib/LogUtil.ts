export default class LogUtil {
  constructor(
    public flag: string | null,
    public log: any,
  ) {
  }

  public debug(str: string) {
    this.log.debug(this.flag ? '[' + this.flag + '] ' : '' + '[DEBUG] ' + str);
  }

  public info(str: string) {
    this.log.info(this.flag ? '[' + this.flag + '] ' : '' + '[INFO] ' + str);
  }

  public warn(str: string) {
    this.log.warn(this.flag ? '[' + this.flag + '] ' : '' + '[WARN] ' + str);
  }

  public error(str: string | Error) {
    this.log.error(this.flag ? '[' + this.flag + '] ' : '' + '[ERROR] ' + str);
    if (str instanceof Error) {
      this.log.debug(this.flag ? '[' + this.flag + '] ' : '' + '[ERROR] ' + str.stack);
    }
  }

  public objKey2Str(obj: any) {
    let keys = '';
    try {
      for (const key in obj) {
        keys += key + ', ';
      }
      keys = keys.substring(0, keys.lastIndexOf(','));
    } catch (e) {
      return e;
    }

    return keys;
  }
}
