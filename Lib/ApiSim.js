const WebocketSim = require('./WebsocketSim');
const UserSim = require('./UserAccountSim');
const orderGenerator = require('./OrderGenerator');
const crypto = require('crypto');
const HistoricRates = require('./HistoricRates');

class ApiSim {
    constructor(fb, cb) {
        this.user = new UserSim();
        this.user.cryptoBalance = isNaN(cb) ? 100 : cb;
        this.user.fiatBalance = isNaN(fb) ? 100 : fb;
        this.websocketClient = new WebocketSim();
        this.currentPrice = 0;
        this.historics = {
            m1: [],
            m5: [],
            m15: [],
            h1: [],
            h6: [],
            d1: []
        }

    }

    getProductHistoricRates(product, params, callback) {
        HistoricRates.getProduct.call(this, product, params, callback)
    }

    logHistoricData(message) {
        HistoricRates.processMatch.call(this, message);
    }

    handleMatch(match) {
        HistoricRates.handleMatch.call(this, match);
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
        let buyIndex = this.user.limitOrders.openBuys.map((e) => {
            return e.id;
        }).indexOf(orderId);

        let sellIndex = this.user.limitOrders.openSells.map((e) => {
            return e.id;
        }).indexOf(orderId);

        if (buyIndex === -1 && sellIndex === -1) {
            data = {
                message: 'no order by that id'
            };
        } else {
            if (buyIndex !== -1) {
                order = this.user.limitOrders.openBuys.splice(buyIndex, 1)[0];
                this.user.fiatBalance += parseFloat(order.size) * parseFloat(order.price);
            } else if (sellIndex !== -1) {
                order = this.user.limitOrders.openSells.splice(sellIndex, 1)[0];
                this.user.cryptoBalance += parseFloat(order.size);
            }
            data = order.id;
        }
        if (typeof callback === 'function') {
            callback(null, null, data);
        }
    }

    //Below are supporting functions
    backtest(candleData) {
        let messages = this.createMatchesFromCandle(candleData);
        messages.reverse();
        let nextPrice, currentTime, nextTime;
        while (messages.length > 0) {
            let m = messages.pop();
            let mPrime = messages[messages.length - 1];
            this.currentPrice = parseFloat(m.price);
            currentTime = m.time;
            //market sell orders
            while (this.user.marketOrders.openSells.length > 0) {
                let moid = this.user.marketOrders.openSells[0].id;
                let newmsg = this.fillOrder(moid, null, currentTime);
                for (let i = newmsg.length - 1; i >= 0; i--) {
                    messages.push(newmsg[i])
                }
            }
            //market buy orders
            while (this.user.marketOrders.openBuys.length > 0) {
                let moid = this.user.marketOrders.openBuys[0].id;
                let newmsg = this.fillOrder(moid, null, currentTime);
                for (let i = newmsg.length - 1; i >= 0; i--) {
                    messages.push(newmsg[i])
                }
            }
            //limit orders below
            if (messages.length > 1) {
                nextPrice = parseFloat(mPrime.price);
                nextTime = mPrime.time;
                if (nextPrice < this.currentPrice) {
                    //buy order check
                    let buysToComplete = this.user.limitOrders.openBuys.map((e) => {
                        let orderPrice = parseFloat(e.price);
                        return orderPrice > nextPrice && orderPrice <= this.currentPrice;
                    });
                    for (let b = 0; b < buysToComplete.length; b++) {
                        if (buysToComplete[b]) {
                            let newmsg = this.fillOrder(this.user.limitOrders.openBuys[b].id, null, this.avgTime(currentTime, nextTime));
                            for (let i = newmsg.length - 1; i >= 0; i--) {
                                messages.push(newmsg[i])
                            }
                        }
                    }
                } else if (nextPrice > this.currentPrice) {
                    //sellOrderCheck
                    let sellsToComplete = this.user.limitOrders.openSells.map((e) => {
                        let orderPrice = parseFloat(e.price);
                        return orderPrice < nextPrice && orderPrice >= this.currentPrice;
                    });
                    for (let s = 0; s < sellsToComplete.length; s++) {
                        if (sellsToComplete[s]) {
                            let newmsg = this.fillOrder(this.user.limitOrders.openSells[s].id, null, this.avgTime(currentTime, nextTime));
                            for (let i = newmsg.length - 1; i >= 0; i--) {
                                messages.push(newmsg[i])
                            }
                        }
                    }
                }
            }
            //disbatch the message as the final thing
            this.logHistoricData(m);
            this.websocketClient.disbatch('message', m);
        }
        if (typeof this.afterSession === 'function') {
            this.afterSession();
        }
    }

