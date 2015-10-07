/**
 * Created by tomma on 6/10/15.
 */
var talib = require('talib');
var util = require('util');
console.log("TALib Version: " + talib.version);
var request = require('request');

var stockMarketData = "https://api.investtab.com/api/quote/%s%3AHK/historical-prices?resolution=D&from=1412121600&to=1444146071"

request(util.format(stockMarketData, '00183'), function(error, response, body) {
    var marketData = JSON.parse(body);
    talib.execute({
        name: "ADX",
        startIdx: 0,
        endIdx: marketData.c.length - 1,
        high: marketData.h,
        low: marketData.l,
        close: marketData.c,
        optInTimePeriod: 9
    }, function (result) {

        console.log("ADX Function Results:");
        console.log(result);

    });
});