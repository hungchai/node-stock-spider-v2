global.config = require('../sensitive_data/config.json');

try {
    var Spooky = require('spooky');
}
catch (e) {
    var Spooky = require('../lib/spooky');
}

var spooky = new Spooky({
    child: {
        // transport: 'http',
        'ignore-ssl-errors': 'yes'
    },
    casper: {
        logLevel: 'debug',
        verbose: true,
        pageSettings: {
            loadImages: true, // The WebPage instance used by Casper will
            loadPlugins: false, // use these settings
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36'
        },
        viewportSize: {
            width: 1600,
            height: 950
        }
    }
}, function(err) {
    if (err) {
        e = new Error('Failed to initialize SpookyJS');
        e.details = err;
        throw e;
    }



    var url = 'https://wealth.standardchartered.com.hk/ows-oe/foa/login.htm?lang=en_HK';

    spooky.start(url, function() {
        // search for 'casperjs' from google form
        this.emit("hello", "page loaded");

    });
    //set value to spooky must be using thenEvaluate to control webpage js
    spooky.thenEvaluate(function(config) {
        console.log('x:', config.BankAcct.login); // -> x: spooky
        document.querySelector('input#j_username').setAttribute('value', config.BankAcct.login);
        document.querySelector('input#j_passwordUI').setAttribute('value', config.BankAcct.password);
    }, {
        config: global.config
    });

    spooky.then(function() {
        this.capture('sc1.png', undefined, {
            format: 'jpg',
            quality: 75
        });
    })
    spooky.thenClick('form#command input[type="submit"]', function() {
        this.waitForSelector('#login-information', function() {
            this.emit('hello', "I've waited for a second.");
        });
    });
    spooky.then(function() {
        this.capture('sc2.png', undefined, {
            format: 'jpg',
            quality: 75
        });
    });
    spooky.thenClick('div#login-information div a', function() {
        this.waitForSelector('.txt_title', function() {
            this.emit('hello', this.getHTML('.txt_title'));
        });
    });
    spooky.then(function() {
        this.capture('sc3.png', undefined, {
            format: 'jpg',
            quality: 75
        });
    });


    spooky.run();

});

spooky.on('error', function(e, stack) {
    console.error(e);

    if (stack) {
        console.log(stack);
    }
});

/*
// Uncomment this block to see all of the things Casper has to say.
// There are a lot.
// He has opinions.
spooky.on('console', function (line) {
    console.log(line);
});
*/

spooky.on('hello', function(greeting) {
    console.log(greeting);
});

spooky.on('getBankAcct', function(key) {
    if (key === "name") {
        return global.config.BankAcct.login;
    }
    else if (key === "pw") {
        return global.config.BankAcct.password;
    }
    else {
        return ""
    };
});

spooky.on('log', function(log) {
    if (log.space === 'remote') {
        console.log(log.message.replace(/ \- .*/, ''));
    }
});