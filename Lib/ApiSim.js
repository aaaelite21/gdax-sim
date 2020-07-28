const WebocketSim = require("./WebsocketSim");
const UserSim = require("./UserAccountSim");
const GenerateOrder = require("./OrderGenerator");
const crypto = require("crypto");
const HistoricRates = require("./HistoricRates");
const Heartbeat = require("./Heartbeat");
const GetOrder = require("./Getorder");
const CompleteOrder = require("./CompleteOrder");
const EventDriver = require("../Lib/EventDriver");
const { emit } = require("process");
const _24HourTimeParser = require("../Lib/Parse24Time");
const Parse24Time = require("../Lib/Parse24Time");

class ApiSim {
  constructor(_params) {
    //base-currency / quote-currency
    let params = _params === undefined ? {} : _params;
    this.eventDriver = new EventDriver();
    this.user = new UserSim();
    this.user.cryptoBalance = isNaN(params.base_balance)
      ? 100
      : params.base_balance;
    this.user.fiatBalance = isNaN(params.quote_balance)
      ? 100
      : params.quote_balance;

    this.hour_start_on = isNaN(params.hour_start_on) ? 0 : params.hour_start_on;

    this.websocketClient = new WebocketSim();
    this.currentPrice = 0;
    this.pair = "ETH-BTC";
    this.currentTime = new Date().toISOString();
    this.taker_fee = isNaN(params.taker_fee) ? 0.005 : params.taker_fee / 100;
    this.historics = {
      m1: [],
      m5: [],
      m15: [],
      h1: [],
      h6: [],
      d1: [],
    };
  }
  afterSession() {}

  generateSalt() {
    return new Date().getTime().toString();
  }

  completeOrder(order) {
    CompleteOrder.call(this, order);
  }

  createHeartbeat(pair, time) {
    return Heartbeat.create.call(this, pair, time);
  }

  getOrder(orderId, callback) {
    GetOrder.call(this, orderId, callback);
  }

  getProductHistoricRates(product, params, callback) {
    HistoricRates.getProduct.call(this, product, params, callback);
  }

  logHistoricData(message) {
    HistoricRates.processMatch.call(this, message);
  }

  generateOrder(orderParams, salt) {
    return GenerateOrder.call(this, orderParams, salt);
  }

  buy(buyParams, callback) {
    buyParams.side = "buy";
    this.createOrder(buyParams, callback);
  }

  sell(sellParams, callback) {
    sellParams.side = "sell";
    this.createOrder(sellParams, callback);
  }

  cancelOrder(orderId, callback) {
    let data;
    let order;
    let buyIndex = this.user.limitOrders.openBuys
      .map((e) => {
        return e.id;
      })
      .indexOf(orderId);

    let sellIndex = this.user.limitOrders.openSells
      .map((e) => {
        return e.id;
      })
      .indexOf(orderId);

    if (buyIndex === -1 && sellIndex === -1) {
      data = {
        message: "no order by that id",
      };
    } else {
      if (buyIndex !== -1) {
        order = this.user.limitOrders.openBuys.splice(buyIndex, 1)[0];
        this.user.fiatBalance +=
          parseFloat(order.size) * parseFloat(order.price);
      } else if (sellIndex !== -1) {
        order = this.user.limitOrders.openSells.splice(sellIndex, 1)[0];
        this.user.cryptoBalance += parseFloat(order.size);
      }
      data = order.id;
    }
    if (typeof callback === "function") {
      callback(null, null, data);
    }
  }

