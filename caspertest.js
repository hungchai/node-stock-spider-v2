var casper = require('casper').create({   
    verbose: true, 
    logLevel: 'debug',
    pageSettings: {
         loadImages:  true,         // The WebPage instance used by Casper will
         loadPlugins: false,         // use these settings
         userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36'
    },
    viewportSize:  {width: 1600, height: 950}
});

// print out all the messages in the headless browser context
casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
});

// print out all the messages in the headless browser context
casper.on("page.error", function(msg, trace) {
    this.echo("Page Error: " + msg, "ERROR");
});

var url = 'https://university.mongodb.com/';

casper.start(url, function() {
   // search for 'casperjs' from google form
   console.log("page loaded");
   this.click('a#login-button');
   // this.test.assertExists('form#login_form', 'form is found');
   this.fill('form#login_form', { 
        'email': 'hungchai08@yahoo.com.hk', 
        'password':  'c00ovujn'
    },false);
    // this.click('form#login_form input[type="submit"]');
     this.capture('mongouniverity1.png',  undefined, {
        format: 'jpg',
        quality: 75});
});
casper.thenClick('form#login_form input[type="submit"]', function()
{
    this.waitForSelector('.nav-username', function() {
        this.echo("I've waited for a second.");
    });
});
casper.then( function()
{
     this.capture('mongouniverity2.png',  undefined, {
        format: 'jpg',
        quality: 75});
});

casper.thenOpen('https://university.mongodb.com/dashboard',function(){
  this.capture('mongouniverity3.png',  undefined, {
        format: 'jpg',
        quality: 75});
    
});
casper.thenOpen('https://university.mongodb.com/logout',function(){
  this.capture('mongouniverity4.png',  undefined, {
        format: 'jpg',
        quality: 75});
    
});
casper.run();