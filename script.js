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
(function(window) {
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
            let siteDomain = location.hostname.split('.').slice(-2).join('.')
            document.cookie = name + "=" + value + ";domain=."+ siteDomain +";path=/;expires=" + date.toGMTString()
        },

        deleteCookie(name) {
            this.setCookie(name, '', -1)
        }
    }

   /**
    * All supported conversion types
    */
    const conversionTypes = {
        LEAD: 'lead',
        SALE: 'sale',
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
         * When we need to track conversion
         *
         * @param {object} data
         * @param {function} callback
         */
        saveConversion(data, callback = function(response){}) {
            this.request('POST', this.url('conversion'), data, callback)
        },

        /**
         * The Base API url
         *
         * @param {string} uri
         */
        url(uri) {
            return 'https://core.affili.ir/api/v2/clients/'+uri
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
        account_id: false,
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
        create(account_id, options = {}, callback = function () {}) {
            this.account_id = account_id

            this.token    = cookies.getCookie('affili_token', false)
            this.referrer = cookies.getCookie('affili_referrer', false)
            this.aff_id   = cookies.getCookie('affili_aff_id', false)

            callback()
        },

        /**
         * After calling the create method, we detect it to set new cookies
         * if the URL has 'aff_id' and 'referrer' parameters
         *
         * @param {object} options
         */
        detect(options = {}, callback = function () {}) {
            let that = this
            let aff_id = request.getUrlParam('aff_id', false)
            let referrer = request.getUrlParam('referrer', false)

            // If the URL has not 'aff_id' and 'referrer' return false
            if(aff_id === false || referrer === false) {
                return false
            }

            this.aff_id = aff_id
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

            callback()
        },

        /**
         * Calling The conversion method, When The client order process completed and client reach goal page
         *
         * @param {string} order_id
         * @param {integer} amount
         * @param {object} options
         * @param {boolean} deleteCookie
         */
        conversion(order_id, amount, options = {}, deleteCookie = true, callback = function () {}) {
            const defaultData = {
                meta_data: null,
                coupon: null,
                products: null,
                type: conversionTypes.SALE,

                aff_id: this.aff_id,
                referrer: this.referrer,
                token: this.token,
            }

            const data = Object.assign({}, defaultData, options, {
                account_id: this.account_id,
                order_id: order_id,
                amount: amount,
            })

            if(data.aff_id === false || data.referrer === false) {
                return false
            }
            let that = this

            // Save conversion and reset cookies as a default
            xhr.saveConversion(data, function(response) {
                // As a default we reset cookies
                if(['1',1,'true', true].includes(cookies.getCookie('delete_cookie', true))
                    && deleteCookie === true
                ) {
                    that.reset()
                }
            })

            callback()
        },

        /**
         * Calling the click method, When in your affiliate program you set CPL commissions
         *
         * @param {object} options
         */
         lead(options = {}, callback = function () {}) {
            const defaultData = {
                meta_data: {},
                type: conversionTypes.LEAD,

                aff_id: this.aff_id,
                referrer: this.referrer,
                token: this.token,
            }

            const data = Object.assign({}, defaultData, options, {
                account_id: this.account_id,
            })

            if(data.aff_id === false || data.referrer === false) {
                return false
            }

            xhr.saveConversion(data)

            callback()
        },

        /**
         * Calling the reset method to clear all tokens and settings.
         */
        reset(callback = function () {}) {
            this.aff_id = false
            this.referrer = false
            this.token = false
            cookies.deleteCookie('affili_token')
            cookies.deleteCookie('affili_referrer')
            cookies.deleteCookie('affili_aff_id')
            cookies.deleteCookie('delete_cookie')

            callback()
        },

        /**
         * Calling the log method to print current settings in console
         */
        log(callback = function () {}) {
            console.log({
                'account_id': this.account_id,
                'aff_id': this.aff_id,
                'referrer': this.referrer,
                'token': this.token,
            })

            callback()
        },

        __data__(callback = function () {}) {
            const data = JSON.parse(JSON.stringify({
                aff_id: this.aff_id,
                referrer: this.referrer,
                token: this.token,
            }))

            callback(data)
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
})(window)
