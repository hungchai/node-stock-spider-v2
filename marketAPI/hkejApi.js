'use strict';
var moment = require('moment-timezone');
var util = require('util');
var request = require('request');

var stockMinutesQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/mfchart?code=%s&period=1min&frame=72+HOUR';
var stockHistDayQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/mfchart';
var stockTodayQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/todaydata?code=%s';

class HkejApi {
    construct() {
    }

    static getStockQuoteList(stockSymbol, parameter, callback) {
        return function (callback) {
            console.log("getStockQuoteList: " + stockSymbol);
            var formBody = util.format('code=%s&%s', stockSymbol.substr(0, 5), parameter);
            var contentLength = formBody.length;
            request({
                headers: {
                    'Content-Length': contentLength,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Referer': util.format('http://stock360.hkej.com/quotePlus/%s',  stockSymbol.substr(0, 5))
                },
                uri: stockHistDayQuoteURL,
                body: formBody,
                method: 'POST'
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log("receive: " + stockSymbol);
                    var d = JSON.parse(body);
                    d.symbol = stockSymbol;
                    //var quotedate = moment.tz(d.date, "Asia/Hong_Kong");
                    //d.date = quotedate.toDate();;
                    callback(error, d);
                } else {
                    callback(null, null);
                }
            })

        }
    }

    static getstockHistDayQuoteList(stockSymbol) {
        return function (callback) {
            HkejApi.getStockQuoteList(stockSymbol, 'period=day&frame=4+YEAR')(callback);
        }
    }

    static getstockTodayQuoteList(stockSymbol) {
        return function (callback) {
            request(util.format(stockTodayQuoteURL,  stockSymbol.substr(0, 5)), function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var d = JSON.parse(body);
                    d.symbol = stockSymbol;
                    d.date = d.Date
                    delete d.Date;
                    console.log('getstockTodayQuoteList:' + d.symbol);
                    callback(error, d);
                } else {
                    callback(null, null);
                }
            });
        }
    }

}

module.exports = HkejApi;