// Untitled Dice v0.0.8

// Customize these configuration settings:

var config = {
  
  // - Your app's id on moneypot.com
  app_id: 923,                             // <----------------------------- EDIT ME!
  // - Displayed in the navbar
  app_name: 'DICECO.IN',
  // - For your faucet to work, you must register your site at Recaptcha
  // - https://www.google.com/recaptcha/intro/index.html
  recaptcha_sitekey: '6Lc73RcTAAAAADkKfZj7iuqjv32_RUy4ds0Urgbj',  // <----- EDIT ME!
  redirect_uri: 'https://diceco.in',
  mp_browser_uri: 'https://www.moneypot.com',
  mp_api_uri: 'https://api.moneypot.com',
  chat_uri: '//socket.moneypot.com',
  check_jackpot: '//diceco.in/api/check.php?jackpot=',
  jackpot_increase: '//diceco.in/api/jackpot.php?bet_id=',
  history_jackpots: '//diceco.in/api/jackpots_history.php?jackpot=',
    tip_command:'$tip',
    // - Show debug output only if running on localhost
    debug: isRunningLocally(),
    // - Set this to true if you want users that come to http:// to be redirected
    //   to https://
    force_https_redirect: !isRunningLocally(),
    // - Configure the house edge (default is 1%)
    //   Must be between 0.0 (0%) and 1.0 (100%)
    house_edge: 0.01,
    chat_buffer_size: 250,
    // - The amount of bets to show on screen in each tab
    bet_buffer_size: 25

};
var lastBetId = 0;
var timerId = 0;

var grandJackpot = "-------";
var majorJackpot = "-----";
var minorJackpot = "---";


var jacpot_sound = new Audio("http://diceco.in/sounds/jackpot.mp3");
var jacpot_voice = new Audio("http://diceco.in/sounds/jackpot_voice.mp3");

function callBackJackpotCheck(call,jackpot,dispatcher){
        
        var json = JSON.parse(call);


        if (json[0] > jackpot.id && jackpot.id != 0) {
            jacpot_sound.play();
            jacpot_voice.play();
            JackpotWinner(json[2], jackpot.value);
        }
        grandJackpot = json[1];
        var jp = {
            id: json[0],
            value: json[1],
            hashJP: json[4]
        };
        Dispatcher.sendAction(dispatcher, jp);

    
    
}

function initJack() {

    function grandJackpot_call(call) {

        callBackJackpotCheck(call,jackPotStore.state.grand,'UPDATE_GRAND_JACKPOT');
    }
    httpGetAsync(config.check_jackpot + 'jackpot_grand', grandJackpot_call);

    function majorJackpot_call(call) {

        callBackJackpotCheck(call,jackPotStore.state.major,'UPDATE_MAJOR_JACKPOT');
    }
    httpGetAsync(config.check_jackpot + 'jackpot_major', majorJackpot_call);

    function minorJackpot_call(call) {
        callBackJackpotCheck(call,jackPotStore.state.minor,'UPDATE_MINOR_JACKPOT');
    }
    httpGetAsync(config.check_jackpot + 'jackpot_minor', minorJackpot_call);




}

function initHistoryJackpots() {

    function grandJackpot_call(call) {
        var arr = JSON.parse(call);

        Dispatcher.sendAction('INIT_ALL_HISTORY_JACKPOTS',arr);
 
    }
    httpGetAsync(config.history_jackpots + 'jackpot_grand&type=grand', grandJackpot_call);

    function majorJackpot_call(call) {
        
        var arr = JSON.parse(call);
        Dispatcher.sendAction('INIT_ALL_HISTORY_JACKPOTS',arr);
 
    }
    httpGetAsync(config.history_jackpots + 'jackpot_major&type=major', majorJackpot_call);

    function minorJackpot_call(call) {
        
       var arr = JSON.parse(call);
        Dispatcher.sendAction('INIT_ALL_HISTORY_JACKPOTS',arr);
        
    }
    httpGetAsync(config.history_jackpots + 'jackpot_minor&type=minor', minorJackpot_call);




}