    fillOrder(orderId, size, time) {
        let order;
        let messages = [];
        let limitBuyIndex = this.user.limitOrders.openBuys.map((e) => {
            return e.id;
        }).indexOf(orderId);
        let limitSellIndex = this.user.limitOrders.openSells.map((e) => {
            return e.id;
        }).indexOf(orderId);
        let marketSellIndex = this.user.marketOrders.openSells.map((e) => {
            return e.id;
        }).indexOf(orderId);
        let marketBuyIndex = this.user.marketOrders.openBuys.map((e) => {
            return e.id;
        }).indexOf(orderId);

        if (limitBuyIndex !== -1 || limitSellIndex !== -1) {
            if (limitBuyIndex !== -1) {
                order = this.user.limitOrders.openBuys.splice(limitBuyIndex, 1)[0];
                this.user.cryptoBalance += parseFloat(order.size);
            } else if (limitSellIndex !== -1) {
                order = this.user.limitOrders.openSells.splice(limitSellIndex, 1)[0];
                this.user.fiatBalance += parseFloat(order.size) * parseFloat(order.price);
            }

            messages.push(this.createMatch({
                side: order.side,
                maker_order_id: order.id,
                size: order.size,
                price: order.price,
                product_id: order.product_id,
                time: time
            }));

            messages.push({
                type: "done",
                side: order.side,
                order_id: orderId,
                reason: "filled",
                product_id: order.product_id,
                price: order.price.toString(),
                remaining_size: "0.00000000",
                sequence: Math.round(100000000 * Math.random()),
                time: time
            });
        } else if (marketSellIndex !== -1) {
            order = this.user.marketOrders.openSells.splice(marketSellIndex, 1)[0];
            this.user.fiatBalance += (parseFloat(order.size) * parseFloat(this.currentPrice)) * 0.997;
            messages.push(this.createMatch({
                side: order.side,
                taker_order_id: order.id,
                size: order.size,
                price: this.currentPrice,
                product_id: order.product_id,
                time: time
            }));
            messages.push({
                type: "done",
                side: order.side,
                order_id: order.id,
                reason: "filled",
                product_id: order.product_id,
                price: this.price,
                remaining_size: "0.00000000",
                sequence: Math.round(100000000 * Math.random()),
                time: time
            });
        } else if (marketBuyIndex !== -1) {
            order = this.user.marketOrders.openBuys.splice(marketBuyIndex, 1)[0];
            this.user.cryptoBalance += parseFloat(order.size) / parseFloat(this.currentPrice);
            this.user.fiatBalance -= parseFloat(order.size) * 0.003;

            messages.push(this.createMatch({
                side: order.side,
                taker_order_id: order.id,
                size: order.size,
                price: this.currentPrice,
                product_id: order.product_id,
                time: time
            }));
            messages.push({
                type: "done",
                side: order.side,
                order_id: order.id,
                reason: "filled",
                product_id: order.product_id,
                price: this.price,
                remaining_size: "0.00000000",
                sequence: Math.round(100000000 * Math.random()),
                time: time
            });
        }

        return messages;
    }

