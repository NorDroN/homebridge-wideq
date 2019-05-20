'use strict';

var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
	
  homebridge.registerPlatform('homebridge-wideq', 'WideQ', wideq);
};

function WideQ(log, config) {
	this.log = log;
    this.config = config;
	this.name = config["name"];
}

WideQ.prototype = {

};