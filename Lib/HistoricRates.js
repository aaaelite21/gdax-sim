class Candle {
    constructor(time, granularity) {
        let now = new Date(time);
        let coeff = 1000 * granularity;
        this.time = (new Date(Math.floor(now.getTime() / coeff) * coeff)).getTime(); //come back to this
        this.open = undefined
        this.close = undefined
        this.high = undefined
        this.low = undefined
        this.volume = 0
        this.granularity = granularity;
    }
    process(price, size) {
        let p = parseFloat(price);
        let v = parseFloat(size);
        this.open = this.open === undefined ? p : this.open
        this.close = p;
        this.high = this.high === undefined ? p : (p > this.high ? p : this.high);
        this.low = this.low === undefined ? p : (p < this.low ? p : this.low);
        this.volume += v;
    }

    sameBucket(t) {
        let now = new Date(t);
        let coeff = this.granularity * 1000;
        return this.time === (new Date(Math.floor(now.getTime() / coeff) * coeff)).getTime();
    }

    toArray() {
        return [this.time / 1000, this.low, this.high, this.open, this.close, this.volume]
    }
}

module.exports = {
    processMatch: function (message) {
        if (message.type !== undefined) {
            if (message.type === 'match') {

                Object.keys(this.historics).forEach(key => {
                    let g;
                    switch (key) {
                        case 'm5':
                            g = 300;
                            break;
                        case 'm15':
                            g = 900;
                            break;
                        case 'h1':
                            g = 3600;
                            break;
                        case 'h6':
                            g = 21600;
                            break;
                        case 'd1':
                            g = 86400;
                            break;
                        default:
                            g = 60;
                            break;
                    }
                    if (this.historics[key].length === 0 ||
                        !this.historics[key][this.historics[key].length - 1].sameBucket(message.time)) {
                        this.historics[key].push(new Candle(message.time, g));
                        if (this.historics[key].length > 300) {
                            this.historics[key].shift()
                        }
                    }
                    this.historics[key][this.historics[key].length - 1].process(message.price, message.size);
                });

            }
        }
    },
    getProduct: function (product, params, callback) {
        let data;
        switch (params.granularity) {
            case 60:
                data = this.historics.m1.reverse();
                break;
            case 300:
                data = this.historics.m5.reverse();
                break;
            case 900:
                data = this.historics.m15.reverse();
                break;
            case 3600:
                data = this.historics.h1.reverse();
                break;
            case 21600:
                data = this.historics.h6.reverse();
                break;
            case 86400:
                data = this.historics.d1.reverse();
                break;
            default:
                data = {
                    message: 'Unsupported granularity'
                };
                break;
        }
        if (typeof callback === 'function') {
            callback(null, null, data);
        }
    }
}