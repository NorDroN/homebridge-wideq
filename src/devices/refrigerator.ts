import { DeviceInfo, FreshAirFilter, RefrigeratorDevice, RefrigeratorStatus } from 'wideq';
import { celsiusToFahrenheit, fahrenheitToCelsius } from 'temperature';
import { WideQ } from '../index';
import { AccessoryParser } from './accessory';

export class RefrigeratorParser extends AccessoryParser {
  constructor(
    public platform: WideQ,
    public accessoryType: string,
  ) {
    super(platform, accessoryType);
  }

  public getAccessoryCategory(device: DeviceInfo): any {
    return this.platform.Accessory.Categories.OTHER;
  }

  public updateAccessoryStatuses(device: RefrigeratorDevice, accessory: any, status?: RefrigeratorStatus) {
    // wait for real data to come
    if (status?.data) {
      const modelValues = device.model.data.Value;
      // API is 0 for F, 1 for C
      let tempUnit: any;
      let tempUnitLetter: string;
      let toCelsiusFunction: (arg0: number) => number;

      if (status.data.TempUnit == 0) {
        tempUnit = this.platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT;
        tempUnitLetter = "F";
        toCelsiusFunction = fahrenheitToCelsius;
      } else {
        tempUnit = this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS;
        tempUnitLetter = "C";
        toCelsiusFunction = (c: number) => c;
      }

      ["Refrigerator", "Freezer"].forEach((name: string) => {
        // Same for fridge and freezer
        [
          { characteristic: this.platform.Characteristic.TemperatureDisplayUnits,
            value: tempUnit },
          { characteristic: this.platform.Characteristic.CurrentHeatingCoolingState,
            value: 2 },
          { characteristic: this.platform.Characteristic.TargetHeatingCoolingState,
            value: 2, extra: { minValue: 2, maxValue: 2 } },
        ].forEach(characteristicInfo => {
          this.createOrUpdateService(accessory, name, this.platform.Service.Thermostat,
            characteristicInfo.characteristic,
            characteristicInfo.value, undefined,
            characteristicInfo.extra);
        });

        let max = Math.max.apply(null, Object.values(modelValues["Temp"+name+"_"+tempUnitLetter].option).map(Number));
        let min = Math.min.apply(null, Object.values(modelValues["Temp"+name+"_"+tempUnitLetter].option).map(Number));
        let current = Number(modelValues["Temp"+name+"_"+tempUnitLetter].option[status.data["Temp"+name]]);

        this.createOrUpdateService(
          accessory, name, this.platform.Service.Thermostat,
          this.platform.Characteristic.CurrentTemperature,
          toCelsiusFunction(current), undefined,
          { minValue: toCelsiusFunction(min), maxValue: toCelsiusFunction(max)+1 } // max has to be increased by 1 for home app/cooling
        );

        // console.dir({name, d: "F", min, max, current});
        // console.dir({name, d: "C", min:toCelsiusFunction(min), max:toCelsiusFunction(max), current:toCelsiusFunction(current)});

        this.createOrUpdateService(
          accessory, name, this.platform.Service.Thermostat,
          this.platform.Characteristic.TargetTemperature,
          toCelsiusFunction(current),
          valueC => {
            let valueToUse = valueC;
            if (this.platform.config.refrigeratorControlType == "key") {
              return (device as any)["setTemp"+name+"C"](valueToUse);
            } else {
              let closestKey: string;

              // must use correct one so we do not set to something we can not display
              if (tempUnitLetter == "F") {
                valueToUse = celsiusToFahrenheit(valueToUse);
              }

              closestKey = this.findClosestKeyToTemperature(valueToUse, modelValues["TempRefrigerator_"+tempUnitLetter].option);

              return (device as any)["setBinaryTemp"+name](status, closestKey);
            }
          },
          { minValue: toCelsiusFunction(min), maxValue: toCelsiusFunction(max)+1 } // max has to be increased by 1 for home app/cooling
        );
      });

      this.createOrUpdateService(
        accessory, 'Door', this.platform.Service.ContactSensor,
        this.platform.Characteristic.ContactSensorState,
        status.doorOpened
      );

      if (modelValues.hasOwnProperty("EcoFriendly")) {
        this.createOrUpdateService(
          accessory, 'Eco', this.platform.Service.Switch,
          this.platform.Characteristic.On,
          status?.ecoEnabled,
          value => {
            if (this.platform.config.refrigeratorControlType == "key") {
              return device.setEcoEnabled(value);
            } else {
              return device.setBinaryEco(status, value);
            }
          }
        );
      }

      if (modelValues.hasOwnProperty("IcePlus")) {
        this.createOrUpdateService(
          accessory, 'Ice Plus', this.platform.Service.Switch,
          this.platform.Characteristic.On,
          status?.icePlusStatus,
          value => {
            if (this.platform.config.refrigeratorControlType == "key") {
              return device.setIcePlusStatus(value);
            } else {
              return device.setBinaryIcePlus(status, value);
            }
          }
        );
      }

      if (modelValues.hasOwnProperty("FreshAirFilter")) {
        // create them once
        let airPurifierService = accessory.getService("Air Filtration");
        if (!airPurifierService) {
          airPurifierService = accessory.addService(this.platform.Service.AirPurifier, "Air Filtration", "filtration");
          airPurifierService.getCharacteristic(this.platform.Characteristic.Active)
            .on("get", (callback: (error?: Error | null , value?: any) => void) => {
              callback(null, status.freshAirFilterStatus == FreshAirFilter.POWER);
            })
            .on("set", (value: boolean, callback: (error?: Error | null , value?: any) => void) => {
              if (status.freshAirFilterStatus == FreshAirFilter.REPLACE_FILTER) {
                callback(new Error("Replace filter"), null);
              }
              device.setBinaryFreshAirFilter(status, value ? FreshAirFilter.POWER : FreshAirFilter.AUTO).then();
              callback(null, value);
            });
          airPurifierService.getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState)
            .on("get", (callback: (error?: Error | null , value?: any) => void) => {
              callback(null, status.freshAirFilterStatus == FreshAirFilter.POWER ? 2 : 0);
            });
          airPurifierService.getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
            .on("get", (callback: (error?: Error | null , value?: any) => void) => {
              callback(null, status.freshAirFilterStatus != FreshAirFilter.POWER);
            })
            .on("set", (value: boolean, callback: (error?: Error | null , value?: any) => void) => {
              if (status.freshAirFilterStatus == FreshAirFilter.REPLACE_FILTER) {
                callback(new Error("Replace filter"), null);
              }
              device.setBinaryFreshAirFilter(status, value ? FreshAirFilter.POWER : FreshAirFilter.AUTO).then();
              callback(null, value);
            });
        }
        airPurifierService.getCharacteristic(this.platform.Characteristic.Active)
          .updateValue(status.freshAirFilterStatus == FreshAirFilter.POWER);
        airPurifierService.getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState)
          .updateValue(status.freshAirFilterStatus == FreshAirFilter.POWER ? 2 : 0);
        airPurifierService.getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
          .updateValue(status.freshAirFilterStatus != FreshAirFilter.POWER);

        let airFilterMaintenanceService = accessory.getService("Air Filter");
        if (!airFilterMaintenanceService) {
          airFilterMaintenanceService = accessory.addService(this.platform.Service.FilterMaintenance, "Air Filter", "air-filter");
          airFilterMaintenanceService.getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
            .on("get", (callback: (error?: Error | null , value?: any) => void) => callback(null, status.freshAirFilterStatus == FreshAirFilter.REPLACE_FILTER));
          airPurifierService.addLinkedService(airFilterMaintenanceService);
        }
        airFilterMaintenanceService.updateCharacteristic(this.platform.Characteristic.FilterChangeIndication,
          status.freshAirFilterStatus == FreshAirFilter.REPLACE_FILTER);
      }
    }
  }

  private findClosestKeyToTemperature(value: number, options: {[key: string]: string}): string {
    let closestKey = Object.keys(options)[0];
    let closestValue = options[closestKey];

    Object.keys(options).forEach(key => {
      if (this.isCloserToGoal(value, closestValue, options[key])) {
        closestKey = key;
        closestValue = options[key];
      }
    });

    return closestKey;
  }

  // if b is closer to the goal than a
  private isCloserToGoal(goal: number, a: Number|string, b: Number|string): boolean {
    return Math.abs(Number(b)-goal) < Math.abs(Number(a)-goal);
  }
}
