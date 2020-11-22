const crypto = require("crypto");
const Parse24Time = require("../Lib/Parse24Time");
const Heartbeat = require("./Heartbeat");

function createTempCandle() {
  return {
    time: null,
    open: null,
    high: -Infinity,
    low: Infinity,
    close: null,
    volume: 0,
  };
}

function getBucket(_time) {
  let bucket = Math.floor(_time.getMinutes() / 15);
  return bucket;
}

function createMatch(templateObj) {
  return {
    type: "match",
    side: templateObj.side,
    size:
      templateObj.size === undefined
        ? templateObj.filled_size
        : templateObj.size,
    price: templateObj.price.toString(),
    time: templateObj.time,
    product_id: templateObj.product_id,
    trade_id: Math.round(100000000 * Math.random()),
    sequence: Math.round(100000000 * Math.random()),
    taker_order_id:
      templateObj.taker_order_id !== undefined
        ? templateObj.taker_order_id
        : crypto
            .createHash("sha1")
            .update(JSON.stringify(Math.random().toString()))
            .digest("hex"),
    maker_order_id:
      templateObj.maker_order_id !== undefined
        ? templateObj.maker_order_id
        : crypto
            .createHash("sha1")
            .update(JSON.stringify(Math.random().toString()))
            .digest("hex"),
  };
}

function createMatchesFromCandle(
  candlesArrayOrObj,
  start_time = "0000",
  end_time = "2460",
  pair = "BTC-USD",
  reduce_signals = false,
) {
  let messages = [];
  let candles =
    candlesArrayOrObj.length === undefined
      ? [candlesArrayOrObj]
      : candlesArrayOrObj;
  let candleCount = candles.length;
  let lastTime = null;
  let start = Parse24Time(start_time);
  let end = Parse24Time(end_time);
  let afterStart = false;
  let afterEnd = false;
  let tmp = createTempCandle();
  let lastBucket = -1;
  for (let c = 0; c < candleCount; c++) {
    let candle = candles[c];
    let candleTime = new Date(candle.time);
    if (
      !afterStart &&
      candleTime.getUTCHours() >= start.hours &&
      candleTime.getMinutes() >= start.minutes
    ) {
      afterStart = true;
    }
    if (
      !afterEnd &&
      candleTime.getUTCHours() >= end.hours &&
      candleTime.getMinutes() >= end.minutes
    ) {
      afterEnd = true;
    }
    if (afterStart && !afterEnd) {
      if (lastTime !== null) {
        while (lastTime + 60000 < candleTime.getTime() && !reduce_signals) {
          lastTime += 60000;
          messages.push(Heartbeat.create(pair, lastTime));
        }
      }

      lastTime = candleTime.getTime();
      let bucket = getBucket(candleTime);
      if (lastBucket < 0) lastBucket = bucket;
      if (reduce_signals && bucket !== lastBucket) {
        tmp.time.setMinutes(lastBucket * 15);
        messages = messages.concat(breakCandleIntoMatches(tmp, pair));
        lastBucket = bucket;
        tmp = createTempCandle();
      }

      //handle tmp candle
      tmp.time = tmp.time || candleTime;
      tmp.open = tmp.open || candle.open;
      tmp.high = candle.high > tmp.high ? candle.high : tmp.high;
      tmp.low = candle.low < tmp.low ? candle.low : tmp.low;
      tmp.close = candle.close;
      tmp.volume += parseFloat(candle.volume);

      if (!reduce_signals || (reduce_signals && c === candleCount - 1)) {
        messages = messages.concat(breakCandleIntoMatches(tmp, pair));
        tmp = createTempCandle();
      }
    }
  }
  return messages;
}

function breakCandleIntoMatches(tmp, pair) {
  let lastPrice = 0;
  let messages = [];
  for (let i = 0; i < 4; i++) {
    let key;
    switch (i) {
      case 0:
        key = "open";
        break;
      case 1:
        if (tmp.close < tmp.open) {
          key = "high";
        } else {
          key = "low";
        }
        break;
      case 2:
        if (tmp.close < tmp.open) {
          key = "low";
        } else {
          key = "high";
        }
        break;
      case 3:
        key = "close";
        break;
    }

    let side = "buy";
    if (tmp[key] < lastPrice) {
      side = "sell";
    }
    lastPrice = tmp[key];

    messages.push(
      createMatch({
        side: side,
        size: tmp.volume / 4,
        time: tmp.time.toISOString(),
        product_id: pair,
        price: tmp[key],
      }),
    );
    tmp.time.setSeconds(tmp.time.getSeconds() + 14);
  }
  return messages;
}

module.exports = {
  createMatch: createMatch,
  createMatchesFromCandle: createMatchesFromCandle,
};