    createOrder(orderPerams, callback) {
        let data;
        let orderPrice = parseFloat(orderPerams.price);
        let orderSize = parseFloat(orderPerams.size);
        let order = {};
        if (orderPerams.type !== 'market' &&
            ((orderPerams.side === 'buy' && orderPrice > this.currentPrice) ||
                (orderPerams.side === 'sell' && orderPrice < this.currentPrice) ||
                (orderPerams.side === 'buy' && orderPrice * orderSize > this.user.fiatBalance)) ||
            (orderPerams.side === 'sell' && orderSize > this.user.cryptoBalance)) {

            data = {
                status: 'rejected'
            }

        } else {
            order = orderGenerator(orderPerams);
            //save order
            if (order.type === 'limit') {
                if (order.side === "buy") {
                    this.user.limitOrders.openBuys.push(order);
                    this.user.fiatBalance -= orderPrice * orderSize;
                } else {
                    this.user.limitOrders.openSells.push(order);
                    this.user.cryptoBalance -= orderSize;
                }
            } else if (order.type === 'market') {
                if (order.side === "buy") {
                    this.user.fiatBalance -= orderSize;
                    order.funds = this.user.fiatBalance.toString();
                    this.user.marketOrders.openBuys.push(order);
                } else {
                    this.user.cryptoBalance -= orderSize;
                    order.funds = this.user.cryptoBalance.toString();
                    this.user.marketOrders.openSells.push(order);
                }
            }

            //set data to order for callback
            data = order;
        }


        if (typeof callback === 'function') {
            callback(null, null, data)
        }
    }

    createMatchesFromCandle(candlesArrayOrObj, count) {
        let matches = [];
        let candles = candlesArrayOrObj.length === undefined ? [candlesArrayOrObj] : candlesArrayOrObj;
        let candleCount = count === undefined ? candles.length : count;
        for (let c = 0; c < candleCount; c++) {
            let candle = candles[c];
            let startTime = new Date(candle.time);

            for (let i = 0; i < 4; i++) {
                let key;
                switch (i) {
                    case 0:
                        key = 'open';
                        break;
                    case 1:
                        if (candle.close < candle.open) {
                            key = 'high';
                        } else {
                            key = 'low';
                        }
                        break;
                    case 2:
                        if (candle.close < candle.open) {
                            key = 'low';
                        } else {
                            key = 'high';
                        }
                        break;
                    case 3:
                        key = 'close';
                        break;
                }

                let side = Math.random() > 0.5 ? 'buy' : 'sell';

                if (matches.length > 0) {
                    let lastPrice = parseFloat(matches[matches.length - 1].price);
                    if (candle[key] > lastPrice) {
                        side = 'buy';
                    } else if (candle[key] < lastPrice) {
                        side = 'sell'
                    }
                }

                matches.push(this.createMatch({
                    side: side,
                    size: candle.volume / 4,
                    time: startTime.toISOString(),
                    product_id: 'LTC-USD',
                    price: candle[key]
                }));

                startTime.setSeconds(startTime.getSeconds() + 14)
            }
        }


        return matches;
    }

    createMatch(templateObj) {

        return {
            type: 'match',
            side: templateObj.side,
            size: templateObj.size.toString(),
            price: templateObj.price.toString(),
            time: templateObj.time,
            product_id: templateObj.product_id,
            trade_id: Math.round(100000000 * Math.random()),
            sequence: Math.round(100000000 * Math.random()),
            taker_order_id: templateObj.taker_order_id !== undefined ? templateObj.taker_order_id : crypto.createHash('sha1').update(JSON.stringify(Math.random().toString())).digest("hex"),
            maker_order_id: templateObj.maker_order_id !== undefined ? templateObj.maker_order_id : crypto.createHash('sha1').update(JSON.stringify(Math.random().toString())).digest("hex")
        }
    }

    avgTime(t1, t2) {
        let d1 = (new Date(t1)).getTime();
        let d2 = (new Date(t2)).getTime();

        let avg = (d1 + d2) / 2;

        return (new Date(avg)).toISOString();
    }
}

module.exports = ApiSim;