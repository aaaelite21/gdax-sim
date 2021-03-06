class Candle {
  constructor(time, granularity, hours_start_on) {
    let now = new Date(time);
    let coeff = 1000 * granularity;
    this.open = undefined;
    this.close = undefined;
    this.high = undefined;
    this.low = undefined;
    this.volume = 0;
    this.granularity = granularity;
    this.offset = this.granularity === 3600 ? hours_start_on * 60000 : 0;
    this.time = this.calculateDate(now, coeff, this.offset);
  }

  calculateDate(now, coeff, offset) {
    return new Date(
      Math.floor((now.getTime() - offset) / coeff) * coeff + offset,
    ).getTime();
  }

  process(message) {
    let { price, size, isUser } = message;

    if (isUser === undefined) {
      let p = parseFloat(price);
      let v = parseFloat(size);
      this.open = this.open || p;
      this.close = p;
      this.high = this.high === undefined ? p : p > this.high ? p : this.high;
      this.low = this.low === undefined ? p : p < this.low ? p : this.low;
      this.volume += v;
    }
  }

  sameBucket(t) {
    let now = new Date(t);
    let coeff = this.granularity * 1000;
    return this.time === this.calculateDate(now, coeff, this.offset);
  }

  toArray() {
    return [
      this.time / 1000,
      this.low,
      this.high,
      this.open,
      this.close,
      this.volume,
    ];
  }
}

module.exports = {
  processMatch: function (message) {
    if (message.type !== undefined) {
      if (message.type === "match") {
        Object.keys(this.historics).forEach((key) => {
          let g;
          switch (key) {
            case "m5":
              g = 300;
              break;
            case "m15":
              g = 900;
              break;
            case "h1":
              g = 3600;
              break;
            case "h6":
              g = 21600;
              break;
            case "d1":
              g = 86400;
              break;
            default:
              g = 60;
              break;
          }
          if (
            this.historics[key].length === 0 ||
            !this.historics[key][this.historics[key].length - 1].sameBucket(
              message.time,
            )
          ) {
            this.historics[key].push(
              new Candle(message.time, g, this.hour_start_on),
            );
            if (this.historics[key].length > 300) {
              this.historics[key].shift();
            }
          }
          this.historics[key][this.historics[key].length - 1].process(message);
        });
      }
    }
  },
  getProduct: function (product, params, callback) {
    let section = [],
      data = [],
      end =
        params.end !== undefined
          ? new Date(params.end).getTime() / 1000
          : undefined,
      start =
        params.start !== undefined
          ? new Date(params.start).getTime() / 1000
          : undefined,
      limit = params.limit || 0;
    switch (params.granularity) {
      case 60:
        section = this.historics.m1.slice().reverse();
        break;
      case 300:
        section = this.historics.m5.slice().reverse();
        break;
      case 900:
        section = this.historics.m15.slice().reverse();
        break;
      case 3600:
        section = this.historics.h1.slice().reverse();
        break;
      case 21600:
        section = this.historics.h6.slice().reverse();
        break;
      case 86400:
        section = this.historics.d1.slice().reverse();
        break;
      default:
        data = {
          message: "Unsupported granularity",
        };
        break;
    }
    for (let i = 0; i < section.length; i++) {
      let a = section[i];
      if (a instanceof Candle) {
        a = section[i].toArray();
      }
      if (start !== undefined && end !== undefined) {
        if (a[0] >= start && a[0] <= end) {
          data.push(a);
        }
      } else if (end !== undefined && limit > 0) {
        if (a[0] <= end && data.length < limit) data.push(a);
      } else {
        data.push(a);
      }
    }

    if (typeof callback === "function") {
      callback(null, null, data);
    }
  },
};
