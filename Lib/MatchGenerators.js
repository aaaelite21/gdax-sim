const crypto = require("crypto");
const Parse24Time = require("../Lib/Parse24Time");
const Heartbeat = require("./Heartbeat");

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

function createMatchesFromCandle(candlesArrayOrObj, _start_time, _end_time) {
  let start_time = _start_time === undefined ? "0000" : _start_time;
  let end_time = _end_time === undefined ? "2460" : _end_time;
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
        while (lastTime + 60000 < candleTime.getTime()) {
          lastTime += 60000;
          messages.push(Heartbeat.create(this.pair, lastTime));
        }
      }

      lastTime = candleTime.getTime();

      for (let i = 0; i < 4; i++) {
        let key;
        switch (i) {
          case 0:
            key = "open";
            break;
          case 1:
            if (candle.close < candle.open) {
              key = "high";
            } else {
              key = "low";
            }
            break;
          case 2:
            if (candle.close < candle.open) {
              key = "low";
            } else {
              key = "high";
            }
            break;
          case 3:
            key = "close";
            break;
        }

        //ToDo: base side off of the direction of price movemnet
        let side = Math.random() > 0.5 ? "buy" : "sell";

        if (messages.length > 0) {
          let lastPrice = parseFloat(messages[messages.length - 1].price);
          if (candle[key] > lastPrice) {
            side = "buy";
          } else if (candle[key] < lastPrice) {
            side = "sell";
          }
        }

        messages.push(
          createMatch({
            side: side,
            size: candle.volume / 4,
            time: candleTime.toISOString(),
            product_id: this.pair,
            price: candle[key],
          }),
        );

        candleTime.setSeconds(candleTime.getSeconds() + 14);
      }
    }
  }

  return messages;
}

module.exports = {
  createMatch: createMatch,
  createMatchesFromCandle: createMatchesFromCandle,
};
