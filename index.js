'use strict';

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
	
  homebridge.registerPlatform('homebridge-wideq', 'WideQ', wideq, true);
};

function WideQ(log, config) {
  
}

WideQ.prototype = {

};