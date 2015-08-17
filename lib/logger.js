var bunyan = require("bunyan"),
    module_info = require('../package'),
	options = {};

options.name = module_info.name || "node-app";
options.level = process.env.LOG_LEVEL || "info";

var logger = bunyan.createLogger(options);
module.exports = logger;