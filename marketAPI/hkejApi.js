'use strict';

var stockMinutesQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/mfchart?code=%s&period=1min&frame=72+HOUR';
var stockHistDayQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/mfchart';
var stockTodayQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/todaydata?code=%s';

class HkejApi {
    construct() {
    }

    static getStockQuoteList(stockNum, parameter, callback) {
        return function (callback) {
            console.log("getStockQuoteList: " + stockNum);
            var formBody = util.format('code=%s&%s', parseInt(stockNum), parameter);
            var contentLength = formBody.length;
            request({
                headers: {
                    'Content-Length': contentLength,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Referer': util.format('http://stock360.hkej.com/quotePlus/%s', parseInt(stockNum))
                },
                uri: stockHistDayQuoteURL,
                body: formBody,
                method: 'POST'
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log("receive: " + stockNum);
                    var d = JSON.parse(body);
                    d.symbol = stockNum
                    callback(error, d);
                } else {
                    callback(null, null);
                }
            })

        }
    }

    static getstockHistDayQuoteList(stockNum) {
        return function (callback) {
            HkejApi.getStockQuoteList(stockNum, 'period=day&frame=2+YEAR')(callback);
        }
    }

}

module.exports = HkejApi;