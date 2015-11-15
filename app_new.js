global.config = require('./config/config.json');
global.mongoose = require('mongoose');
global.MongoClient = require('mongodb').MongoClient;
global.co = require('co');
global.parallel = require('co-parallel');
global.util = require('util');
global.request = require('request');
global.ent = require('ent');
global._ = require("underscore");
global.stockDAO = require('./DAL/stockDAO.js');
global.money18Api = require('./marketAPI/money18Api.js');

try {
    global.mongoURI = global.config.mongoDbConnlocal;
}
catch (err) {
    global.mongoURI = global.config.mongoDbConn;
}

MongoClient.connect(global.mongoURI, function (err, db) {
    var argv1 = process.argv[2];

    co(function*() {
        var a = yield money18Api.getHKLiveStockList();
        return a;

    }).then
    (function (val) {
        process.exit(1);

    })
        .catch(function (err, result) {
            console.log('err: ' + err + ', result: ' + result);
            process.exit(0);

        })
});