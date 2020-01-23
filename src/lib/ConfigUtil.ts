export default class ConfigUtil {
  constructor(
    private config: any,
  ) {
  }

  public get debug() { return !!this.config.debug; }

  public get refreshToken(): string { return this.config.refresh_token; }
  public get country(): string { return this.config.country || 'US'; }
  public get language(): string { return this.config.language || 'en-US'; }
  public get interval(): number { return +this.config.interval || 10; }
}
