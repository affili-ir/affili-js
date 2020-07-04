(function(window) {
    // Cookies helper
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

    const transactionTypes = {
        CLICK: 'click',
        LEAD_REFERRAL: 'lead_referral',
        TRIAL_REFERRAL: 'trial_referral',
        BUY_REFERRAL: 'buy_referral',
        LEAD_CODE: 'lead_code',
        TRIAL_CODE: 'trial_code',
        BUY_CODE: 'buy_code',
    }

    const request = {
        getUrlVars() {
            let vars = {}
            window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                vars[key] = value
            })
            return vars
        },

        getUrlParam(parameter, defaultvalue = null) {
            let urlparameter = defaultvalue
            if(window.location.href.indexOf(parameter) > -1){
                urlparameter = request.getUrlVars()[parameter]
            }

            return urlparameter
        }
    }

    const xhr = {
        setCookie(data, callback = function(response){}) {
            let xhr = "undefined" != typeof XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
            xhr.withCredentials = true

            xhr.addEventListener("readystatechange", function () {
                if (this.readyState === 4 && this.status === 200) {
                    let response = JSON.parse(this.response)
                    callback(response)
                }
            })

            let json = JSON.stringify(data)

            xhr.open("POST", this.url('set-cookie'))
            xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8')
            xhr.setRequestHeader('Access-Control-Allow-Headers', 'x-requested-with')

            xhr.send(json)
        },

        saveConversion(data, callback = function(response){}) {
            let xhr = "undefined" != typeof XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
            xhr.withCredentials = true

            xhr.addEventListener("readystatechange", function () {
                if (this.readyState === 4 && this.status === 200) {
                    let response = JSON.parse(this.response)
                    callback(response)
                }
            })

            let json = JSON.stringify(data)

            xhr.open("POST", this.url('conversion'))
            xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8')
            xhr.setRequestHeader('Access-Control-Allow-Headers', 'x-requested-with');

            xhr.send(json)
        },

        url(uri) {
            return 'https://core.affili.ir/api/clients/'+uri
        }
    }

    const affili = {
        account_id: false,
        aff_id: false,
        referrer: false,
        token: false,
        create(account_id, options) {
            this.account_id = account_id

            this.token    = cookies.getCookie('affili_token', false)
            this.referrer = cookies.getCookie('affili_referrer', false)
            this.aff_id   = cookies.getCookie('affili_aff_id', false)
        },

        detect(options = {}) {
            let that     = this
            let aff_id   = request.getUrlParam('aff_id', false)
            let referrer = request.getUrlParam('referrer', false)

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

            xhr.setCookie(options, function(response) {
                that.token = response.data.token

                cookies.setCookie('affili_token', that.token, response.data.valid_days)
                cookies.setCookie('affili_referrer', that.referrer, response.data.valid_days)
                cookies.setCookie('affili_aff_id', that.aff_id, response.data.valid_days)
                cookies.setCookie('delete_cookie', response.data.delete_cookie, response.data.valid_days)
            })
        },

        conversion(external_id, amount, commission_name = 'default', options = {}, deleteCookie = true) {
            let that = this
            if(this.aff_id === false || this.referrer === false) {
                return false
            }

            const defaultDetectOptions = {
                meta_data: null,
                coupon: null,
                type: transactionTypes.BUY_REFERRAL,
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
                        name: commission_name
                    }
                ]
            })

            xhr.saveConversion(data, function(response) {
                //As a default we reset
                if(['1',1,'true', true].includes(cookies.getCookie('delete_cookie', true))
                    && deleteCookie === true
                ) {
                    that.reset()
                }
            })
        },

        // conversionMulti(external_id, amount, commissions, options = {}) {
        //     if(this.aff_id === false || this.referrer === false) {
        //         return false
        //     }

        //     const defaultDetectOptions = {
        //         meta_data: {},
        //         coupons: ''
        //     }

        //     const data = Object.assign({}, defaultDetectOptions, options, {
        //         aff_id: this.aff_id,
        //         referrer: this.referrer,
        //         account_id: this.account_id,
        //         external_id: external_id,
        //         amount: amount,
        //         commissions: commissions
        //     })

        //     xhr.saveConversion(data)
        // },

        reset() {
            this.aff_id   = false
            this.referrer = false
            this.token    = false
            cookies.deleteCookie('affili_token')
            cookies.deleteCookie('affili_referrer')
            cookies.deleteCookie('affili_aff_id')
            cookies.deleteCookie('delete_cookie')
        }
    }

    window.affiliData = window.affiliData || []

    let affiliFunc = function(method, params) {
        return new Promise(function(resolve, reject) {
            try {
                let result = affili[method](...params)
                resolve(result)
            } catch(e) {
                reject(e)
            }
        })
    }

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

    eventify(affiliData, function(args) {
        args.forEach(function(arg) {
            var slicedArgs = Array.prototype.slice.call(arg, 1);
            affiliFunc(arg[0], slicedArgs)
        })
    })
})(window)