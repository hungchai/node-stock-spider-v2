/* jshint node: true */
'use strict';
 
var loadInProgress = false,
    interval = 0,
    page = require('webpage').create(),
    // moment = require('moment'),
    startDate = '2014-01-01',
    endDate =  '2015-01-01',
    url = 'https://kdp.amazon.com/reports/data?customerID=ATVPDKIKX0DER&sessionID=sessionK&type=OBR&marketplaces=all&asins=B00HSB2EZI&startDate=' + startDate + '&endDate=' + endDate + '&_=0000000000';
 
    page.onLoadStarted = function() {
        loadInProgress = true;
    };
 
    page.onLoadFinished = function() {
        loadInProgress = false;
    };
 
    page.settings.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.6 Safari/537.11";
    page.open(url, function(status) {
        page.evaluate(function() {
            document.getElementById('ap_email').value = 'hungchai08@yahoo.com.hk';
            document.getElementById('ap_password').value = 'c00ovujn';
            document.getElementById('ap_signin_form').submit();
        });
        interval = setInterval(function(){
            if(!loadInProgress) {
                page.open(url, function(status) {
                    if(status === 'success') {
                        var data = page.content.replace('<html><head></head><body>','').replace('</body></html>','');
                        console.log(data);
                    } else {
                        console.log('error');
                    }
                    phantom.exit();
                });
                clearInterval(interval);
            }
        },50);
    });