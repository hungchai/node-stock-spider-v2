'use strict';

var stockMinutesQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/mfchart?code=%s&period=1min&frame=72+HOUR';
var stockHistDayQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/mfchart';
var stockTodayQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/todaydata?code=%s';

class HkejApi {
    construct() {
    }

    static getStockQuoteList(stockSymbol, parameter, callback) {
        return function (callback) {
            console.log("getStockQuoteList: " + stockSymbol);
            var formBody = util.format('code=%s&%s', parseInt(stockSymbol), parameter);
            var contentLength = formBody.length;
            request({
                headers: {
                    'Content-Length': contentLength,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Referer': util.format('http://stock360.hkej.com/quotePlus/%s', parseInt(stockSymbol))
                },
                uri: stockHistDayQuoteURL,
                body: formBody,
                method: 'POST'
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log("receive: " + stockSymbol);
                    var d = JSON.parse(body);
                    d.symbol = stockSymbol
                    callback(error, d);
                } else {
                    callback(null, null);
                }
            })

        }
    }

    static getstockHistDayQuoteList(stockSymbol) {
        return function (callback) {
            HkejApi.getStockQuoteList(stockSymbol, 'period=day&frame=2+YEAR')(callback);
        }
    }

    static getstockTodayQuoteList(stockSymbol) {
        return function (callback) {
            request(util.format(stockTodayQuoteURL, parseInt(stockSymbol)), function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var d = JSON.parse(body);
                    d.symbol = stockSymbol;
                    d.date = new Date(d.Date);
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