function BalanceColor(profit) {
    var balanceText = document.getElementsByClassName("balance-text");
    var r = 255;
    var g = 255;
    var b = 255;
    if (profit > 0) {
        r = 0;
        g = 255;
        b = 0;
        balanceText[0].style.color = 'rgb(' + r + ',' + g + ',' + b + ')';
    } else if (profit < 0) {
        r = 255;
        g = 0;
        b = 0;
        balanceText[0].style.color = 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    function ColorChange() {
        r += 5;
        g += 5;
        b += 5;


        balanceText[0].style.color = 'rgb(' + r + ',' + g + ',' + b + ')';
        if (r != 255 || g != 255 || b != 255) {
            window.requestAnimationFrame(ColorChange);
        }


    }
    ColorChange();

}


function JackpotWinner(user, jackpot) {
    var jackpot_bg = document.getElementById("jackpot_bg");
    var jackpot_box = document.getElementById("jackpot_box");
    jackpot_box.innerHTML = "";
    var t = document.createTextNode(user + " won the jackpot of " + jackpot + " bits."); // Create a text node
    jackpot_box.appendChild(t);
    jackpot_bg.style.display = "inline";
    jackpot_box.style.display = "inline";
    jackpot_bg.onclick = function() {
        CloseJackpotBox();
    };
    jackpot_box.onclick = function() {
        CloseJackpotBox();
    };


}

function CloseJackpotBox() {
    var jackpot_bg = document.getElementById("jackpot_bg");
    var jackpot_box = document.getElementById("jackpot_box");

    jackpot_bg.style.display = "none";
    jackpot_box.style.display = "none";
}


////////////////////////////////////////////////////////////
// You shouldn't have to edit anything below this line
////////////////////////////////////////////////////////////

// Validate the configured house edge
(function() {
    var errString;

    if (config.house_edge <= 0.0) {
        errString = 'House edge must be > 0.0 (0%)';
    } else if (config.house_edge >= 100.0) {
        errString = 'House edge must be < 1.0 (100%)';
    }

    if (errString) {
        autoBetStore.state.button = false;
        clearInterval(timerId);
        alert(errString);
        throw new Error(errString);
    }

    // Sanity check: Print house edge
    console.log('House Edge:', (config.house_edge * 100).toString() + '%');
})();

////////////////////////////////////////////////////////////

if (config.force_https_redirect && window.location.protocol !== "https:") {
    window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
}

// Hoist it. It's impl'd at bottom of page.
var socket;

// :: Bool
function isRunningLocally() {
    return /^localhost/.test(window.location.host);
}

var el = React.DOM;

// Generates UUID for uniquely tagging components
var genUuid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

var helpers = {};

// For displaying HH:MM timestamp in chat
//
// String (Date JSON) -> String
helpers.formatDateToTime = function(dateJson) {
    var date = new Date(dateJson);
    return _.padLeft(date.getHours().toString(), 2, '0') +
        ':' +
        _.padLeft(date.getMinutes().toString(), 2, '0');
};

// Number -> Number in range (0, 1)
helpers.multiplierToWinProb = function(multiplier) {
    console.assert(typeof multiplier === 'number');
    console.assert(multiplier > 0);

    // For example, n is 0.99 when house edge is 1%
    var n = 1.0 - config.house_edge;

    return n / multiplier;
};

helpers.calcNumber = function(cond, winProb) {
    console.assert(cond === '<' || cond === '>');
    console.assert(typeof winProb === 'number');

    if (cond === '<') {
        return winProb * 100;
    } else {
        return 99.99 - (winProb * 100);
    }
};

helpers.roleToLabelElement = function(role) {
    switch (role) {
        case 'ADMIN':
            return el.span({
                className: 'label label-danger'
            }, 'MP Staff');
        case 'MOD':
            return el.span({
                className: 'label label-info'
            }, 'Mod');
        case 'OWNER':
            return el.span({
                className: 'label label-primary'
            }, 'Owner');
        default:
            return '';
    }
};

// -> Object
helpers.getHashParams = function() {
    var hashParams = {};
    var e,
        a = /\+/g, // Regex for replacing addition symbol with a space
        r = /([^&;=]+)=?([^&;]*)/g,
        d = function(s) {
            return decodeURIComponent(s.replace(a, " "));
        },
        q = window.location.hash.substring(1);
    while (e = r.exec(q))
        hashParams[d(e[1])] = d(e[2]);
    return hashParams;
};

// getPrecision('1') -> 0
// getPrecision('.05') -> 2
// getPrecision('25e-100') -> 100
// getPrecision('2.5e-99') -> 100
helpers.getPrecision = function(num) {
    var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    if (!match) {
        return 0;
    }
    return Math.max(
        0,
        // Number of digits right of decimal point.
        (match[1] ? match[1].length : 0) -
        // Adjust for scientific notation.
        (match[2] ? +match[2] : 0));
};

/**
 * Decimal adjustment of a number.
 *
 * @param {String}  type  The type of adjustment.
 * @param {Number}  value The number.
 * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
 * @returns {Number} The adjusted value.
 */
helpers.decimalAdjust = function(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
        return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
        return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}

helpers.round10 = function(value, exp) {
    return helpers.decimalAdjust('round', value, exp);
};

helpers.floor10 = function(value, exp) {
    return helpers.decimalAdjust('floor', value, exp);
};

helpers.ceil10 = function(value, exp) {
    return helpers.decimalAdjust('ceil', value, exp);
};

////////////////////////////////////////////////////////////

// A weak Moneypot API abstraction
//
// Moneypot's API docs: https://www.moneypot.com/api-docs
var MoneyPot = (function() {

    var o = {};

    o.apiVersion = 'v1';

    // method: 'GET' | 'POST' | ...
    // endpoint: '/tokens/abcd-efgh-...'
    var noop = function() {};
    var makeMPRequest = function(method, bodyParams, endpoint, callbacks, overrideOpts) {

        if (!worldStore.state.accessToken)
            throw new Error('Must have accessToken set to call MoneyPot API');

        var url = config.mp_api_uri + '/' + o.apiVersion + endpoint;

        if (worldStore.state.accessToken) {
            url = url + '?access_token=' + worldStore.state.accessToken;
        }

        var ajaxOpts = {
            url: url,
            dataType: 'json', // data type of response
            method: method,
            data: bodyParams ? JSON.stringify(bodyParams) : undefined,
            // By using text/plain, even though this is a JSON request,
            // we avoid preflight request. (Moneypot explicitly supports this)
            headers: {
                'Content-Type': 'text/plain'
            },
            // Callbacks
            success: callbacks.success || noop,
            error: callbacks.error || noop,
            complete: callbacks.complete || noop
        };

        $.ajax(_.merge({}, ajaxOpts, overrideOpts || {}));
    };

    o.listBets = function(callbacks) {
        var endpoint = '/list-bets';
        makeMPRequest('GET', undefined, endpoint, callbacks, {
            data: {
                app_id: config.app_id,
                limit: config.bet_buffer_size
            }
        });
    };

    o.getTokenInfo = function(callbacks) {
        var endpoint = '/token';
        makeMPRequest('GET', undefined, endpoint, callbacks);
    };

    o.generateBetHash = function(callbacks) {
        var endpoint = '/hashes';
        makeMPRequest('POST', undefined, endpoint, callbacks);
    };

    o.getDepositAddress = function(callbacks) {
        var endpoint = '/deposit-address';
        makeMPRequest('GET', undefined, endpoint, callbacks);
    };

    // gRecaptchaResponse is string response from google server
    // `callbacks.success` signature  is fn({ claim_id: Int, amoutn: Satoshis })
    o.claimFaucet = function(gRecaptchaResponse, callbacks) {
        console.log('Hitting POST /claim-faucet');
        var endpoint = '/claim-faucet';
        var body = {
            response: gRecaptchaResponse
        };
        makeMPRequest('POST', body, endpoint, callbacks);
    };
    
    
    o.tipUser = function(tippedUser, tippedAmount, callbacks) {
        var endpoint = '/tip';
        var body = {
            uname: tippedUser,
            amount: tippedAmount
        };
        makeMPRequest('POST', body, endpoint, callbacks);
    };

    // bodyParams is an object:
    // - wager: Int in satoshis
    // - client_seed: Int in range [0, 0^32)
    // - hash: BetHash
    // - cond: '<' | '>'
    // - number: Int in range [0, 99.99] that cond applies to
    // - payout: how many satoshis to pay out total on win (wager * multiplier)
    o.placeSimpleDiceBet = function(bodyParams, callbacks) {
        var endpoint = '/bets/simple-dice';
        makeMPRequest('POST', bodyParams, endpoint, callbacks);
    };

    return o;
})();

////////////////////////////////////////////////////////////

var Dispatcher = new(function() {
    // Map of actionName -> [Callback]
    this.callbacks = {};

    var self = this;

    // Hook up a store's callback to receive dispatched actions from dispatcher
    //
    // Ex: Dispatcher.registerCallback('NEW_MESSAGE', function(message) {
    //       console.log('store received new message');
    //       self.state.messages.push(message);
    //       self.emitter.emit('change', self.state);
    //     });
    this.registerCallback = function(actionName, cb) {
        console.log('[Dispatcher] registering callback for:', actionName);

        if (!self.callbacks[actionName]) {
            self.callbacks[actionName] = [cb];
        } else {
            self.callbacks[actionName].push(cb);
        }
    };

    this.sendAction = function(actionName, payload) {
        console.log('[Dispatcher] received action:', actionName, payload);
        // Ensure this action has 1+ registered callbacks
        if (!self.callbacks[actionName]) {
            throw new Error('Unsupported actionName: ' + actionName);
        }

        // Dispatch payload to each registered callback for this action
        self.callbacks[actionName].forEach(function(cb) {
            cb(payload);
        });
    };
});

////////////////////////////////////////////////////////////

var Store = function(storeName, initState, initCallback) {

    this.state = initState;
    this.emitter = new EventEmitter();

    // Execute callback immediately once store (above state) is setup
    // This callback should be used by the store to register its callbacks
    // to the dispatcher upon initialization
    initCallback.call(this);

    var self = this;

    // Allow components to listen to store events (i.e. its 'change' event)
    this.on = function(eventName, cb) {
        self.emitter.on(eventName, cb);
    };

    this.off = function(eventName, cb) {
        self.emitter.off(eventName, cb);
    };
};

////////////////////////////////////////////////////////////

// Manage access_token //////////////////////////////////////
//
// - If access_token is in url, save it into localStorage.
//   `expires_in` (seconds until expiration) will also exist in url
//   so turn it into a date that we can compare

var access_token, expires_in, expires_at;

if (helpers.getHashParams().access_token) {
    console.log('[token manager] access_token in hash params');
    access_token = helpers.getHashParams().access_token;
    expires_in = helpers.getHashParams().expires_in;
    expires_at = new Date(Date.now() + (expires_in * 1000));

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('expires_at', expires_at);
} else if (localStorage.access_token) {
    console.log('[token manager] access_token in localStorage');
    expires_at = localStorage.expires_at;
    // Only get access_token from localStorage if it expires
    // in a week or more. access_tokens are valid for two weeks
    if (expires_at && new Date(expires_at) > new Date(Date.now() + (1000 * 60 * 60 * 24 * 7))) {
        access_token = localStorage.access_token;
    } else {
        localStorage.removeItem('expires_at');
        localStorage.removeItem('access_token');
    }
} else {
    console.log('[token manager] no access token');
}

// Scrub fragment params from url.
if (window.history && window.history.replaceState) {
    window.history.replaceState({}, document.title, "/");
} else {
    // For browsers that don't support html5 history api, just do it the old
    // fashioned way that leaves a trailing '#' in the url
    window.location.hash = '#';
}

////////////////////////////////////////////////////////////

var chatStore = new Store('chat', {
    messages: new CBuffer(config.chat_buffer_size),
    waitingForServer: false,
    userList: {},
    showUserList: false,
    loadingInitialMessages: true
}, function() {
    var self = this;

    // `data` is object received from socket auth
    Dispatcher.registerCallback('INIT_CHAT', function(data) {
        console.log('[ChatStore] received INIT_CHAT');
        // Give each one unique id
        var messages = data.chat.messages.map(function(message) {
            message.id = genUuid();
            return message;
        });

        // Reset the CBuffer since this event may fire multiple times,
        // e.g. upon every reconnection to chat-server.
        self.state.messages.empty();

        self.state.messages.push.apply(self.state.messages, messages);

        // Indicate that we're done with initial fetch
        self.state.loadingInitialMessages = false;

        // Load userList
        self.state.userList = data.chat.userlist;
        self.emitter.emit('change', self.state);
        self.emitter.emit('init');
    });

    Dispatcher.registerCallback('NEW_MESSAGE', function(message) {
        console.log('[ChatStore] received NEW_MESSAGE');
        message.id = genUuid();
        self.state.messages.push(message);

        self.emitter.emit('change', self.state);
        self.emitter.emit('new_message');
    });

    Dispatcher.registerCallback('TOGGLE_CHAT_USERLIST', function() {
        console.log('[ChatStore] received TOGGLE_CHAT_USERLIST');
        self.state.showUserList = !self.state.showUserList;
        self.emitter.emit('change', self.state);
    });

    // user is { id: Int, uname: String, role: 'admin' | 'mod' | 'owner' | 'member' }
    Dispatcher.registerCallback('USER_JOINED', function(user) {
        console.log('[ChatStore] received USER_JOINED:', user);
        self.state.userList[user.uname] = user;
        self.emitter.emit('change', self.state);
    });

    // user is { id: Int, uname: String, role: 'admin' | 'mod' | 'owner' | 'member' }
    Dispatcher.registerCallback('USER_LEFT', function(user) {
        console.log('[ChatStore] received USER_LEFT:', user);
        delete self.state.userList[user.uname];
        self.emitter.emit('change', self.state);
    });

    // Message is { text: String }
    Dispatcher.registerCallback('SEND_MESSAGE', function(text) {
        console.log('[ChatStore] received SEND_MESSAGE');
        self.state.waitingForServer = true;
        self.emitter.emit('change', self.state);
        socket.emit('new_message', {
            text: text
        }, function(err) {
            if (err) {
                alert('Chat Error: ' + err);
            }
        });
    });
});

var betStore = new Store('bet', {
    nextHash: undefined,
    wager: {
        str: '1',
        num: 1,
        error: undefined
    },
    multiplier: {
        str: '2.00',
        num: 2.00,
        error: undefined
    },
    hotkeysEnabled: false
}, function() {
    var self = this;

    Dispatcher.registerCallback('SET_NEXT_HASH', function(hexString) {
        self.state.nextHash = hexString;
        self.emitter.emit('change', self.state);
    });

    Dispatcher.registerCallback('UPDATE_WAGER', function(newWager) {
        self.state.wager = _.merge({}, self.state.wager, newWager);

        var n = parseFloat(self.state.wager.str, 10);

        // If n is a number, ensure it's at least 1 bit
        if (isFinite(n)) {
            n = Math.max(n, 1);
            self.state.wager.str = n.toString();
        }
        var isFloatRegexp = /^(\d*\.)?\d+$/;
        // Ensure wagerString is a number
        if (isNaN(n) || !isFloatRegexp.test(n.toString())) {
            self.state.wager.error = 'INVALID_WAGER';
            // Ensure user can afford balance
        } else if (n * 100 > worldStore.state.user.balance) {
            self.state.wager.error = 'CANNOT_AFFORD_WAGER';
            self.state.wager.num = n;
        } else {
            // wagerString is valid
            self.state.wager.error = null;
            self.state.wager.str = n.toFixed(2).toString();
            self.state.wager.num = n;
        }

        self.emitter.emit('change', self.state);
    });

    Dispatcher.registerCallback('UPDATE_MULTIPLIER', function(newMult) {
        self.state.multiplier = _.merge({}, self.state.multiplier, newMult);
        self.emitter.emit('change', self.state);
    });
});

var jackPotStore = new Store('jackpot', {
    grand: {
        id: 0,
        value: grandJackpot,
        hashJP: '---'
        
    },
    major: {
        id: 0,
        value: majorJackpot,
        hashJP: '---'
        
    },
    minor: {
        id: 0,
        value: minorJackpot,
        hashJP: '---'
        
    }
}, function() {
    var self = this;

    Dispatcher.registerCallback('UPDATE_GRAND_JACKPOT', function(grand) {
        self.state.grand.value = grand.value;
        self.state.grand.id = grand.id;
        self.state.grand.hashJP = grand.hashJP;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('UPDATE_MAJOR_JACKPOT', function(major) {
        self.state.major.value = major.value;
        self.state.major.id = major.id;
        self.state.major.hashJP = major.hashJP;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('UPDATE_MINOR_JACKPOT', function(minor) {
        self.state.minor.value = minor.value;
        self.state.minor.id = minor.id;
        self.state.minor.hashJP = minor.hashJP;
        self.emitter.emit('change', self.state);
    });

});

var autoBetStore = new Store('autobet', {
    init: {
        wager: betStore.state.wager.num,
        multiplier: betStore.state.multiplier.num,
    },
    inUse: {
        wager: betStore.state.wager.num,
        multiplier: betStore.state.multiplier.num,
        resetAfterLoss: 0,
        switchAfterLoss: 0,
        stopAfterLoss: 0,
        resetAfterWin: 0,
        switchAfterWin: 0,
        stopAfterWin: 0,
        switchAfterBet: 0,
        stopAfter: 0,
        oldBetId: 0,
        switchTarget: true,
        firstBet: true,
        isResult: false
    },
    onLoss: {
        multiplier: 0,
        reset: 0,
        wager: 0,
        switchAfter: 0,
        stopAfter: 0,
        returnToBase: false
    },
    onWin: {
        multiplier: 0,
        reset: 0,
        wager: 0,
        switchAfter: 0,
        stopAfter: 0,
        returnToBase: false
    },
    stop: {
        greaterThan: 0,
        lowerThan: 0,
        switchAfter: 0,
        stopAfter: 0,
        resetWager: 0,
    },
    betCount: 0,
    profit: 0,
    button: false
}, function() {
    var self = this;

    Dispatcher.registerCallback('INIT_IN_USE_VALUES', function() {
        self.state.inUse.wager = betStore.state.wager.num;
        self.state.inUse.multiplier = betStore.state.multiplier.num;
        self.state.inUse.resetAfterLoss = 0;
        self.state.inUse.switchAfterLoss = 0;
        self.state.inUse.stopAfterLoss = 0;
        self.state.inUse.resetAfterWin = 0;
        self.state.inUse.switchAfterWin = 0;
        self.state.inUse.stopAfterWin = 0;
        self.state.inUse.switchAfterBet = 0;
        self.state.inUse.stopAfter = 0;
        self.state.inUse.oldBetId = 0;
        self.state.inUse.firstBet = true;
        self.state.inUse.isResult = false;
        self.state.betCount = 0;
        self.state.profit = 0;
        self.emitter.emit('change', self.state);
    });
    
    Dispatcher.registerCallback('ONLOSS_UPDATE_MULTIPLIER', function(newMult) {
        (isNaN(newMult)) ? newMult = 0: newMult;
        self.state.onLoss.multiplier = newMult;
        self.state.inUse.multiplier = newMult;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('ONLOSS_UPDATE_WAGER', function(newWager) {
        (isNaN(newWager)) ? newWager = 0: newWager;
        self.state.onLoss.wager = newWager;
        self.state.inUse.wager = newWager;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('ONLOSS_UPDATE_RESET', function(reset) {
        (isNaN(reset)) ? reset = 0: reset;
        self.state.onLoss.reset = reset;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('ONLOSS_UPDATE_SWITCH', function(switchAfter) {
        (isNaN(switchAfter)) ? switchAfter = 0: switchAfter;
        self.state.onLoss.switchAfter = switchAfter;
        self.emitter.emit('change', self.state);
    });    
    Dispatcher.registerCallback('ONLOSS_UPDATE_STOPAFTER', function(stopAfter) {
        (isNaN(stopAfter)) ? stopAfter = 0: stopAfter;
        self.state.onLoss.stopAfter = stopAfter;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('ONLOSS_UPDATE_RETURN', function(returnToBase) {
        self.state.onLoss.returnToBase = returnToBase;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('ONWIN_UPDATE_MULTIPLIER', function(newMult) {
        (isNaN(newMult)) ? newMult = 0: newMult;
        self.state.onWin.multiplier = newMult;
        self.state.inUse.multiplier = newMult;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('ONWIN_UPDATE_WAGER', function(newWager) {
        (isNaN(newWager)) ? newWager = 0: newWager;
        self.state.onWin.wager = newWager;
        self.state.inUse.wager = newWager;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('ONWIN_UPDATE_RESET', function(reset) {
        (isNaN(reset)) ? reset = 0: reset;
        self.state.onWin.reset = reset;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('ONWIN_UPDATE_SWTICH_', function(switchAfter) {
        (isNaN(switchAfter)) ? switchAfter = 0: switchAfter;
        self.state.onWin.switchAfter = switchAfter;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('ONWIN_UPDATE_STOPAFTER', function(stopAfter) {
        (isNaN(stopAfter)) ? stopAfter = 0: stopAfter;
        self.state.onWin.stopAfter = stopAfter;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('ONWIN_UPDATE_RETURN', function(returnToBase) {
        self.state.onWin.returnToBase = returnToBase;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('STOP_UPDATE_GREATER', function(greater) {
        (isNaN(greater)) ? greater = 0: greater;
        self.state.stop.greaterThan = greater;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('STOP_UPDATE_LOWER', function(lower) {
        (isNaN(lower)) ? lower = 0: lower;
        self.state.stop.lowerThan = lower;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('STOP_UPDATE_STOPAFTERBETS', function(stopAfter) {
        (isNaN(stopAfter)) ? stopAfter = 0: stopAfter;
        self.state.stop.stopAfter = stopAfter;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('STOP_UPDATE_RESETWAGER', function(resetWager) {
        (isNaN(resetWager)) ? resetWager = 0: resetWager;
        self.state.stop.resetWager = resetWager;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('STOP_UPDATE_SWITCHAFTERBETS', function(switchAfter) {
        (isNaN(switchAfter)) ? switchAfter = 0: switchAfter;
        self.state.stop.switchAfter = switchAfter;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('UPDATE_BETS_COUNT', function(betsCount) {
        self.state.betCount = betsCount;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('UPDATE_PROFIT_STRATEGY', function(profit) {
        (isNaN(profit)) ? profit = 0 : profit;
        self.state.profit = profit;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('SWITCH_TARGET', function(target) {
        self.state.inUse.switchTarget = target;
        self.emitter.emit('change', self.state);
    });
    Dispatcher.registerCallback('CHANGE_BUTTON', function(button) {
        self.state.button = button;
        self.emitter.emit('change', self.state);
        if (self.state.button) {
        	autoBetStore.state.init.wager = betStore.state.wager.num;
       		autoBetStore.state.init.multiplier = betStore.state.multiplier.num;
            StartAutoBet();
            
        } else {
        	clearInterval(timerId);
        	Dispatcher.sendAction('UPDATE_WAGER', {
            str: autoBetStore.state.init.wager
        });
        	Dispatcher.sendAction('UPDATE_MULTIPLIER', {
            str: autoBetStore.state.init.multiplier
        });
        	updateMultiplier(autoBetStore.state.init.multiplier);
            
        }
    });
});


// The general store that holds all things until they are separated
// into smaller stores for performance.
var worldStore = new Store('world', {
    isLoading: true,
    user: undefined,
    accessToken: access_token,
    isRefreshingUser: false,
    hotkeysEnabled: false,
    currTab: 'ALL_BETS',
    // TODO: Turn this into myBets or something
    bets: new CBuffer(config.bet_buffer_size),
    // TODO: Fetch list on load alongside socket subscription
    allBets: new CBuffer(config.bet_buffer_size),
    historyJackpots: new CBuffer(config.bet_buffer_size),
    // Last Roll 
    lastRoll: undefined,
    grecaptcha: undefined,
    pageFAQ: false
}, function() {
    var self = this;

    // TODO: Consider making these emit events unique to each callback
    // for more granular reaction.

    // data is object, note, assumes user is already an object
    Dispatcher.registerCallback('UPDATE_USER', function(data) {
        self.state.user = _.merge({}, self.state.user, data);
        self.emitter.emit('change', self.state);
    });

    // deprecate in favor of SET_USER
    Dispatcher.registerCallback('USER_LOGIN', function(user) {
        self.state.user = user;
        self.emitter.emit('change', self.state);
        self.emitter.emit('user_update');
    });

    // Replace with CLEAR_USER
    Dispatcher.registerCallback('USER_LOGOUT', function() {
        self.state.user = undefined;
        self.state.accessToken = undefined;
        localStorage.removeItem('expires_at');
        localStorage.removeItem('access_token');
        self.state.bets.empty();
        self.emitter.emit('change', self.state);
    });

    Dispatcher.registerCallback('START_LOADING', function() {
        self.state.isLoading = true;
        self.emitter.emit('change', self.state);
    });

    Dispatcher.registerCallback('STOP_LOADING', function() {
        self.state.isLoading = false;
        self.emitter.emit('change', self.state);
    });

    Dispatcher.registerCallback('CHANGE_TAB', function(tabName) {
        console.assert(typeof tabName === 'string');
        self.state.currTab = tabName;
        self.emitter.emit('change', self.state);
    });

    // This is only for my bets? Then change to 'NEW_MY_BET'
    Dispatcher.registerCallback('NEW_BET', function(bet) {
        console.assert(typeof bet === 'object');
        self.state.bets.push(bet);
        self.state.lastRoll = bet;
        function rsp(call) {
            console.log('Informatii', call);
            //initJack();
        }
            
        document.cookie="betid="+bet.id+";";
        httpGetAsync(config.jackpot_increase + bet.id, rsp);
       // initJack();
        self.emitter.emit('change', self.state);
        BalanceColor(bet.profit);
    });

    Dispatcher.registerCallback('NEW_ALL_BET', function(bet) {
        self.state.allBets.push(bet);
       // initJack();
        self.emitter.emit('change', self.state);
    });

    Dispatcher.registerCallback('INIT_ALL_BETS', function(bets) {
        console.assert(_.isArray(bets));
        self.state.allBets.push.apply(self.state.allBets, bets);
        self.emitter.emit('change', self.state);
    });
    
    Dispatcher.registerCallback('NEW_ALL_HISTORY_JACKPOTS', function(jackpot) {
        self.state.historyJackpots.push(jackpot);
        self.emitter.emit('change', self.state);
    });
    
    Dispatcher.registerCallback('INIT_ALL_HISTORY_JACKPOTS', function(jackpots) {
        console.assert(_.isArray(jackpots));
        self.state.historyJackpots.push.apply(self.state.historyJackpots, jackpots);
        self.emitter.emit('change', self.state);
    });

    Dispatcher.registerCallback('TOGGLE_HOTKEYS', function() {
        self.state.hotkeysEnabled = !self.state.hotkeysEnabled;
        self.emitter.emit('change', self.state);
    });

    Dispatcher.registerCallback('DISABLE_HOTKEYS', function() {
        self.state.hotkeysEnabled = false;
        self.emitter.emit('change', self.state);
    });

    Dispatcher.registerCallback('START_REFRESHING_USER', function() {
        self.state.isRefreshingUser = true;
        self.emitter.emit('change', self.state);
        MoneyPot.getTokenInfo({
            success: function(data) {
                console.log('Successfully loaded user from tokens endpoint', data);
                var user = data.auth.user;
                self.state.user = user;
                self.emitter.emit('change', self.state);
                self.emitter.emit('user_update');
            },
            error: function(err) {
                console.log('Error:', err);
            },
            complete: function() {
                Dispatcher.sendAction('STOP_REFRESHING_USER');
            }
        });
    });

    Dispatcher.registerCallback('STOP_REFRESHING_USER', function() {
        self.state.isRefreshingUser = false;
        self.emitter.emit('change', self.state);
    });
    
    Dispatcher.registerCallback('PAGE_FAQ', function() {
        (self.state.pageFAQ) ? self.state.pageFAQ = false : self.state.pageFAQ = true;
        self.emitter.emit('change', self.state);
    });

    Dispatcher.registerCallback('GRECAPTCHA_LOADED', function(_grecaptcha) {
        self.state.grecaptcha = _grecaptcha;
        self.emitter.emit('grecaptcha_loaded');
    });

});

////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////

var UserBox = React.createClass({
    displayName: 'UserBox',
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        worldStore.on('change', this._onStoreChange);
        betStore.on('change', this._onStoreChange);
    },
    componentWillUnount: function() {
        worldStore.off('change', this._onStoreChange);
        betStore.off('change', this._onStoreChange);
    },
    _onLogout: function() {
        Dispatcher.sendAction('USER_LOGOUT');
    },
    _onRefreshUser: function() {
        Dispatcher.sendAction('START_REFRESHING_USER');
    },
    _openWithdrawPopup: function() {
        var windowUrl = config.mp_browser_uri + '/dialog/withdraw?app_id=' + config.app_id;
        var windowName = 'manage-auth';
        var windowOpts = [
            'width=420',
            'height=350',
            'left=100',
            'top=100'
        ].join(',');
        var windowRef = window.open(windowUrl, windowName, windowOpts);
        windowRef.focus();
        return false;
    },
    _openDepositPopup: function() {
        var windowUrl = config.mp_browser_uri + '/dialog/deposit?app_id=' + config.app_id;
        var windowName = 'manage-auth';
        var windowOpts = [
            'width=420',
            'height=350',
            'left=100',
            'top=100'
        ].join(',');
        var windowRef = window.open(windowUrl, windowName, windowOpts);
        windowRef.focus();
        return false;
    },
    render: function() {

        var innerNode;
        if (worldStore.state.isLoading) {
            innerNode = el.p({
                    className: 'navbar-text'
                },
                'Loading...'
            );
        } else if (worldStore.state.user) {
            innerNode = el.div(
                null,
                // Deposit/Withdraw popup buttons
                el.div({
                        className: 'btn-group navbar-left btn-group-xs'
                    },
                    el.button({
                            type: 'button',
                            className: 'btn navbar-btn btn-xs ' + (betStore.state.wager.error === 'CANNOT_AFFORD_WAGER' ? 'btn-success' : 'btn-default'),
                            onClick: this._openDepositPopup
                        },
                        'Deposit'
                    ),
                    el.button({
                            type: 'button',
                            className: 'btn btn-default navbar-btn btn-xs',
                            onClick: this._openWithdrawPopup
                        },
                        'Withdraw'
                    )
                ),
                // Balance

                el.span({
                        className: 'balance-text',
                        style: {
                            marginRight: '5px'
                        }
                    },
                    (worldStore.state.user.balance / 100) + ' bits', !worldStore.state.user.unconfirmed_balance ?
                    '' :
                    el.span({
                            style: {
                                color: '#e67e22'
                            }
                        },
                        ' + ' + (worldStore.state.user.unconfirmed_balance / 100) + ' bits pending'
                    )
                ),
                // Refresh button
                el.button({
                        className: 'btn btn-link navbar-btn navbar-left ' + (worldStore.state.isRefreshingUser ? ' rotate' : ''),
                        title: 'Refresh Balance',
                        disabled: worldStore.state.isRefreshingUser,
                        onClick: this._onRefreshUser,
                        style: {
                            paddingLeft: 0,
                            paddingRight: 0,
                            marginRight: '10px'
                        }
                    },
                    el.span({
                        className: 'glyphicon glyphicon-refresh'
                    })
                ),
                // Logged in as...
                el.span({
                        className: 'navbar-text'
                    },
                    'Logged in as ',
                    el.code(null, worldStore.state.user.uname)
                ),
                // Logout button
                el.button({
                        type: 'button',
                        onClick: this._onLogout,
                        className: 'navbar-btn btn btn-default'
                    },
                    'Logout'
                )
            );
        } else {
            // User needs to login
            innerNode = el.p({
                    className: 'navbar-text'
                },
                el.a({
                        href: config.mp_browser_uri + '/oauth/authorize' +
                            '?app_id=' + config.app_id +
                            '&redirect_uri=' + config.redirect_uri,
                        className: 'btn btn-default'
                    },
                    'Login with Moneypot'
                )
            );
        }

        return el.div({
                className: 'navbar-right'
            },
            innerNode
        );
    }
});

var Navbar = React.createClass({
    displayName: 'Navbar',
    _onClickFAQ: function(){
        Dispatcher.sendAction('PAGE_FAQ',null);
    },
    render: function() {
        return el.div({
                className: 'navbar'
            },
            el.div({
                    className: 'container-fluid'
                },
                el.div({
                        className: 'navbar-header'
                    },
                    el.a({
                        className: 'navbar-brand',
                        href: '/'
                    }, el.img({
                        src: 'img/logo.png',
                        width: '200',
                        height: '50'
                    }))
                ),
                // Links
                el.ul({
                        className: 'nav navbar-nav'
                    },
                    el.li(
                        null,
                        el.a({
                                href: config.mp_browser_uri + '/apps/' + config.app_id,
                                target: '_blank'
                            },
                            'View on Moneypot ',
                            // External site glyphicon
                            el.span({
                                className: 'glyphicon glyphicon-new-window'
                            })
                        )
                    )
                ),
                el.ul({
                        className: 'nav navbar-nav noselect'
                    },
                    el.li(
                        null,
                        el.a({
                                onClick:this._onClickFAQ
                            },
                            'FAQ'
                        )
                    )
                ),
                // Userbox
                React.createElement(UserBox, null)
            )
        );
    }
});

var ChatBoxInput = React.createClass({
    displayName: 'ChatBoxInput',
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        chatStore.on('change', this._onStoreChange);
        worldStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        chatStore.off('change', this._onStoreChange);
        worldStore.off('change', this._onStoreChange);
    },
    //
    getInitialState: function() {
        return {
            text: ''
        };
    },
    // Whenever input changes
    _onChange: function(e) {
        this.setState({
            text: e.target.value
        });
    },
    // When input contents are submitted to chat server
    _onSend: function() {
        var self = this;
        Dispatcher.sendAction('SEND_MESSAGE', this.state.text);
        this.setState({
            text: ''
        });
        sendTips(this.state.text);
    },
    _onFocus: function() {
        // When users click the chat input, turn off bet hotkeys so they
        // don't accidentally bet
        if (worldStore.state.hotkeysEnabled) {
            Dispatcher.sendAction('DISABLE_HOTKEYS');
        }
    },
    _onKeyPress: function(e) {
        var ENTER = 13;
        if (e.which === ENTER) {
            if (this.state.text.trim().length > 0) {
                this._onSend();
            }
        }
    },
    render: function() {
        return (
            el.div({
                    className: 'row'
                },
                el.div({
                        className: 'col-md-9'
                    },
                    chatStore.state.loadingInitialMessages ?
                    el.div({
                            style: {
                                marginTop: '7px'
                            },
                            className: 'text-muted'
                        },
                        el.span({
                            className: 'glyphicon glyphicon-refresh rotate'
                        }),
                        ' Loading...'
                    ) :
                    el.input({
                        id: 'chat-input',
                        className: 'form-control',
                        type: 'text',
                        value: this.state.text,
                        placeholder: worldStore.state.user ?
                            'Click here and begin typing...' : 'Login to chat',
                        onChange: this._onChange,
                        onKeyPress: this._onKeyPress,
                        onFocus: this._onFocus,
                        ref: 'input',
                        // TODO: disable while fetching messages
                        disabled: !worldStore.state.user || chatStore.state.loadingInitialMessages
                    })
                ),
                el.div({
                        className: 'col-md-3'
                    },
                    el.button({
                            type: 'button',
                            className: 'btn btn-default btn-block',
                            disabled: !worldStore.state.user ||
                                chatStore.state.waitingForServer ||
                                this.state.text.trim().length === 0,
                            onClick: this._onSend
                        },
                        'Send'
                    )
                )
            )
        );
    }
});

var ChatUserList = React.createClass({
    displayName: 'ChatUserList',
    render: function() {
        return (
            el.div({
                    className: 'panel panel-default'
                },
                el.div({
                        className: 'panel-heading'
                    },
                    'UserList'
                ),
                el.div({
                        className: 'panel-body'
                    },
                    el.ul({},
                        _.values(chatStore.state.userList).map(function(u) {
                            return el.li({
                                    key: u.uname
                                },
                                helpers.roleToLabelElement(u.role),
                                ' ' + u.uname
                            );
                        })
                    )
                )
            )
        );
    }
});

var ChatBox = React.createClass({
    displayName: 'ChatBox',
    _onStoreChange: function() {
        this.forceUpdate();
    },
    // New messages should only force scroll if user is scrolled near the bottom
    // already. This allows users to scroll back to earlier convo without being
    // forced to scroll to bottom when new messages arrive
    _onNewMessage: function() {
        var node = this.refs.chatListRef.getDOMNode();

        // Only scroll if user is within 100 pixels of last message
        var shouldScroll = function() {
            var distanceFromBottom = node.scrollHeight - ($(node).scrollTop() + $(node).innerHeight());
            console.log('DistanceFromBottom:', distanceFromBottom);
            return distanceFromBottom <= 100;
        };

        if (shouldScroll()) {
            this._scrollChat();
        }
    },
    _scrollChat: function() {
        var node = this.refs.chatListRef.getDOMNode();
        $(node).scrollTop(node.scrollHeight);
    },
    componentDidMount: function() {
        chatStore.on('change', this._onStoreChange);
        chatStore.on('new_message', this._onNewMessage);
        chatStore.on('init', this._scrollChat);
    },
    componentWillUnmount: function() {
        chatStore.off('change', this._onStoreChange);
        chatStore.off('new_message', this._onNewMessage);
        chatStore.off('init', this._scrollChat);
    },
    //
    _onUserListToggle: function() {
        Dispatcher.sendAction('TOGGLE_CHAT_USERLIST');
    },
    render: function() {
        return el.div({
                id: 'chat-box'
            },
            el.div({
                    className: 'panel panel-default'
                },
                el.div({
                        className: 'panel-body'
                    },
                    el.ul({
                            className: 'chat-list list-unstyled',
                            ref: 'chatListRef'
                        },
                        chatStore.state.messages.toArray().map(function(m) {
                            return el.li({
                                    // Use message id as unique key
                                    key: m.id
                                },
                                el.span({
                                        style: {
                                            fontFamily: 'monospace'
                                        }
                                    },
                                    helpers.formatDateToTime(m.created_at),
                                    ' '
                                ),
                                m.user ? helpers.roleToLabelElement(m.user.role) : '',
                                m.user ? ' ' : '',
                                el.code(
                                    null,
                                    m.user ?
                                    // If chat message:
                                    m.user.uname :
                                    // If system message:
                                    'SYSTEM :: ' + m.text
                                ),
                                m.user ?
                                // If chat message
                                el.span(null, ' ' + m.text) :
                                // If system message
                                ''
                            );
                        })
                    )
                ),
                el.div({
                        className: 'panel-footer'
                    },
                    React.createElement(ChatBoxInput, null)
                )
            ),
            // After the chatbox panel
            el.p({
                    className: 'text-right text-muted',
                    style: {
                        marginTop: '-15px'
                    }
                },
                'Users online: ' + Object.keys(chatStore.state.userList).length + ' ',
                // Show/Hide userlist button
                el.button({
                        className: 'btn btn-default btn-xs',
                        onClick: this._onUserListToggle
                    },
                    chatStore.state.showUserList ? 'Hide' : 'Show'
                )
            ),
            // Show userlist
            chatStore.state.showUserList ? React.createElement(ChatUserList, null) : ''
        );
    }
});

var BetBoxChance = React.createClass({
    displayName: 'BetBoxChance',
    // Hookup to stores
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        betStore.on('change', this._onStoreChange);
        worldStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        betStore.off('change', this._onStoreChange);
        worldStore.off('change', this._onStoreChange);
    },
    //
    render: function() {
        // 0.00 to 1.00
        var winProb = helpers.multiplierToWinProb(betStore.state.multiplier.num);

        var isError = betStore.state.multiplier.error || betStore.state.wager.error;

        // Just show '--' if chance can't be calculated
        var innerNode;
        if (isError) {
            innerNode = el.span({
                    className: 'lead'
                },
                ' --'
            );
        } else {
            innerNode = el.span({
                    className: 'lead'
                },
                ' ' + (winProb * 100).toFixed(2).toString() + '%'
            );
        }

        return el.div({},
            el.span({
                    className: 'lead',
                    style: {
                        fontWeight: 'bold'
                    }
                },
                'Chance:'
            ),
            innerNode
        );
    }
});

var BetBoxProfit = React.createClass({
    displayName: 'BetBoxProfit',
    // Hookup to stores
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        betStore.on('change', this._onStoreChange);
        worldStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        betStore.off('change', this._onStoreChange);
        worldStore.off('change', this._onStoreChange);
    },
    //
    render: function() {
        var profit = betStore.state.wager.num * (betStore.state.multiplier.num - 1);

        var innerNode;
        if (betStore.state.multiplier.error || betStore.state.wager.error) {
            innerNode = el.span({
                    className: 'lead'
                },
                '--'
            );
        } else {
            innerNode = el.span({
                    className: 'lead',
                    style: {
                        color: '#39b54a'
                    }
                },
                '+' + profit.toFixed(2)
            );
        }

        return el.div(
            null,
            el.span({
                    className: 'lead',
                    style: {
                        fontWeight: 'bold'
                    }
                },
                'Profit: '
            ),
            innerNode
        );
    }
});

var BetBoxMultiplier = React.createClass({
    displayName: 'BetBoxMultiplier',
    // Hookup to stores
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        betStore.on('change', this._onStoreChange);
        autoBetStore.on('change', this._onStoreChange);
        worldStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        betStore.off('change', this._onStoreChange);
        autoBetStore.on('change', this._onStoreChange);
        worldStore.off('change', this._onStoreChange);
    },
    //
    _validateMultiplier: function(newStr) {
        var num = parseFloat(newStr, 10);

        // If num is a number, ensure it's at least 0.01x
        // if (Number.isFinite(num)) {
        //   num = Math.max(num, 0.01);
        //   this.props.currBet.setIn(['multiplier', 'str'], num.toString());
        // }

        var isFloatRegexp = /^(\d*\.)?\d+$/;

        // Ensure str is a number
        if (isNaN(num) || !isFloatRegexp.test(newStr)) {
            Dispatcher.sendAction('UPDATE_MULTIPLIER', {
                error: 'INVALID_MULTIPLIER'
            });
            // Ensure multiplier is >= 1.00x
        } else if (num < 1.01) {
            Dispatcher.sendAction('UPDATE_MULTIPLIER', {
                error: 'MULTIPLIER_TOO_LOW'
            });
            // Ensure multiplier is <= max allowed multiplier (100x for now)
        } else if (num > 9900) {
            Dispatcher.sendAction('UPDATE_MULTIPLIER', {
                error: 'MULTIPLIER_TOO_HIGH'
            });
            // Ensure no more than 2 decimal places of precision
        } else if (helpers.getPrecision(num) > 2) {
            Dispatcher.sendAction('UPDATE_MULTIPLIER', {
                error: 'MULTIPLIER_TOO_PRECISE'
            });
            // multiplier str is valid
        } else {
            Dispatcher.sendAction('UPDATE_MULTIPLIER', {
                num: num,
                error: null
            });
        }
    },
    _onMultiplierChange: function(e) {
        console.log('Multiplier changed');
        var str = e.target.value;
        console.log('You entered', str, 'as your multiplier');
        Dispatcher.sendAction('UPDATE_MULTIPLIER', {
            str: str
        });
        this._validateMultiplier(str);
    },
    render: function() {
        return el.div({
                className: 'form-group'
            },
            el.p({
                    className: 'lead'
                },
                el.strong({
                        style: betStore.state.multiplier.error ? {
                            color: 'red'
                        } : {}
                    },
                    'Multiplier:')
            ),
            el.div({
                    className: 'input-group'
                },
                el.input({
                    type: 'text',
                    value: betStore.state.multiplier.str,
                    className: 'form-control input-lg',
                    onChange: this._onMultiplierChange,
                    disabled: !!worldStore.state.isLoading || autoBetStore.state.button
                }),
                el.span({
                        className: 'input-group-addon'
                    },
                    'x'
                )
            )
        );
    }
});

var BetBoxWager = React.createClass({
    displayName: 'BetBoxWager',
    // Hookup to stores
    _onStoreChange: function() {
        this.forceUpdate();
    },
    _onBalanceChange: function() {
        // Force validation when user logs in
        // TODO: Re-force it when user refreshes
        Dispatcher.sendAction('UPDATE_WAGER', {});
    },
    componentDidMount: function() {
        betStore.on('change', this._onStoreChange);
        autoBetStore.on('change', this._onStoreChange);
        worldStore.on('change', this._onStoreChange);
        worldStore.on('user_update', this._onBalanceChange);
    },
    componentWillUnmount: function() {
        betStore.off('change', this._onStoreChange);
        autoBetStore.off('change', this._onStoreChange);
        worldStore.off('change', this._onStoreChange);
        worldStore.off('user_update', this._onBalanceChange);
    },
    _onWagerChange: function(e) {
        var str = e.target.value;
        Dispatcher.sendAction('UPDATE_WAGER', {
            str: str
        });
    },
    _onHalveWager: function() {
        var newWager = betStore.state.wager.num / 2;
        Dispatcher.sendAction('UPDATE_WAGER', {
            str: newWager.toString()
        });
    },
    _onDoubleWager: function() {
        var n = betStore.state.wager.num * 2;
        Dispatcher.sendAction('UPDATE_WAGER', {
            str: n.toString()
        });

    },
    _onMaxWager: function() {
        // If user is logged in, use their balance as max wager
        var balanceBits;
        if (worldStore.state.user) {
            balanceBits = Math.floor(worldStore.state.user.balance / 100);
        } else {
            balanceBits = 42000;
        }
        Dispatcher.sendAction('UPDATE_WAGER', {
            str: balanceBits.toString()
        });
    },
    //
    render: function() {
        var style1 = {
            borderBottomLeftRadius: '0',
            borderBottomRightRadius: '0'
        };
        var style2 = {
            borderTopLeftRadius: '0'
        };
        var style3 = {
            borderTopRightRadius: '0'
        };
        return el.div({
                className: 'form-group'
            },
            el.p({
                    className: 'lead'
                },
                el.strong(
                    // If wagerError, make the label red
                    betStore.state.wager.error ? {
                        style: {
                            color: 'red'
                        }
                    } : null,
                    'Wager:')
            ),
            el.input({
                value: betStore.state.wager.str,
                type: 'text',
                className: 'form-control input-lg',
                style: style1,
                onChange: this._onWagerChange,
                disabled: !!worldStore.state.isLoading || autoBetStore.state.button,
                placeholder: 'Bits'
            }),
            el.div({
                    className: 'btn-group btn-group-justified'
                },
                el.div({
                        className: 'btn-group'
                    },
                    el.button({
                            className: 'btn btn-default btn-md',
                            type: 'button',
                            style: style2,
                            onClick: this._onHalveWager
                        },
                        '1/2x ', worldStore.state.hotkeysEnabled ? el.kbd(null, 'X') : ''
                    )
                ),
                el.div({
                        className: 'btn-group'
                    },
                    el.button({
                            className: 'btn btn-default btn-md',
                            type: 'button',
                            onClick: this._onDoubleWager
                        },
                        '2x ', worldStore.state.hotkeysEnabled ? el.kbd(null, 'C') : ''
                    )
                ),
                el.div({
                        className: 'btn-group'
                    },
                    el.button({
                            className: 'btn btn-default btn-md',
                            type: 'button',
                            style: style3,
                            onClick: this._onMaxWager
                        },
                        'Max'
                    )
                )
            )
        );
    }
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
var BetBoxButton = React.createClass({
    displayName: 'BetBoxButton',
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        worldStore.on('change', this._onStoreChange);
        betStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        worldStore.off('change', this._onStoreChange);
        betStore.off('change', this._onStoreChange);
    },
    getInitialState: function() {
        return {
            waitingForServer: false
        };
    },
    // cond is '>' or '<'
    _makeBetHandler: function(cond) {
        var self = this;

        console.assert(cond === '<' || cond === '>');

        return function(e) {
            console.log('Placing bet...');

            // Indicate that we are waiting for server response
            self.setState({
                waitingForServer: true
            });

            var hash = betStore.state.nextHash;
            console.assert(typeof hash === 'string');

            var wagerSatoshis = betStore.state.wager.num * 100;
            var multiplier = betStore.state.multiplier.num;
            var payoutSatoshis = wagerSatoshis * multiplier;

            var number = helpers.calcNumber(
                cond, helpers.multiplierToWinProb(multiplier)
            );
            var seed = getRandomInt(0,999999999);
            var params = {
                wager: wagerSatoshis,
                client_seed: seed, 
                hash: hash,
                cond: cond,
                target: number,
                payout: payoutSatoshis
            };

            MoneyPot.placeSimpleDiceBet(params, {
                success: function(bet) {
                    console.log('Successfully placed bet:', bet);
                    // Append to bet list

                    // We don't get this info from the API, so assoc it for our use
                    bet.meta = {
                        cond: cond,
                        number: number,
                        hash: hash,
                        isFair: CryptoJS.SHA256(bet.secret + '|' + bet.salt).toString() === hash
                    };

                    // Sync up with the bets we get from socket
                    bet.wager = wagerSatoshis;
                    bet.uname = worldStore.state.user.uname;
                    document.cookie="betwager="+bet.wager+";";
                    document.cookie="username="+bet.uname+";";
                    Dispatcher.sendAction('NEW_BET', bet);

                    // Update next bet hash
                    Dispatcher.sendAction('SET_NEXT_HASH', bet.next_hash);

                    // Update user balance
                    Dispatcher.sendAction('UPDATE_USER', {
                        balance: worldStore.state.user.balance + bet.profit
                    });
                },
                error: function(xhr) {
                    console.log('Error');
                    if (xhr.responseJSON && xhr.responseJSON) {
                        autoBetStore.state.button = false;
                        clearInterval(timerId);
                        alert(xhr.responseJSON.error);
                    } else {
                        autoBetStore.state.button = false;
                        clearInterval(timerId);
                        alert('Internal Error');

                    }
                },
                complete: function() {
                    self.setState({
                        waitingForServer: false
                    });
                    // Force re-validation of wager
                    Dispatcher.sendAction('UPDATE_WAGER', {
                        str: betStore.state.wager.str
                    });
                }
            });
        };
    },
    render: function() {
        var innerNode;

        // TODO: Create error prop for each input
        var error = betStore.state.wager.error || betStore.state.multiplier.error;

        if (worldStore.state.isLoading) {
            // If app is loading, then just disable button until state change
            innerNode = el.button({
                    type: 'button',
                    disabled: true,
                    className: 'btn btn-lg btn-block btn-default'
                },
                'Loading...'
            );
        } else if (error) {
            // If there's a betbox error, then render button in error state

            var errorTranslations = {
                'CANNOT_AFFORD_WAGER': 'You cannot afford wager',
                'INVALID_WAGER': 'Invalid wager',
                'INVALID_MULTIPLIER': 'Invalid multiplier',
                'MULTIPLIER_TOO_PRECISE': 'Multiplier too precise',
                'MULTIPLIER_TOO_HIGH': 'Multiplier too high',
                'MULTIPLIER_TOO_LOW': 'Multiplier too low'
            };

            innerNode = el.button({
                    type: 'button',
                    disabled: true,
                    className: 'btn btn-lg btn-block btn-danger'
                },
                errorTranslations[error] || 'Invalid bet'
            );
        } else if (worldStore.state.user) {
            // If user is logged in, let them submit bet
            innerNode =
                el.div({
                        className: 'row'
                    },
                    // bet hi
                    el.div({
                            className: 'col-xs-6'
                        },
                        el.button({
                                id: 'bet-hi',
                                type: 'button',
                                className: 'btn btn-lg btn-primary btn-block',
                                onClick: this._makeBetHandler('>'),
                                disabled: !!this.state.waitingForServer
                            },
                            'Bet Hi ', worldStore.state.hotkeysEnabled ? el.kbd(null, 'H') : ''
                        )
                    ),
                    // bet lo
                    el.div({
                            className: 'col-xs-6'
                        },
                        el.button({
                                id: 'bet-lo',
                                type: 'button',
                                className: 'btn btn-lg btn-primary btn-block',
                                onClick: this._makeBetHandler('<'),
                                disabled: !!this.state.waitingForServer
                            },
                            'Bet Lo ', worldStore.state.hotkeysEnabled ? el.kbd(null, 'L') : ''
                        )
                    )
                );
        } else {
            // If user isn't logged in, give them link to /oauth/authorize
            innerNode = el.a({
                    href: config.mp_browser_uri + '/oauth/authorize' +
                        '?app_id=' + config.app_id +
                        '&redirect_uri=' + config.redirect_uri,
                    className: 'btn btn-lg btn-block btn-success'
                },
                'Login with MoneyPot'
            );
        }

        return el.div(
            null,
            el.div({
                    className: 'col-md-2',
                },
                (this.state.waitingForServer) ?
                el.span({
                    className: 'glyphicon glyphicon-refresh rotate',
                    style: {
                        marginTop: '15px'
                    }
                }) : ''
            ),
            el.div({
                    className: 'col-md-8'
                },
                innerNode
            )
        );
    }
});

var HotkeyToggle = React.createClass({
    displayName: 'HotkeyToggle',
    _onClick: function() {
        Dispatcher.sendAction('TOGGLE_HOTKEYS');
    },
    render: function() {
        return (
            el.div({
                    className: 'text-center'
                },
                el.button({
                        type: 'button',
                        className: 'btn btn-default btn-sm',
                        onClick: this._onClick,
                        style: {
                            marginTop: '-15px'
                        }
                    },
                    'Hotkeys: ',
                    worldStore.state.hotkeysEnabled ?
                    el.span({
                        className: 'label label-success'
                    }, 'ON') :
                    el.span({
                        className: 'label label-default'
                    }, 'OFF')
                )
            )
        );
    }
});

var BetBox = React.createClass({
    displayName: 'BetBox',
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        worldStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        worldStore.off('change', this._onStoreChange);
    },
    render: function() {
        return el.div(
            null,
            el.div({
                    className: 'panel panel-default'
                },
                el.div({
                        className: 'panel-body'
                    },
                    el.div({
                            className: 'row'
                        },
                        el.div({
                                className: 'col-xs-6'
                            },
                            React.createElement(BetBoxWager, null)
                        ),
                        el.div({
                                className: 'col-xs-6'
                            },
                            React.createElement(BetBoxMultiplier, null)
                        ),
                        // HR
                        el.div({
                                className: 'row'
                            },
                            el.div({
                                    className: 'col-xs-12'
                                },
                                el.hr(null)
                            )
                        ),
                        // Bet info bar
                        el.div(
                            null,
                            el.div({
                                    className: 'col-sm-6'
                                },
                                React.createElement(BetBoxProfit, null)
                            ),
                            el.div({
                                    className: 'col-sm-6'
                                },
                                React.createElement(BetBoxChance, null)
                            )
                        )
                    )
                ),
                el.div({
                        className: 'panel-footer clearfix'
                    },
                    React.createElement(BetBoxButton, null)
                )
            ),
            React.createElement(HotkeyToggle, null)
        );
    }
});

var Animation = React.createClass({
    displayName: 'Animation',
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        worldStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        worldStore.off('change', this._onStoreChange);
    },
    checkBet: function() {
        if (worldStore.state.lastRoll != null) {
            if (worldStore.state.lastRoll.id != lastBetId) {
                if (worldStore.state.lastRoll.profit > 0) {

                    $('#animation').addClass('winBet');
                    $('#animation').animateCss('tada');

                } else if (worldStore.state.lastRoll.profit < 0) {
                    $('#animation').addClass('lossBet');
                    $('#animation').animateCss('wobble');
                }

            }
            lastBetId = worldStore.state.lastRoll.id;
            return worldStore.state.lastRoll.outcome
        } else {
            return
        }
    },
    render: function() {
        return el.div(
            null,
            el.div({
                    id: 'animation',
                },
                this.checkBet() || ''




            )



        );
    }
});


var JackpotBox = React.createClass({
    displayName: 'JackpotBox',
    _onStoreChange: function() {
        this.forceUpdate();

    },
    componentDidMount: function() {
        worldStore.on('change', this._onStoreChange);
        jackPotStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        worldStore.off('change', this._onStoreChange);
        jackPotStore.off('change', this._onStoreChange);
    },

    render: function() {
        return el.div(
            null,
            el.div({
                    className: 'panel panel-default'
                },
                el.div({
                        className: 'panel-body'
                    },
                    //GRAND Jackpot
                    el.div({
                            className: 'row'
                        },
                        el.div({
                                id: 'grand-text',
                                className: 'col-xs-6'
                            }, 'GRAND Jackpot',
                            el.span({id: 'hashLabel'},
                            jackPotStore.state.grand.hashJP)

                        )),
                    el.div({
                            className: 'row'
                        },
                        el.div({
                                id: 'grand',
                                className: 'col-xs-6'
                            }, jackPotStore.state.grand.value + '  bits'

                        )),
                    //MAJOR Jackpot
                    el.div({
                            className: 'row'
                        },
                        el.div({
                                id: 'major-text',
                                className: 'col-xs-6'
                            }, 'MAJOR Jackpot',
                            el.span({id: 'hashLabel'},
                            jackPotStore.state.major.hashJP)

                        )),
                    el.div({
                            className: 'row'
                        },
                        el.div({
                                id: 'major',
                                className: 'col-xs-6'
                            }, jackPotStore.state.major.value + '  bits'

                        )),
                    //MINOR Jackpot
                    el.div({
                            className: 'row'
                        },
                        el.div({
                                id: 'minor-text',
                                className: 'col-xs-6'
                            }, 'MINOR Jackpot',
                            el.span({id: 'hashLabel'},
                            jackPotStore.state.minor.hashJP)

                        )),
                    el.div({
                            className: 'row'
                        },
                        el.div({
                                id: 'minor',
                                className: 'col-xs-6'
                            }, jackPotStore.state.minor.value + '  bits'

                        ))
                )
            )

        );
    }
});

var AutoBet = React.createClass({
    displayName: 'AutoBet',
    _onStoreChange: function() {
        this.forceUpdate();

    },
    componentDidMount: function() {
        worldStore.on('change', this._onStoreChange);
        autoBetStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        worldStore.off('change', this._onStoreChange);
        autoBetStore.off('change', this._onStoreChange);
    },
    _onLossW: function(e) {
        var newWager = e.target.value;
        Dispatcher.sendAction('ONLOSS_UPDATE_WAGER', newWager);
    },
    _onLossM: function(e) {
        var newMult = e.target.value;
        Dispatcher.sendAction('ONLOSS_UPDATE_MULTIPLIER', newMult);
    },
    _onLossR: function(e) {
        var reset = e.target.value;
        Dispatcher.sendAction('ONLOSS_UPDATE_RESET', reset);
    },
    _onLossS: function(e) {
        var switchAfter = e.target.value;
        Dispatcher.sendAction('ONLOSS_UPDATE_SWITCH', switchAfter);
    },
    _onLossStopA: function(e) {
        var stopfter = e.target.value;
        Dispatcher.sendAction('ONLOSS_UPDATE_STOPAFTER', stopfter);
    },
    _onLossReturnToBase: function() {
        var returnToBase = (autoBetStore.state.onLoss.returnToBase) ? false : true;
        Dispatcher.sendAction('ONLOSS_UPDATE_RETURN', returnToBase);
    },
    _onWinW: function(e) {
        var newWager = e.target.value;
        Dispatcher.sendAction('ONWIN_UPDATE_WAGER', newWager);
    },
    _onWinM: function(e) {
        var newMult = e.target.value;
        Dispatcher.sendAction('ONWIN_UPDATE_MULTIPLIER', newMult);
    },
    _onWinR: function(e) {
        var reset = e.target.value;
        Dispatcher.sendAction('ONWIN_UPDATE_RESET', reset);
    },
    _onWinS: function(e) {
        var switchAfter = e.target.value;
        Dispatcher.sendAction('ONWIN_UPDATE_SWTICH_', switchAfter);
    },
    _onWinStopA: function(e) {
        var stopAfter = e.target.value;
        Dispatcher.sendAction('ONWIN_UPDATE_STOPAFTER', stopAfter);
    },
    _onWinReturnToBase: function() {
        var returnToBase = (autoBetStore.state.onWin.returnToBase) ? false : true;
        Dispatcher.sendAction('ONWIN_UPDATE_RETURN', returnToBase);
    },
    _onStopG: function(e) {
        var stop = e.target.value;
        Dispatcher.sendAction('STOP_UPDATE_GREATER', stop);
    },
    _onStopL: function(e) {
        var stop = e.target.value;
        Dispatcher.sendAction('STOP_UPDATE_LOWER', stop);
    },
    _onStopB: function(e) {
        var stopAfter = e.target.value;
        Dispatcher.sendAction('STOP_UPDATE_STOPAFTERBETS', stopAfter);
    },
    _onStopResetW: function(e) {
        var resetWager = e.target.value;
        Dispatcher.sendAction('STOP_UPDATE_RESETWAGER', resetWager);
    },
    _onStopS: function(e) {
        var switchAfter = e.target.value;
        Dispatcher.sendAction('STOP_UPDATE_SWITCHAFTERBETS', switchAfter);
    },
    _onChangeTarget: function() {
        var target = autoBetStore.state.inUse.switchTarget;
        Dispatcher.sendAction('SWITCH_TARGET', (target) ? false : true);
    },
    _onChangeTargetString: function() {
        return (autoBetStore.state.inUse.switchTarget) ? 'Bet Low' : 'Bet High';
    },
    _button: function() {

        return (!autoBetStore.state.button) ? 'Start AutoBetting' : 'Stop AutoBetting';

    },
    _onClickButton: function() {
        var button;

        (autoBetStore.state.button) ? button = false: button = true;
        Dispatcher.sendAction('CHANGE_BUTTON', button);
    },
    _onClick1S: function() {
        ClearInputs();
        Dispatcher.sendAction('ONLOSS_UPDATE_WAGER', 2.3);
        Dispatcher.sendAction('ONLOSS_UPDATE_MULTIPLIER', 0.95);
        Dispatcher.sendAction('ONLOSS_UPDATE_RESET', 5);
        Dispatcher.sendAction('ONLOSS_UPDATE_SWITCH', 2);
        Dispatcher.sendAction('UPDATE_WAGER', {
            str: 1
        });
        Dispatcher.sendAction('UPDATE_MULTIPLIER', {
            str: 2
        });
        updateMultiplier(2);

    },
    _onClick2S: function() {
        ClearInputs();
        Dispatcher.sendAction('ONWIN_UPDATE_WAGER', 1.01);
        Dispatcher.sendAction('ONWIN_UPDATE_RESET', 50);
        Dispatcher.sendAction('STOP_UPDATE_SWITCHAFTERBETS', 10);
        Dispatcher.sendAction('UPDATE_WAGER', {
            str: 1000
        });
        Dispatcher.sendAction('UPDATE_MULTIPLIER', {
            str: 1.01
        });
        updateMultiplier(1.01);

    },
    _onClick3S: function() {
        ClearInputs();
        Dispatcher.sendAction('ONWIN_UPDATE_WAGER', 1.5);
        Dispatcher.sendAction('ONLOSS_UPDATE_RESET', 1);
        Dispatcher.sendAction('ONWIN_UPDATE_RESET', 5);
        Dispatcher.sendAction('UPDATE_WAGER', {
            str: 100
        });
        Dispatcher.sendAction('UPDATE_MULTIPLIER', {
            str: 1.5
        });
        updateMultiplier(1.5);


    },
    _onClick4S: function() {
        ClearInputs();
        Dispatcher.sendAction('ONLOSS_UPDATE_WAGER', 10);
        Dispatcher.sendAction('ONLOSS_UPDATE_MULTIPLIER', 0.55);
        Dispatcher.sendAction('ONLOSS_UPDATE_RESET', 2);
        Dispatcher.sendAction('STOP_UPDATE_SWITCHAFTERBETS', 2);
        Dispatcher.sendAction('UPDATE_WAGER', {
            str: 10
        });
        Dispatcher.sendAction('UPDATE_MULTIPLIER', {
            str: 2
        });
        updateMultiplier(2);
    },
    _onClick5S: function() {
        ClearInputs();
        Dispatcher.sendAction('ONLOSS_UPDATE_WAGER', 2);
        Dispatcher.sendAction('ONLOSS_UPDATE_MULTIPLIER', 1.01);
        Dispatcher.sendAction('ONWIN_UPDATE_WAGER', 1);
        Dispatcher.sendAction('ONWIN_UPDATE_MULTIPLIER', 1);
        Dispatcher.sendAction('ONWIN_UPDATE_RESET', 3);
        Dispatcher.sendAction('STOP_UPDATE_RESETWAGER', 128);
        Dispatcher.sendAction('UPDATE_WAGER', {
            str: 1
        });
        Dispatcher.sendAction('UPDATE_MULTIPLIER', {
            str: 1.2
        });
        updateMultiplier(1.2);
    },
    render: function() {
        return el.div(
            null,
            el.div({
                    className: 'panel panel-default'
                },
                el.div({
                        className: 'panel-body'
                    },
                    el.div({
                            className: 'col-md-3'
                        },
                        'On Loss',
                        el.span({
                                className: 'noselect input-group-addon',
                                id: (autoBetStore.state.onLoss.returnToBase) ? 'return-to-base-on' : 'return-to-base-off',
                                style: {
                                    borderRadius: '2px'

                                },
                                onClick: this._onLossReturnToBase,
                            },
                            'Return to base'
                        ),
                        //Start
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginTop: '5px',
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.onLoss.wager,
                                onChange: this._onLossW,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'x'
                            ),
                            el.span({
                                    className: 'input-group-addon',
                                    style: {
                                        background: '#337ab7'
                                    }

                                },
                                'WAGER'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.onLoss.multiplier,
                                onChange: this._onLossM,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'x'
                            ),
                            el.span({
                                    className: 'input-group-addon',
                                    style: {
                                        background: '#39b54a'
                                    }

                                },
                                'Multiplier'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.onLoss.reset,
                                onChange: this._onLossR,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'Reset After'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.onLoss.switchAfter,
                                onChange: this._onLossS,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'Switch After'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.onLoss.stopAfter,
                                onChange: this._onLossStopA,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'Stop After'
                            ))
                        //END
                    ),
                    el.div({
                            className: 'col-md-3'
                        },
                        'On Win',
                        el.span({
                                className: 'noselect input-group-addon',
                                id: (autoBetStore.state.onWin.returnToBase) ? 'return-to-base-on' : 'return-to-base-off',
                                style: {
                                    borderRadius: '2px'

                                },
                                onClick: this._onWinReturnToBase,
                            },
                            'Return to base'
                        ),
                        //START
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginTop: '5px',
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.onWin.wager,
                                onChange: this._onWinW,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'x'
                            ),
                            el.span({
                                    className: 'input-group-addon',
                                    style: {
                                        background: '#337ab7'
                                    }

                                },
                                'WAGER'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.onWin.multiplier,
                                onChange: this._onWinM,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'x'
                            ),
                            el.span({
                                    className: 'input-group-addon',
                                    style: {
                                        background: '#39b54a'
                                    }

                                },
                                'Multiplier'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.onWin.reset,
                                onChange: this._onWinR,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'Reset After'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.onWin.switchAfter,
                                onChange: this._onWinS,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'Switch After'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.onWin.stopAfter,
                                onChange: this._onWinStopA,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'Stop After'
                            ))
                        // END
                    ),
                    el.div({
                            className: 'col-md-3'
                        },
                        'Stop if Balance',
                        //Start
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.stop.lowerThan,
                                onChange: this._onStopL,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                '<'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.stop.greaterThan,
                                onChange: this._onStopG,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                '>'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.stop.stopAfter,
                                onChange: this._onStopB,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'STOP AFTER BETS'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.stop.resetWager,
                                onChange: this._onStopResetW,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'RESET IF WAGER'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.input({
                                type: 'text',
                                value: autoBetStore.state.stop.switchAfter,
                                onChange: this._onStopS,
                                disabled: autoBetStore.state.button,
                                className: 'form-control input-lg',

                            }),
                            el.span({
                                    className: 'input-group-addon'
                                },
                                'SWITCH AFTER BETS'
                            )),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.span({
                                    className: 'noselect input-group-addon',
                                    id: 'return-to-base-off',
                                    style: {
                                        borderRadius: '2px',
                                        color: '#337ab7',
                                        backgroundColor: '#1b1e25'
                                    },
                                    onClick: this._onChangeTarget,
                                },
                                this._onChangeTargetString()
                            )
                        )
                        //END

                    ),
                    el.div({
                            className: 'col-md-3'
                        },
                        'Strategies',

                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.span({
                                    className: 'noselect input-lg input-group-addon',
                                    id: 'strategies',
                                    style: {
                                        borderRadius: '2px'
                                    },
                                    onClick: this._onClick1S,
                                },
                                'MartinGale V2'
                            )
                        ),

                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.span({
                                    className: 'noselect input-lg input-group-addon',
                                    id: 'strategies',
                                    style: {
                                        borderRadius: '2px'
                                    },
                                    onClick: this._onClick2S,
                                },
                                'JackPot Run'
                            )
                        ),


                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.span({
                                    className: 'noselect input-lg input-group-addon',
                                    id: 'strategies',
                                    style: {
                                        borderRadius: '2px'
                                    },
                                    onClick: this._onClick3S,
                                },
                                'Challenge'
                            )
                        ),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.span({
                                    className: 'noselect input-lg input-group-addon',
                                    id: 'strategies',
                                    style: {
                                        borderRadius: '2px'
                                    },
                                    onClick: this._onClick4S,
                                },
                                'Strike'
                            )
                        ),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.span({
                                    className: 'noselect input-lg input-group-addon',
                                    id: 'strategies',
                                    style: {
                                        borderRadius: '2px'
                                    },
                                    onClick: this._onClick5S,
                                },
                                'LEFTY'
                            )
                        ),
                        el.div({
                                className: 'input-group',
                                style: {
                                    marginBottom: '5px'
                                }
                            },
                            el.span({
                                    className: 'noselect input-group-addon',
                                    id: 'return-to-base-off',
                                    style: {
                                        borderRadius: '2px',
                                        backgroundColor: '#1b1e25'
                                    },
                                    onClick: ClearInputs,
                                },
                                'Clear Inputs'
                            )
                        )
                    //END


                    )

                ),

                el.div({
                        className: 'panel-body'
                    },
                    el.div({
                            className: 'col-md-4 col-md-offset-5',
                        },
                        el.div({
                                className: 'col-md-6',
                            },
                            el.input({
                                type: 'button',
                                value: this._button(),
                                onClick: this._onClickButton,
                                id: 'start-stop',
                                className: 'btn btn-default btn-md',

                            })),
                        el.div({
                                className: 'col-md-6',
                            },
                            el.span({
                                className: 'noselect input-group-addon',
                                id: 'label',
                                style: {
                                    borderRadius: '2px',
                                    marginBottom: '5px'

                                },
                            }, 'Profit ' + (autoBetStore.state.profit / 100).toFixed(2)),
                            el.span({
                                className: 'noselect input-group-addon',
                                id: 'label',
                                style: {
                                    borderRadius: '2px',
                                    marginBottom: '5px'

                                },
                            }, 'Bets ' + autoBetStore.state.betCount)
                        )
                    )
                )




            )

        );
    }
});


var Tabs = React.createClass({
    displayName: 'Tabs',
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        worldStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        worldStore.off('change', this._onStoreChange);
    },
    _makeTabChangeHandler: function(tabName) {
        var self = this;
        return function() {
            Dispatcher.sendAction('CHANGE_TAB', tabName);
        };
    },
    render: function() {
        return el.ul({
                className: 'nav nav-tabs'
            },
            el.li({
                    className: worldStore.state.currTab === 'ALL_BETS' ? 'active' : ''
                },
                el.a({
                        href: 'javascript:void(0)',
                        onClick: this._makeTabChangeHandler('ALL_BETS')
                    },
                    'All Bets'
                )
            ),
            // Only show MY BETS tab if user is logged in
            !worldStore.state.user ? '' :
            el.li({
                    className: worldStore.state.currTab === 'MY_BETS' ? 'active' : ''
                },
                el.a({
                        href: 'javascript:void(0)',
                        onClick: this._makeTabChangeHandler('MY_BETS')
                    },
                    'My Bets'
                )
            ),
            // Show Jackpot History
            el.li({
                    className: worldStore.state.currTab === 'JACKPOT_HISTORY' ? 'active' : ''
                },
                el.a({
                        href: 'javascript:void(0)',
                        onClick: this._makeTabChangeHandler('JACKPOT_HISTORY')
                    },
                    'JackPots'
                )
            ),
            // Display faucet tab even to guests so that they're aware that
            // this casino has one.
            !config.recaptcha_sitekey ? '' :
            el.li({
                    className: worldStore.state.currTab === 'FAUCET' ? 'active' : ''
                },
                el.a({
                        href: 'javascript:void(0)',
                        onClick: this._makeTabChangeHandler('FAUCET')
                    },
                    el.span(null, 'Faucet ')
                )
            )
        );
    }
});

var MyBetsTabContent = React.createClass({
    displayName: 'MyBetsTabContent',
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        worldStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        worldStore.off('change', this._onStoreChange);
    },
    render: function() {
        return el.div(
            null,
            el.table({
                    className: 'table'
                },
                el.thead(
                    null,
                    el.tr(
                        null,
                        el.th(null, 'ID'),
                        el.th(null, 'Time'),
                        el.th(null, 'User'),
                        el.th(null, 'Wager'),
                        el.th(null, 'Target'),
                        el.th(null, 'Roll'),
                        el.th(null, 'Profit')
                    )
                ),
                el.tbody(
                    null,
                    worldStore.state.bets.toArray().map(function(bet) {

                        return el.tr({
                                key: bet.bet_id || bet.id
                            },
                            // bet id
                            el.td(
                                null,
                                el.a({
                                        href: config.mp_browser_uri + '/bets/' + (bet.bet_id || bet.id),
                                        target: '_blank'
                                    },
                                    bet.bet_id || bet.id
                                )
                            ),
                            // Time
                            el.td(
                                null,
                                helpers.formatDateToTime(bet.created_at)
                            ),
                            // User
                            el.td(
                                null,
                                el.a({
                                        href: config.mp_browser_uri + '/users/' + bet.uname,
                                        target: '_blank'
                                    },
                                    bet.uname
                                )
                            ),
                            // wager
                            el.td(
                                null,
                                helpers.round10(bet.wager / 100, -2),
                                ' bits'
                            ),
                            // target
                            el.td(
                                null,
                                bet.meta.cond + ' ' + bet.meta.number.toFixed(2)
                            ),
                            // roll
                            el.td(
                                null,
                                bet.outcome + ' ',
                                bet.meta.isFair ?
                                el.span({
                                    className: 'label label-success'
                                }, 'Verified') : ''
                            ),
                            // profit
                            el.td({
                                    style: {
                                        color: bet.profit > 0 ? 'green' : 'red'
                                    }
                                },
                                bet.profit > 0 ?
                                '+' + helpers.round10(bet.profit / 100, -2) :
                                helpers.round10(bet.profit / 100, -2),
                                ' bits'
                            )
                        );
                    }).reverse()
                )
            )
        );
    }
});

var FaucetTabContent = React.createClass({
    displayName: 'FaucetTabContent',
    getInitialState: function() {
        return {
            // SHOW_RECAPTCHA | SUCCESSFULLY_CLAIM | ALREADY_CLAIMED | WAITING_FOR_SERVER
            faucetState: 'SHOW_RECAPTCHA',
            // :: Integer that's updated after the claim from the server so we
            // can show user how much the claim was worth without hardcoding it
            // - It will be in satoshis
            claimAmount: undefined
        };
    },
    // This function is extracted so that we can call it on update and mount
    // when the window.grecaptcha instance loads
    _renderRecaptcha: function() {
        worldStore.state.grecaptcha.render(
            'recaptcha-target', {
                sitekey: config.recaptcha_sitekey,
                callback: this._onRecaptchaSubmit
            }
        );
    },
    // `response` is the g-recaptcha-response returned from google
    _onRecaptchaSubmit: function(response) {
        var self = this;
        console.log('recaptcha submitted: ', response);

        self.setState({
            faucetState: 'WAITING_FOR_SERVER'
        });

        MoneyPot.claimFaucet(response, {
            // `data` is { claim_id: Int, amount: Satoshis }
            success: function(data) {
                Dispatcher.sendAction('UPDATE_USER', {
                    balance: worldStore.state.user.balance + data.amount
                });
                self.setState({
                    faucetState: 'SUCCESSFULLY_CLAIMED',
                    claimAmount: data.amount
                });
                // self.props.faucetClaimedAt.update(function() {
                //   return new Date();
                // });
                Dispatcher.sendAction('START_REFRESHING_USER');
            },
            error: function(xhr, textStatus, errorThrown) {
                if (xhr.responseJSON && xhr.responseJSON.error === 'FAUCET_ALREADY_CLAIMED') {
                    self.setState({
                        faucetState: 'ALREADY_CLAIMED'
                    });
                }
            }
        });
    },
    // This component will mount before window.grecaptcha is loaded if user
    // clicks the Faucet tab before the recaptcha.js script loads, so don't assume
    // we have a grecaptcha instance
    componentDidMount: function() {
        if (worldStore.state.grecaptcha) {
            this._renderRecaptcha();
        }

        worldStore.on('grecaptcha_loaded', this._renderRecaptcha);
    },
    componentWillUnmount: function() {
        worldStore.off('grecaptcha_loaded', this._renderRecaptcha);
    },
    render: function() {

        // If user is not logged in, let them know only logged-in users can claim
        if (!worldStore.state.user) {
            return el.p({
                    className: 'lead'
                },
                'You must login to claim faucet'
            );
        }

        var innerNode;
        // SHOW_RECAPTCHA | SUCCESSFULLY_CLAIMED | ALREADY_CLAIMED | WAITING_FOR_SERVER
        switch (this.state.faucetState) {
            case 'SHOW_RECAPTCHA':
                innerNode = el.div({
                    id: 'recaptcha-target'
                }, !!worldStore.state.grecaptcha ? '' : 'Loading...');
                break;
            case 'SUCCESSFULLY_CLAIMED':
                innerNode = el.div(
                    null,
                    'Successfully claimed ' + this.state.claimAmount / 100 + ' bits.' +
                    // TODO: What's the real interval?
                    ' You can claim again in 5 minutes.'
                );
                break;
            case 'ALREADY_CLAIMED':
                innerNode = el.div(
                    null,
                    'ALREADY_CLAIMED'
                );
                break;
            case 'WAITING_FOR_SERVER':
                innerNode = el.div(
                    null,
                    'WAITING_FOR_SERVER'
                );
                break;
            default:
                alert('Unhandled faucet state');
                return;
        }

        return el.div(
            null,
            innerNode
        );
    }
});

// props: { bet: Bet }
var BetRow = React.createClass({
    displayName: 'BetRow',
    render: function() {
        var bet = this.props.bet;
        return el.tr({},
            // bet id
            el.td(
                null,
                el.a({
                        href: config.mp_browser_uri + '/bets/' + (bet.bet_id || bet.id),
                        target: '_blank'
                    },
                    bet.bet_id || bet.id
                )
            ),
            // Time
            el.td(
                null,
                helpers.formatDateToTime(bet.created_at)
            ),
            // User
            el.td(
                null,
                el.a({
                        href: config.mp_browser_uri + '/users/' + bet.uname,
                        target: '_blank'
                    },
                    bet.uname
                )
            ),
            // Wager
            el.td(
                null,
                helpers.round10(bet.wager / 100, -2),
                ' bits'
            ),
            // Target
            el.td({
                    className: 'text-right',
                    style: {
                        fontFamily: 'monospace'
                    }
                },
                bet.cond + bet.target.toFixed(2)
            ),
            // // Roll
            // el.td(
            //   null,
            //   bet.outcome
            // ),
            // Visual
            el.td({
                    style: {
                        //position: 'relative'
                        fontFamily: 'monospace'
                    }
                },
                // progress bar container
                el.div({
                        className: 'progress',
                        style: {
                            minWidth: '100px',
                            position: 'relative',
                            marginBottom: 0,
                            // make it thinner than default prog bar
                            height: '10px'
                        }
                    },
                    el.div({
                        className: 'progress-bar ' +
                            (bet.profit >= 0 ?
                                'progress-bar-success' : 'progress-bar-grey'),
                        style: {
                            float: bet.cond === '<' ? 'left' : 'right',
                            width: bet.cond === '<' ?
                                bet.target.toString() + '%' :
                                (100 - bet.target).toString() + '%'
                        }
                    }),
                    el.div({
                        style: {
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: bet.outcome.toString() + '%',
                            borderRight: '3px solid #333',
                            height: '100%'
                        }
                    })
                ),
                // arrow container
                el.div({
                        style: {
                            position: 'relative',
                            width: '100%',
                            height: '15px'
                        }
                    },
                    // arrow
                    el.div({
                            style: {
                                position: 'absolute',
                                top: 0,
                                left: (bet.outcome - 1).toString() + '%'
                            }
                        },
                        el.div({
                                style: {
                                    width: '5em',
                                    marginLeft: '-10px'
                                }
                            },
                            // el.span(
                            //   //{className: 'glyphicon glyphicon-triangle-top'}
                            //   {className: 'glyphicon glyphicon-arrow-up'}
                            // ),
                            el.span({
                                    style: {
                                        fontFamily: 'monospace'
                                    }
                                },
                                '' + bet.outcome
                            )
                        )
                    )
                )
            ),
            // Profit
            el.td({
                    style: {
                        color: bet.profit > 0 ? 'green' : 'red',
                        paddingLeft: '50px'
                    }
                },
                bet.profit > 0 ?
                '+' + helpers.round10(bet.profit / 100, -2) :
                helpers.round10(bet.profit / 100, -2),
                ' bits'
            )
        );
    }
});

var AllBetsTabContent = React.createClass({
    displayName: 'AllBetsTabContent',
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        worldStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        worldStore.off('change', this._onStoreChange);
    },
    render: function() {
        return el.div(
            null,
            el.table({
                    className: 'table'
                },
                el.thead(
                    null,
                    el.tr(
                        null,
                        el.th(null, 'ID'),
                        el.th(null, 'Time'),
                        el.th(null, 'User'),
                        el.th(null, 'Wager'),
                        el.th({
                            className: 'text-right'
                        }, 'Target'),
                        // el.th(null, 'Roll'),
                        el.th(null, 'Outcome'),
                        el.th({
                                style: {
                                    paddingLeft: '50px'
                                }
                            },
                            'Profit'
                        )
                    )
                ),
                el.tbody(
                    null,
                    worldStore.state.allBets.toArray().map(function(bet) {

                        return React.createElement(BetRow, {
                            bet: bet,
                            key: bet.bet_id || bet.id
                        });
                    }).reverse()
                )
            )
        );
    }
});

var JackPotsRow = React.createClass({
    displayName: 'JackPotsRow',
    render: function() {
        var jackpot = this.props.jackpot;
        return el.tr({},
            // Jackpot Hash
            el.td(
                null,
                jackpot.hashJP
            ),
            // Jackpot hashKey
            el.td(
                null,
                jackpot.hashKey
            ),
            // Jackpot type
            el.td(
                {style:{color:(jackpot.type == 'minor') ? '#32CD32' : (jackpot.type == 'major') ? '#1a75ff' : (jackpot.type == 'grand') ? '#E9573E' : '#FFFFFF'}},
                jackpot.type
            ),
            // Jackpot value
            el.td(
                null,
                jackpot.value + ' bits'
            ),
            // Jackpot winner
            el.td(
                null,
                jackpot.winner
            )

        );
    }
});

var JackPotsTabContent = React.createClass({
    displayName: 'JackPotsTabContent',
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        worldStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        worldStore.off('change', this._onStoreChange);
    },
    render: function() {
        return el.div(
            null,
            el.table({
                    className: 'table'
                },
                el.thead(
                    null,
                    el.tr(
                        null,
                        el.th(null, 'Hash'),
                        el.th(null, 'HashKey'),
                        el.th(null, 'Type'),
                        el.th(null, 'Value'),
                        el.th(null, 'Winner')
                    )
                ),
                el.tbody(
                    null,
                    worldStore.state.historyJackpots.toArray().map(function(jackpot) {

                        return React.createElement(JackPotsRow, {
                            jackpot: jackpot,
                        });
                    })
                )
            )
        );
    }
});

var TabContent = React.createClass({
    displayName: 'TabContent',
    _onStoreChange: function() {
        this.forceUpdate();
    },
    componentDidMount: function() {
        worldStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        worldStore.off('change', this._onStoreChange);
    },
    render: function() {
        switch (worldStore.state.currTab) {
            case 'FAUCET':
                return React.createElement(FaucetTabContent, null);
            case 'JACKPOT_HISTORY':
                return React.createElement(JackPotsTabContent, null);
            case 'MY_BETS':
                return React.createElement(MyBetsTabContent, null);
            case 'ALL_BETS':
                return React.createElement(AllBetsTabContent, null);
            default:
                alert('Unsupported currTab value: ', worldStore.state.currTab);
                break;
        }
    }
});

var Footer = React.createClass({
    displayName: 'Footer',
    render: function() {
        return el.div({
                className: 'text-center text-muted',
                style: {
                    marginTop: '200px'
                }
            },
            'Powered by ',
            el.a({
                    href: 'https://www.diceco.in'
                },
                'DICECO.IN'
            )
        );
    }
});

var FAQ = React.createClass({
    displayName: 'FAQ',
    _onStoreChange: function() {
    this.forceUpdate();
    },
    componentDidMount: function() {
        worldStore.on('change', this._onStoreChange);
    },
    componentWillUnmount: function() {
        worldStore.off('change', this._onStoreChange);
    },
    render: function() {
        
            var div;
            if(worldStore.state.pageFAQ){
            div = el.div({
                className: 'container',
                id: 'faq_box',
            },
            el.div({className:'headerFAQ'},
            'Frequently asked questions'),
            
            el.div({className: 'question'},
            'How much is a bit ?'),
            el.div({className: 'answer'},
            el.p({},'A bit is a millionth of a bitcoin or 100 satoshis.'),
            el.p({},'1.000.000 Bits = 1 Bitcoin.')),
            
            el.div({className: 'question'},
            'What is a bitcoin ?'),
            el.div({className: 'answer'},
            el.p({},'Bitcoin is a digital currency created in 2009.'),
            el.p({},'Bitcoin offers the promise of lower transaction fees than traditional online payment mechanisms and is operated by a decentralized authority, unlike government issued currencies. '),
            el.p({},'You can learn more about Bitcoin here: https://bitcoin.org/en/faq#what-is-bitcoin '),
            el.p({},'You can check the currently value of a bitcoin here: http://preev.com/btc/usd')),
            
            el.div({className: 'question'},
            'How can I get free bits ?'),
            el.div({className: 'answer'},
            el.p({},'You can claim 2 free bits every 5 minutes using the Faucet on the tab content.'),
            el.p({},'Use this feature to test our game.')),
            
            el.div({className: 'question'},
            'How the Jackpot works ?'),
            el.div({className: 'answer'},
            el.p({},'When a new Jackpot is set, our server generates a random Hash Key (e.g. "MB58bNJogX") and random value for the Jackpot (e.g.  777).'),
            el.p({},'This value is the amount of bits to be won. '),
            el.p({},'These two, the Hash Key and the Jackpot value are encrypted into a SHA256 Hash Code in the following form: "MB58bNJogX777". '),
            el.p({},'The generated Hash Code for every Jackpot (Grand, Major and Minor) is shown in the Jackpot Box. '),
            el.p({},'When a Jackpot is won you will find the jackpot value along the Hash Key and the Hash Code in the Jackpots Tab.'),
            el.p({},'You can verify the authenticity of the Jackpot here: http://www.xorbin.com/tools/sha256-hash-calculator '),
            el.p({},'After each increase of jackpot, the server compares the generated Hash Code of the new value with the Jackpot Hash Code.'),
            el.p({},'When these two are the same, we have a winner. '),
            el.p({},'In this way we assure that no one knows the Jackpot value and that no one can modify it. ')),
            
            el.div({className: 'question'},
            'How to win the Jackpot ?'),
            el.div({className: 'answer'},
            el.p({},'In order to qualify for the Jackpot Prize you need to wager at least 1 bit. '),
            el.p({},'If you were the last to bet before the value is reached, you win the jackpot. ')),
            
            el.div({className: 'question'},
            'What happens when someone wins a Jackpot ?'),
            el.div({className: 'answer'},
            el.p({},'A popup message containing the amount and winner will be shown to all online users. '))
            
        ) }
        
        return el.div({},
        
        div)
        
    }
});


var App = React.createClass({
    displayName: 'App',
    render: function() {
        return el.div({
                className: 'container'
            },
            // Navbar
            React.createElement(Navbar, null),
            
            el.div({
                    className: 'game'
                },
             React.createElement(FAQ, null),   
                //Animation && JackPot & BetBox & ChatBox
                el.div({
                        className: 'row'
                    },
                    el.div({
                        className: 'col-md-4'
                    }),
                    el.div({
                            className: 'col-md-4'
                        },
                        React.createElement(Animation, null)
                    ),
                    el.div({
                        className: 'col-md-4'
                    })),
                el.div({
                        className: 'row'
                    },
                    el.div({
                            className: 'col-md-4'
                        },
                        React.createElement(JackpotBox, null)
                    ),
                    el.div({
                            className: 'col-md-4'
                        },
                        React.createElement(BetBox, null)
                    ),
                    el.div({
                            className: 'col-md-4'
                        },
                        React.createElement(ChatBox, null)
                    )

                ),
                //AutoBet
                el.div({
                        className: 'col-md-12'
                    },
                    React.createElement(AutoBet, null)),
                // Tabs
                el.div({
                        style: {
                            marginTop: '15px'
                        }
                    },
                    React.createElement(Tabs, null)
                ),
                // Tab Contents
                React.createElement(TabContent, null),
                // Footer
                React.createElement(Footer, null))


        );
    }
});

React.render(
    React.createElement(App, null),
    document.getElementById('app')
);

// If not accessToken,
// If accessToken, then
if (!worldStore.state.accessToken) {
    Dispatcher.sendAction('STOP_LOADING');
    connectToChatServer();
} else {
    // Load user from accessToken
    MoneyPot.getTokenInfo({
        success: function(data) {
            console.log('Successfully loaded user from tokens endpoint', data);
            var user = data.auth.user;
            Dispatcher.sendAction('USER_LOGIN', user);
        },
        error: function(err) {
            console.log('Error:', err);
        },
        complete: function() {
            Dispatcher.sendAction('STOP_LOADING');
            connectToChatServer();
        }
    });
    // Get next bet hash
    MoneyPot.generateBetHash({
        success: function(data) {
            Dispatcher.sendAction('SET_NEXT_HASH', data.hash);
        }
    });
    // Fetch latest all-bets to populate the all-bets tab
    MoneyPot.listBets({
        success: function(bets) {
            console.log('[MoneyPot.listBets]:', bets);
            Dispatcher.sendAction('INIT_ALL_BETS', bets.reverse());
        },
        error: function(err) {
            console.error('[MoneyPot.listBets] Error:', err);
        }
    });
}

////////////////////////////////////////////////////////////
// Hook up to chat server

function connectToChatServer() {
    console.log('Connecting to chat server. AccessToken:',
        worldStore.state.accessToken);

    socket = io(config.chat_uri);

    socket.on('connect', function() {
        console.log('[socket] Connected');

        socket.on('disconnect', function() {
            console.log('[socket] Disconnected');
        });

        // When subscribed to DEPOSITS:

        socket.on('unconfirmed_balance_change', function(payload) {
            console.log('[socket] unconfirmed_balance_change:', payload);

            Dispatcher.sendAction('UPDATE_USER', {
                unconfirmed_balance: payload.balance
            });
        });

        socket.on('balance_change', function(payload) {
            console.log('[socket] (confirmed) balance_change:', payload);

            Dispatcher.sendAction('UPDATE_USER', {
                balance: payload.balance
            });
        });

        // message is { text: String, user: { role: String, uname: String} }
        socket.on('new_message', function(message) {
            console.log('[socket] Received chat message:', message);
            Dispatcher.sendAction('NEW_MESSAGE', message);
            
        });

        socket.on('user_joined', function(user) {
            console.log('[socket] User joined:', user);
            Dispatcher.sendAction('USER_JOINED', user);
        });

        // `user` is object { uname: String }
        socket.on('user_left', function(user) {
            console.log('[socket] User left:', user);
            Dispatcher.sendAction('USER_LEFT', user);
        });

        socket.on('new_bet', function(bet) {
            //    initJack();



            console.log('[socket] New bet:', bet);

            // Ignore bets that aren't of kind "simple_dice".
            if (bet.kind !== 'simple_dice') {
                console.log('[weird] received bet from socket that was NOT a simple_dice bet');
                return;
            }

            Dispatcher.sendAction('NEW_ALL_BET', bet);
        });

        // Received when your client doesn't comply with chat-server api
        socket.on('client_error', function(text) {
            console.warn('[socket] Client error:', text);
        });

        // Once we connect to chat server, we send an auth message to join
        // this app's lobby channel.

        var authPayload = {
            app_id: config.app_id,
            access_token: worldStore.state.accessToken,
            subscriptions: ['CHAT', 'DEPOSITS', 'BETS']
        };

        socket.emit('auth', authPayload, function(err, data) {
            if (err) {
                console.log('[socket] Auth failure:', err);
                return;
            }
            console.log('[socket] Auth success:', data);
            Dispatcher.sendAction('INIT_CHAT', data);
        });
    });
}

// This function is passed to the recaptcha.js script and called when
// the script loads and exposes the window.grecaptcha object. We pass it
// as a prop into the faucet component so that the faucet can update when
// when grecaptcha is loaded.
function onRecaptchaLoad() {
    Dispatcher.sendAction('GRECAPTCHA_LOADED', grecaptcha);
}

$(document).on('keydown', function(e) {
    var H = 72,
        L = 76,
        C = 67,
        X = 88,
        keyCode = e.which;

    // Bail is hotkeys aren't currently enabled to prevent accidental bets
    if (!worldStore.state.hotkeysEnabled) {
        return;
    }

    // Bail if it's not a key we care about
    if (keyCode !== H && keyCode !== L && keyCode !== X && keyCode !== C) {
        return;
    }

    // TODO: Remind self which one I need and what they do ^_^;;
    e.stopPropagation();
    e.preventDefault();

    switch (keyCode) {
        case C: // Increase wager
            var upWager = betStore.state.wager.num * 2;
            Dispatcher.sendAction('UPDATE_WAGER', {
                num: upWager,
                str: upWager.toString()
            });
            break;
        case X: // Decrease wager
            var downWager = Math.floor(betStore.state.wager.num / 2);
            Dispatcher.sendAction('UPDATE_WAGER', {
                num: downWager,
                str: downWager.toString()
            });

            break;
        case L: // Bet lo
            $('#bet-lo').click();
            break;
        case H: // Bet hi
            $('#bet-hi').click();
            break;
        default:
            return;
    }
});

window.addEventListener('message', function(event) {
    if (event.origin === config.mp_browser_uri && event.data === 'UPDATE_BALANCE') {
        Dispatcher.sendAction('START_REFRESHING_USER');
    }
}, false);


function updateMultiplier(newStr) {
    var num = parseFloat(newStr, 10);

    // If num is a number, ensure it's at least 0.01x
    // if (Number.isFinite(num)) {
    //   num = Math.max(num, 0.01);
    //   this.props.currBet.setIn(['multiplier', 'str'], num.toString());
    // }

    var isFloatRegexp = /^(\d*\.)?\d+$/;

    // Ensure str is a number
    if (isNaN(num) || !isFloatRegexp.test(newStr)) {
        $('#start-stop').click();
        Dispatcher.sendAction('UPDATE_MULTIPLIER', {
            error: 'INVALID_MULTIPLIER'
        });
        // Ensure multiplier is >= 1.00x
    } else if (num < 1.01) {
        $('#start-stop').click();
        Dispatcher.sendAction('UPDATE_MULTIPLIER', {
            error: 'MULTIPLIER_TOO_LOW'
        });
        // Ensure multiplier is <= max allowed multiplier (100x for now)
    } else if (num > 9900) {
        $('#start-stop').click();
        Dispatcher.sendAction('UPDATE_MULTIPLIER', {
            error: 'MULTIPLIER_TOO_HIGH'
        });
        // Ensure no more than 2 decimal places of precision
    } else if (helpers.getPrecision(num) > 2) {
        $('#start-stop').click();
        Dispatcher.sendAction('UPDATE_MULTIPLIER', {
            error: 'MULTIPLIER_TOO_PRECISE'
        });
        // multiplier str is valid
    } else {
        Dispatcher.sendAction('UPDATE_MULTIPLIER', {
            num: num,
            error: null
        });
    }
}

function IncreaseOrReturn(autoBetValue, value, initValue) {
    
    if(autoBetValue > 0)
        return autoBetValue * value;
        return initValue;
    
}

function XWager(onState) {
    
    switch(onState) {
        case 'onLoss' : autoBetStore.state.inUse.wager = IncreaseOrReturn(autoBetStore.state.onLoss.wager, betStore.state.wager.num, autoBetStore.state.init.wager);break;
        case 'onWin' : autoBetStore.state.inUse.wager = IncreaseOrReturn(autoBetStore.state.onWin.wager, betStore.state.wager.num, autoBetStore.state.init.wager);break;
        case 'returnToBase' : autoBetStore.state.inUse.wager = autoBetStore.state.init.wager;break;
    }

}

function XMultiplier(onState) {
    
    switch(onState) {
        case 'onLoss' : autoBetStore.state.inUse.multiplier = IncreaseOrReturn(autoBetStore.state.onLoss.multiplier, betStore.state.multiplier.num, autoBetStore.state.init.multiplier);break;
        case 'onWin' : autoBetStore.state.inUse.multiplier = IncreaseOrReturn(autoBetStore.state.onWin.multiplier, betStore.state.multiplier.num, autoBetStore.state.init.multiplier);break;
        case 'returnToBase' : autoBetStore.state.inUse.multiplier = autoBetStore.state.init.multiplier;break;
    }

}

function ResetAfterIncrease(reset_, resetCount) {

    if(reset_ > 0) {
        
        if(resetCount+1 >= reset_) {
                    
            XWager('returnToBase');
            XMultiplier('returnToBase');
            return 0;
                    
        } else {
            
            resetCount++;
            return resetCount;
            
        }
        
    }
    return 0;
}

function ResetAfter(onState){
    
    switch(onState) {
        case 'onLoss' : 
            autoBetStore.state.inUse.resetAfterLoss = ResetAfterIncrease(autoBetStore.state.onLoss.reset, autoBetStore.state.inUse.resetAfterLoss);
            autoBetStore.state.inUse.resetAfterWin = 0;
            break;
        case 'onWin' : 
            autoBetStore.state.inUse.resetAfterWin = ResetAfterIncrease(autoBetStore.state.onWin.reset, autoBetStore.state.inUse.resetAfterWin);
            autoBetStore.state.inUse.resetAfterLoss = 0;
            break;
        case 'returnToBase' :
            autoBetStore.state.inUse.resetAfterWin = 0;
            autoBetStore.state.inUse.resetAfterLoss = 0;
            break;
    }

    
}

function SwitchAfterIncrease(switch_, switchCount) {
    
    if(switch_ > 0) {
        
        if(switchCount+1 >= switch_) {
                    
            (autoBetStore.state.inUse.switchTarget) ? autoBetStore.state.inUse.switchTarget = false : autoBetStore.state.inUse.switchTarget = true;
            return 0;
                    
        } else {
            
            switchCount++;
            return switchCount;
            
        }
        
    }
    return 0;
}

function SwitchAfter(onState){
    
    switch(onState) {
        case 'onLoss' : 
            autoBetStore.state.inUse.switchAfterLoss = SwitchAfterIncrease(autoBetStore.state.onLoss.switchAfter, autoBetStore.state.inUse.switchAfterLoss);
            autoBetStore.state.inUse.switchAfterWin = 0;
            autoBetStore.state.inUse.switchAfterBet = 0;
            break;
        case 'onWin' : 
            autoBetStore.state.inUse.switchAfterWin = SwitchAfterIncrease(autoBetStore.state.onWin.switchAfter, autoBetStore.state.inUse.switchAfterWin);
            autoBetStore.state.inUse.switchAfterLoss = 0;
            autoBetStore.state.inUse.switchAfterBet = 0;
            break;
        case 'onBets' : 
            autoBetStore.state.inUse.switchAfterBet = SwitchAfterIncrease(autoBetStore.state.stop.switchAfter, autoBetStore.state.inUse.switchAfterBet);
            autoBetStore.state.inUse.switchAfterLoss = 0;
            autoBetStore.state.inUse.switchAfterWin = 0;
            break;
    }

    
}

function PlaceBet(wager, multiplier, target) {
    
    multiplier = Math.round(multiplier * 100) / 100;

    Dispatcher.sendAction('UPDATE_WAGER', {
        str: wager.toString()
        });
    Dispatcher.sendAction('UPDATE_MULTIPLIER', {
        str: multiplier.toString()
        });
    updateMultiplier(multiplier);
    (target) ? $('#bet-lo').click(): $('#bet-hi').click();
    
}

function ResetIfWager(wager, wagerInUse) {
    
    if(wager > 0) {
        if(wagerInUse >= wager) {
            
            XWager('returnToBase');
            XMultiplier('returnToBase');
            
        }
    }
}

function ReturnToBaseButtons(onState) {
    
    switch(onState) {
        case 'onWin':
            if (autoBetStore.state.onWin.returnToBase) { 
                return 'returnToBase'; 
                
            } else { 
                return onState;
                
            }
        case 'onLoss':
            if (autoBetStore.state.onLoss.returnToBase) { 
                return 'returnToBase'; 
                
            } else { 
                return onState;
                
            }
    }
}

function SwitchState(onState) {
    
    switch(onState) {
        case 'onWin' : 
            if(autoBetStore.state.onWin.switchAfter > 0) {
                return onState;
            } else {
                return 'onBets';
            }
        case 'onLoss' : 
            if(autoBetStore.state.onLoss.switchAfter > 0) {
                return onState;
            } else {
                return 'onBets';
            }
    }
}

function OnAction(onState) {
    
    SwitchAfter(SwitchState(onState));
    onState = ReturnToBaseButtons(onState);
    XWager(onState);
    XMultiplier(onState);
    ResetAfter(onState);
    StopAfterAction(onState);
    ResetIfWager(autoBetStore.state.stop.resetWager, autoBetStore.state.inUse.wager);
    
}

function StopAfterAction(onState) {
    switch(onState) {
        case 'onWin': 
            autoBetStore.state.inUse.stopAfterWin = StopAfterBets(autoBetStore.state.inUse.stopAfterWin, autoBetStore.state.onWin.stopAfter);
            autoBetStore.state.inUse.stopAfterLoss = 0;
            break;
        case 'onLoss':
            autoBetStore.state.inUse.stopAfterLoss = StopAfterBets(autoBetStore.state.inUse.stopAfterLoss, autoBetStore.state.onLoss.stopAfter);
            autoBetStore.state.inUse.stopAfterWin = 0;
            break;
        case 'onBets':
            autoBetStore.state.inUse.stopAfter = StopAfterBets(autoBetStore.state.inUse.stopAfter, autoBetStore.state.stop.stopAfter);
            break;
    }
}

function BetResult() {
    
    if(autoBetStore.state.inUse.firstBet) {
       worldStore.state.lastRoll = null; 
    }
    
    if(!autoBetStore.state.inUse.firstBet && worldStore.state.lastRoll && autoBetStore.state.inUse.oldBetId < worldStore.state.lastRoll.id) {
       autoBetStore.state.inUse.isResult = true;
       autoBetStore.state.inUse.oldBetId = worldStore.state.lastRoll.id;
       BetsCount();
       ProfitAutoBet();
       StopAfterAction('onBets');
    }
    autoBetStore.state.inUse.firstBet = false;
    
}

function StopIfBalance() {
    
    if (worldStore.state.user.balance < 100) {
        StopAutoBetter();
    } else if (autoBetStore.state.stop.greaterThan < worldStore.state.user.balance / 100 && autoBetStore.state.stop.greaterThan > 0) {
        StopAutoBetter();
    } else if (autoBetStore.state.stop.lowerThan > worldStore.state.user.balance / 100 && autoBetStore.state.stop.lowerThan > 0) {
        StopAutoBetter();
    } else if (worldStore.state.user.balance < betStore.state.wager.num * 100) {
        StopAutoBetter();
    }
    
}


function StopIfMultiplier() {
    
    if (worldStore.state.user.multiplier < 1.01) {
        StopAutoBetter();
    } else if (worldStore.state.user.multiplier > 9900) {
        StopAutoBetter();
    }
    
}

function StopAfterBets(stopAfterCount, stopAfter_){
    
    if(stopAfter_ > 0) {
        
        if(stopAfterCount+1 >= stopAfter_) {
            StopAutoBetter();
            return 0;
        } else {
           stopAfterCount++;
           return stopAfterCount;
        }
    }
    
}

function StopActions() {
    StopIfBalance();
    StopIfMultiplier();
    
}

function StopAutoBetter() {
    $('#start-stop').click();
}

function BetsCount(){
    
    var betsCount = autoBetStore.state.betCount + 1;
    Dispatcher.sendAction('UPDATE_BETS_COUNT', betsCount);
    
}

function ProfitAutoBet(){
    
    var profitNow = autoBetStore.state.profit + worldStore.state.lastRoll.profit;
    Dispatcher.sendAction('UPDATE_PROFIT_STRATEGY', profitNow);
}


function AutoBetter(){
    
    BetResult();
    StopActions();
    
    if(!autoBetStore.state.inUse.isResult) {
        
        
        
        PlaceBet(autoBetStore.state.inUse.wager, autoBetStore.state.inUse.multiplier, autoBetStore.state.inUse.switchTarget);
    
    }
    
    if(autoBetStore.state.inUse.isResult) {
        autoBetStore.state.inUse.isResult = false; 
        
        if(worldStore.state.lastRoll.profit < 0) {
            
            OnAction('onLoss');
            
        } else {
            
            OnAction('onWin');        
        }
        
    }
   
}


function StartAutoBet() {
    Dispatcher.sendAction('INIT_IN_USE_VALUES', null);
    timerId = setInterval(function() {
                AutoBetter();
            }, 200); 
}



function ClearInputs() {

    Dispatcher.sendAction('ONLOSS_UPDATE_WAGER', 0);
    Dispatcher.sendAction('ONLOSS_UPDATE_MULTIPLIER', 0);
    Dispatcher.sendAction('ONLOSS_UPDATE_RESET', 0);
    Dispatcher.sendAction('ONLOSS_UPDATE_SWITCH', 0);
    Dispatcher.sendAction('ONLOSS_UPDATE_STOPAFTER', 0);

    Dispatcher.sendAction('ONWIN_UPDATE_WAGER', 0);
    Dispatcher.sendAction('ONWIN_UPDATE_MULTIPLIER', 0);
    Dispatcher.sendAction('ONWIN_UPDATE_RESET', 0);
    Dispatcher.sendAction('ONWIN_UPDATE_SWTICH_', 0);
    Dispatcher.sendAction('ONWIN_UPDATE_STOPAFTER', 0);

    Dispatcher.sendAction('STOP_UPDATE_GREATER', 0);
    Dispatcher.sendAction('STOP_UPDATE_LOWER', 0);
    Dispatcher.sendAction('STOP_UPDATE_STOPAFTERBETS', 0);
    Dispatcher.sendAction('STOP_UPDATE_SWITCHAFTERBETS', 0);
    Dispatcher.sendAction('STOP_UPDATE_RESETWAGER', 0);


}

function sendTips(message) {
    
    var messageArray = message.split(" ");
    var responseForChat;
    if(messageArray.length == 3 ) {
        
        if(messageArray[0] == config.tip_command){
            
            MoneyPot.tipUser(messageArray[1],parseFloat(messageArray[2])*100,{
                success: function(response) {
                    console.log('[MoneyPot.tipUser]:', response);
                    if(response) {
                    Dispatcher.sendAction('SEND_MESSAGE', "Done!");
                    }
                },
                error: function(err) {
                    console.error('[MoneyPot.tipUser] Error:', err);
                    
                    if(err) {
                        Dispatcher.sendAction('SEND_MESSAGE', "Error!");
                    }
                }
            });
        }
        
    } else if(messageArray[0] == config.tip_command){
        
        responseForChat = "'"+config.tip_command+" [username] [amount]"+"'";
        Dispatcher.sendAction('SEND_MESSAGE', responseForChat);
    }
    
    
    
}

initJack();
setInterval(initJack,3000);
initHistoryJackpots();