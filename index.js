'use strict';

const packageFile = require('../package.json');

var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
	
  homebridge.registerPlatform('homebridge-wideq', 'WideQ', WideQ);
};

function WideQ(log, config) {
	this.log = log;
    this.config = config;
	this.name = config["name"];
	
	this.log('**************************************************************');
    this.log('WideQ v' + packageFile.version + ' by NorDroN');
    this.log('GitHub: https://github.com/NorDroN/homebridge-wideq');
    this.log('Email: nordron@live.ru');
    this.log('**************************************************************');
    this.log('use config:');
    this.log(JSON.stringify(this.config));
    this.log('start success...');
}

WideQ.prototype = {

};