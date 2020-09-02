/**
 * If the affiliData variable not defined or not array, create it
 */
if(typeof(affiliData) !== 'array') {
    window.affiliData = window.affiliData || [];
}

/**
 * If the affili is not function, define it
 */
if(typeof(affili) !== 'function') {
    window.affili = function() {
        affiliData.push(arguments);
    }
}

/**
 * Encapsulated function
 * The window object is supported by all browsers. It represents the browser's window.
 * The accountId is your account id where can be fined in your affili panel, in developers section.
 */
(function(window, accountId = false) {
   /**
    * Is a cookie object to help create, edit or delete cookies
    * based on js-cookie package
    * https://github.com/js-cookie/js-cookie
    */
    const cookies = {
        getCookie(name, def = null) {
            let v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)')
            return v ? v[2] : def
        },

        setCookie(name, value, days) {
            let date = new Date
            date.setTime(date.getTime() + 24*60*60*1000*days)
            let siteDomain = window.location.hostname
            // document.cookie = name + "=" + value + ";path=/;expires=" + date.toGMTString()
            document.cookie = name + "=" + value + ";domain=."+ siteDomain +";path=/;expires=" + date.toGMTString();
        },

        deleteCookie(name) {
            this.setCookie(name, '', -1)
        }
    }

   /**
    * All supported conversion types
    */
    const conversionTypes = {
        CLICK: 'click',
        LEAD_REFERRAL: 'lead_referral',
        TRIAL_REFERRAL: 'trial_referral',
        BUY_REFERRAL: 'buy_referral',
        LEAD_CODE: 'lead_code',
        TRIAL_CODE: 'trial_code',
        BUY_CODE: 'buy_code',
    }

    /**
     * The request object used to get URL parameters
     */
    const request = {
        /**
         * Return URL parameters as a array
         */
        getUrlVars() {
            let vars = {}
            window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                vars[key] = value
            })
            return vars
        },

        /**
         * @param {string} parameter
         * @param {string} defaultvalue
         */
        getUrlParam(parameter, defaultvalue = null) {
            let urlparameter = defaultvalue
            if(window.location.href.indexOf(parameter) > -1){
                urlparameter = request.getUrlVars()[parameter]
            }

            return urlparameter
        }
    }

    /**
     * The xhr object handle requests to affili server
     */
    const xhr = {
        /**
         * When we need to set a cookie on the client browser
         *
         * @param {object} data
         * @param {function} callback
         */
        setCookie(data, callback = function(response){}) {
            this.request('POST', this.url('set-cookie'), data, callback)
        },

        /**
         * When we need to track order
         *
         * @param {object} data
         * @param {function} callback
         */
        saveConversion(data, callback = function(response){}) {
            this.request('POST', this.url('conversion'), data, callback)
        },

        /**
         * When we need to track click, use it for CPC conversion
         *
         * @param {object} data
         * @param {funtion} callback
         */
        saveClick(data, callback = function(response){}) {
            this.request('POST', url('click'), data, callback)
        },

        /**
         * When we need to track leads, use it for CPL conversion
         *
         * @param {object} data
         * @param {function} callback
         */
        saveLead(data, callback = function(response){}) {
            this.request('POST', url('lead'), data, callback)
        },

        /**
         * The Base API url
         *
         * @param {string} uri
         */
        url(uri) {
            return 'https://core.affili.ir/api/clients/'+uri
        },

        /**
         * The request method send a request to affili server
         *
         * @param {string} method
         * @param {string} url
         * @param {object} data
         * @param {function} callback
         */
        request(method, url ,data, callback = function(response){}) {
            let xhr = "undefined" != typeof XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
            xhr.withCredentials = true

            xhr.addEventListener("readystatechange", function () {
                if (this.readyState === 4 && this.status === 200) {
                    let response = JSON.parse(this.response)
                    callback(response)
                }
            })

            let json = JSON.stringify(data)

            xhr.open(method, url)
            xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8')
            xhr.setRequestHeader('Access-Control-Allow-Headers', 'x-requested-with')

            xhr.send(json)
        }
    }

    /**
     * The affiliConst object manage all of traking processes
     */
    const affiliConst = {
        account_id: accountId,
        aff_id: false,
        referrer: false,
        token: false,
        /**
         * To initial affili, The create method must be call
         * In this method, we check cookies on the client's browser
         *
         * @param {string} account_id
         * @param {object} options
         */
        create(account_id, options) {
            this.account_id = account_id

            this.token    = cookies.getCookie('affili_token', false)
            this.referrer = cookies.getCookie('affili_referrer', false)
            this.aff_id   = cookies.getCookie('affili_aff_id', false)
        },

        /**
         * After calling the create method, we detect it to set new cookies
         * if the URL has 'aff_id' and 'referrer' parameters
         *
         * @param {object} options
         */
        detect(options = {}) {
            let that     = this
            let aff_id   = request.getUrlParam('aff_id', false)
            let referrer = request.getUrlParam('referrer', false)

            // If the URL has not 'aff_id' and 'referrer' return false
            if(aff_id === false || referrer === false) {
                return false
            }

            this.aff_id   = aff_id
            this.referrer = referrer

            const defaultDetectOptions = {}

            options = Object.assign({}, defaultDetectOptions, options, {
                aff_id: this.aff_id,
                referrer: this.referrer,
                account_id: this.account_id
            })

            // Set or override cookies
            xhr.setCookie(options, function(response) {
                that.token = response.data.token

                cookies.setCookie('affili_token', that.token, response.data.valid_days)
                cookies.setCookie('affili_referrer', that.referrer, response.data.valid_days)
                cookies.setCookie('affili_aff_id', that.aff_id, response.data.valid_days)
                cookies.setCookie('delete_cookie', response.data.delete_cookie, response.data.valid_days)
            })
        },

        /**
         * Calling The conversion method, When The client order process completed and client reach goal page
         *
         * @param {string} external_id
         * @param {integer} amount
         * @param {string} name
         * @param {object} options
         * @param {boolean} deleteCookie
         */
        conversion(external_id, amount, name = 'default', options = {}, deleteCookie = true) {
            let that = this
            if(this.aff_id === false || this.referrer === false) {
                return false
            }

            const defaultDetectOptions = {
                meta_data: null,
                coupon: null,
                type: conversionTypes.BUY_REFERRAL,
            }

            const data = Object.assign({}, defaultDetectOptions, options, {
                aff_id: this.aff_id,
                referrer: this.referrer,
                account_id: this.account_id,
                token: this.token,
                external_id: external_id,
                amount: amount,
                commissions: [
                    {
                        sub_amount: amount,
                        name: name
                    }
                ]
            })

                        
            // Save conversion and reset cookies as a default
            xhr.saveConversion(data, function(response) {
                // As a default we reset cookies
                if(['1',1,'true', true].includes(cookies.getCookie('delete_cookie', true))
                    && deleteCookie === true
                ) {
                    that.reset()
                }
            })
        },

        /**
         * Calling The conversionMulti method, When The client order process completed and client reach goal page
         * and you have multi commission for multi categories
         *
         * @param {string} external_id
         * @param {integer} amount
         * @param {object} commissions
         * @param {object} options
         * @param {boolean} deleteCookie
         */
        conversionMulti(external_id, amount, commissions, options = {}, deleteCookie = true) {
            if(this.aff_id === false || this.referrer === false) {
                return false
            }

            const defaultDetectOptions = {
                meta_data: {},
                coupon: null,
                type: conversionTypes.BUY_REFERRAL,
            }

            const data = Object.assign({}, defaultDetectOptions, options, {
                aff_id: this.aff_id,
                referrer: this.referrer,
                account_id: this.account_id,
                token: this.token,
                external_id: external_id,
                amount: amount,
                commissions: commissions
            })

            // Save conversion and reset cookies as a default
            xhr.saveConversion(data, function(response) {
                //As a default we reset
                if(['1',1,'true', true].includes(cookies.getCookie('delete_cookie', true))
                    && deleteCookie === true
                ) {
                    that.reset()
                }
            })
        },

        /**
         * Calling the click method, When in your affiliate program you set CPC commission
         *
         * @param {obejct} options
         */
        click(options = {}) {
            if(this.aff_id === false || this.referrer === false) {
                return false
            }

            const defaultDetectOptions = {
                meta_data: {},
                type: conversionTypes.CLICK,
            }

            const data = Object.assign({}, defaultDetectOptions, options, {
                aff_id: this.aff_id,
                referrer: this.referrer,
                account_id: this.account_id,
                token: this.token,
            })

            xhr.saveClick(data)
        },

        /**
         * Calling the click method, When in your affiliate program you set CPL commissions
         *
         * @param {string} name, The name is a key where you defined in the panel where you create commission
         * @param {object} options
         */
        lead(name, options = {}) {
            if(this.aff_id === false || this.referrer === false) {
                return false
            }

            const defaultDetectOptions = {
                meta_data: {},
                type: conversionTypes.LEAD_REFERRAL,
            }

            const data = Object.assign({}, defaultDetectOptions, options, {
                aff_id: this.aff_id,
                referrer: this.referrer,
                account_id: this.account_id,
                token: this.token,
                name: name,
            })

            xhr.saveLead(data)
        },

        /**
         * Calling the reset method to clear all tokens and settings.
         */
        reset() {
            this.aff_id   = false
            this.referrer = false
            this.token    = false
            cookies.deleteCookie('affili_token')
            cookies.deleteCookie('affili_referrer')
            cookies.deleteCookie('affili_aff_id')
            cookies.deleteCookie('delete_cookie')
        },

        /**
         * Calling the log method to print current settings in console
         */
        log() {
            console.log({
                'account_id' : this.account_id,
                'aff_id'     : this.aff_id,
                'referrer'   : this.referrer,
                'token'      : this.token,
            })
        }
    }

    /**
     * The affiliFunc used to make all of the affiliConst methods promise able.
     *
     * @param {string} method
     * @param {complex} params
     */
    let affiliFunc = function(method, params) {
        return new Promise(function(resolve, reject) {
            try {
                let result = affiliConst[method](...params)
                resolve(result)
            } catch(e) {
                reject(e)
            }
        })
    }

    /**
     * As a simple way, At first, we push all functions to affiliData array then we call them after
     * script loaded.
     */
    affiliData.forEach(function(arg) {
        var slicedArgs = Array.prototype.slice.call(arg, 1);
        affiliFunc(arg[0], slicedArgs)
    })

    let eventify = function(arr, callback) {
        arr.push = function(e) {
            Array.prototype.push.call(arr, e)
            callback(arr)
        }
    }

    /**
     * Make all affiliConst methods async
     */
    eventify(affiliData, function(args) {
        args.forEach(function(arg) {
            var slicedArgs = Array.prototype.slice.call(arg, 1);
            affiliFunc(arg[0], slicedArgs)
        })
    })
})(window, affiliAccountId)