  //Below are supporting functions
  backtest(candleData, _options) {
    let options = _options === undefined ? {} : _options;

    let messages = this.createMatchesFromCandle(
      candleData,
      options.start_time,
      options.end_time,
    );
    messages.reverse();
    let nextPrice, nextTime;
    while (messages.length > 0) {
      let m = messages.pop();
      if (m.price !== undefined) {
        this.currentPrice = parseFloat(m.price);
      }
      if (m.time !== undefined) {
        this.currentTime = m.time;
      }
      //market orders
      if (this.user.orders.length >= 1) {
        let subArray = [];
        this.user.orders.forEach((o) => {
          if (o.status === "pending") {
            subArray.push(o.id);
          }
        });
        for (let i = 0; i < subArray.length; i++) {
          let moid = subArray[i];
          let newmsg = this.fillOrder(moid, null, this.currentTime);
          for (let i = newmsg.length - 1; i >= 0; i--) {
            messages.push(newmsg[i]);
          }
        }
      }

      //limit orders below
      if (messages.length > 1) {
        let newmsg = [];
        let primeIndex = messages.length - 1;
        let mPrime = messages[primeIndex];
        if (mPrime.type === "match") {
          nextPrice = parseFloat(mPrime.price);
          nextTime = mPrime.time;
          if (nextPrice < this.currentPrice) {
            //buy order check
            this.user.limitOrders.openBuys.forEach((value, index) => {
              let orderPrice = parseFloat(value.price);
              if (
                value.status === "pending" &&
                orderPrice > nextPrice &&
                orderPrice <= this.currentPrice
              ) {
                newmsg = this.fillOrder(
                  this.user.limitOrders.openBuys[index].id,
                  null,
                  this.avgTime(this.currentTime, nextTime),
                );
              }
            });
          } else if (nextPrice > this.currentPrice) {
            //sellOrderCheck
            this.user.limitOrders.openSells.forEach((value, index) => {
              let orderPrice = parseFloat(value.price);
              if (
                value.status === "pending" &&
                orderPrice < nextPrice &&
                orderPrice >= this.currentPrice
              ) {
                newmsg = this.fillOrder(
                  this.user.limitOrders.openSells[index].id,
                  null,
                  this.avgTime(this.currentTime, nextTime),
                );
              }
            });
          }

          for (let i = newmsg.length - 1; i >= 0; i--) {
            messages.push(newmsg[i]);
          }
        }
      }
      //disbatch the message as the final thing
      this.logHistoricData(m);
      this.websocketClient.disbatch("message", m);
    }
    if (typeof this.afterSession === "function") {
      this.afterSession();
    }
  }

  fillOrder(orderId, size, time) {
    let order;
    let messages = [];
    let limitBuyIndex = this.user.limitOrders.openBuys
      .map((e) => {
        return e.id;
      })
      .indexOf(orderId);
    let limitSellIndex = this.user.limitOrders.openSells
      .map((e) => {
        return e.id;
      })
      .indexOf(orderId);
    let orderIndex = this.user.orders
      .map((e) => {
        return e.id;
      })
      .indexOf(orderId);

    if (limitBuyIndex !== -1 || limitSellIndex !== -1) {
      if (limitBuyIndex !== -1) {
        order = this.user.limitOrders.openBuys[limitBuyIndex];
        this.user.cryptoBalance += parseFloat(order.size);
        this.completeOrder(this.user.limitOrders.openBuys[limitBuyIndex]);
      } else if (limitSellIndex !== -1) {
        order = this.user.limitOrders.openSells[limitSellIndex];
        this.user.fiatBalance +=
          parseFloat(order.size) * parseFloat(order.price);
        this.completeOrder(this.user.limitOrders.openSells[limitSellIndex]);
      }

      messages.push(
        this.createMatch({
          side: order.side,
          maker_order_id: order.id,
          size: order.size,
          price: order.price,
          product_id: order.product_id,
          time: time,
        }),
      );

      messages.push({
        type: "done",
        side: order.side,
        order_id: orderId,
        reason: "filled",
        product_id: order.product_id,
        price: order.price.toString(),
        remaining_size: "0.00000000",
        sequence: Math.round(100000000 * Math.random()),
        time: time,
      });
    } else if (orderIndex !== -1) {
      this.completeOrder(this.user.orders[orderIndex]);
      order = this.user.orders[orderIndex];
      if (order.side === "buy") {
        let size = order.size === undefined ? order.filled_size : order.size;
        let funds =
          order.specified_funds !== undefined
            ? parseFloat(order.specified_funds)
            : parseFloat(order.size) * this.currentPrice * (1 + this.taker_fee);
        this.user.cryptoBalance += parseFloat(size);
        this.user.fiatBalance -= funds;
        //no size on markt buys with funds until they are completed
      } else if (order.side === "sell") {
        let funds =
          order.size === undefined
            ? parseFloat(order.funds)
            : parseFloat(order.size) * this.currentPrice * (1 - this.taker_fee);
        this.user.fiatBalance += funds;
      }
      messages.push(
        this.createMatch({
          side: order.side,
          taker_order_id: order.id,
          size: order.size !== undefined ? order.size : order.filled_size,
          price: this.currentPrice,
          product_id: order.product_id,
          time: time,
        }),
      );
      messages.push({
        type: "done",
        side: order.side,
        order_id: order.id,
        reason: "filled",
        product_id: order.product_id,
        price: this.price,
        remaining_size: "0.00000000",
        sequence: Math.round(100000000 * Math.random()),
        time: time,
      });
    }
    if (messages[1].side === "buy")
      this.eventDriver.onBuy(this.user.fiatBalance, this.user.cryptoBalance);
    else
      this.eventDriver.onSell(this.user.fiatBalance, this.user.cryptoBalance);

    return messages;
  }

  createOrder(orderPerams, callback) {
    let data = {
      status: "rejected",
    };
    let orderPrice = parseFloat(orderPerams.price);
    let orderSize = parseFloat(orderPerams.size);
    let orderFunds = parseFloat(orderPerams.funds);
    let order = this.generateOrder(orderPerams, this.generateSalt());
    if (
      !(
        order.type === "limit" &&
        order.side === "buy" &&
        parseFloat(order.price) >= this.currentPrice
      ) &&
      !(
        order.type === "limit" &&
        order.side === "buy" &&
        parseFloat(order.price) * parseFloat(order.size) > this.user.fiatBalance
      ) &&
      !(
        order.type === "limit" &&
        order.side === "sell" &&
        parseFloat(order.price) <= this.currentPrice
      ) &&
      !(
        order.type === "market" &&
        order.side === "buy" &&
        this.currentPrice * parseFloat(order.size) * (1 + this.taker_fee) >
          this.user.fiatBalance
      ) &&
      !(
        order.type === "market" &&
        order.side === "buy" &&
        orderFunds > this.user.fiatBalance
      ) &&
      !(
        order.type === "market" &&
        order.side === "sell" &&
        orderFunds > this.user.cryptoBalance * this.currentPrice
      ) &&
      !(
        order.side === "sell" &&
        parseFloat(order.size) > this.user.cryptoBalance
      )
      /*&&
                   !(order.side === 'buy' && parseFloat(order.funds) > this.user.fiatBalance)*/
    ) {
      //save order
      if (order.type === "limit") {
        if (order.side === "buy") {
          this.user.limitOrders.openBuys.push(order);
          this.user.fiatBalance -= orderPrice * orderSize;
        } else {
          this.user.limitOrders.openSells.push(order);
          this.user.cryptoBalance -= orderSize;
        }
      } else if (order.type === "market") {
        if (order.side === "buy") {
          if (!isNaN(orderFunds)) {
            //order.size = (orderFunds * (1 - this.taker_fee)) / this.currentPrice).toString()
          }
          this.user.orders.push(order);
        } else {
          if (!isNaN(orderFunds)) {
            orderSize = orderFunds / this.currentPrice;
            //order.size = orderSize.toString();
          }
          this.user.cryptoBalance -= orderSize;
          this.user.orders.push(order);
        }
      }

      //set data to order for callback
      data = order;
    }

    if (typeof callback === "function") {
      callback(null, null, data);
    }
  }

  createMatchesFromCandle(candlesArrayOrObj, _start_time, _end_time) {
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
            messages.push(this.createHeartbeat(this.pair, lastTime));
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
            this.createMatch({
              side: side,
              size: candle.volume / 4,
              time: candleTime.toISOString(),
              product_id: this.product_id,
              price: candle[key],
            }),
          );

          candleTime.setSeconds(candleTime.getSeconds() + 14);
        }
      }
    }

    return messages;
  }

  createMatch(templateObj) {
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

  avgTime(t1, t2) {
    let d1 = new Date(t1).getTime();
    let d2 = new Date(t2).getTime();

    let avg = (d1 + d2) / 2;

    return new Date(avg).toISOString();
  }
}

module.exports = ApiSim;
