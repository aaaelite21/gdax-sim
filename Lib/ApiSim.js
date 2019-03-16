const WebocketSim = require('./WebsocketSim');
const UserSim = require('./UserAccountSim');
const orderGenerator = require('./OrderGenerator');
const crypto = require('crypto');
const HistoricRates = require('./HistoricRates');
const Heartbeat = require('./Heartbeat');
const GetOrder = require('./Getorder')

class ApiSim {
    constructor(fb, cb) {
        this.user = new UserSim();
        this.user.cryptoBalance = isNaN(cb) ? 100 : cb;
        this.user.fiatBalance = isNaN(fb) ? 100 : fb;
        this.websocketClient = new WebocketSim();
        this.currentPrice = 0;
        this.pair = 'ETH-BTC';
        this.historics = {
            m1: [],
            m5: [],
            m15: [],
            h1: [],
            h6: [],
            d1: []
        }

    }
    afterSession() {}

    createHeartbeat(pair, time) {
        return Heartbeat.create.call(this, pair, time);
    }

    getOrder(orderId, callback) {
        GetOrder.call(this, orderId, callback)
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
            if (m.price !== undefined) {
                this.currentPrice = parseFloat(m.price);
            }
            currentTime = m.time;
            //market orders
            if (this.user.orders.length >= 1) {
                let subArray = [];
                this.user.orders.forEach((o) => {
                    if (o.status === 'pending') {
                        subArray.push(o.id);
                    }
                });
                for (let i = 0; i < subArray.length; i++) {
                    let moid = subArray[i];
                    let newmsg = this.fillOrder(moid, null, currentTime);
                    for (let i = newmsg.length - 1; i >= 0; i--) {
                        messages.push(newmsg[i])
                    }
                }
            }

            //limit orders below
            if (messages.length > 1) {
                let newmsg = [];
                let primeIndex = messages.length - 1;
                let mPrime = messages[primeIndex];
                if (mPrime.type === 'match') {
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
                                newmsg = this.fillOrder(this.user.limitOrders.openBuys[b].id, null, this.avgTime(currentTime, nextTime));
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
                                newmsg = this.fillOrder(this.user.limitOrders.openSells[s].id, null, this.avgTime(currentTime, nextTime));
                            }
                        }
                    }

                    for (let i = newmsg.length - 1; i >= 0; i--) {
                        messages.push(newmsg[i])
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
        let orderIndex = this.user.orders.map((e) => {
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
        } else if (orderIndex !== -1) {
            order = this.user.orders[orderIndex];
            if (order.side === 'buy') {
                this.user.cryptoBalance += parseFloat(order.size);
                this.user.fiatBalance -= parseFloat(order.size) * this.currentPrice * 1.003;
            } else if (order.side === 'sell') {
                this.user.fiatBalance += parseFloat(order.size) * this.currentPrice * 0.997;
            }
            this.user.orders[orderIndex].status = 'filled';
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
        let data = {
            status: 'rejected'
        };
        let orderPrice = parseFloat(orderPerams.price);
        let orderSize = parseFloat(orderPerams.size);
        let orderFunds = parseFloat(orderPerams.funds);
        let order = orderGenerator(orderPerams);
        if (!(order.type === 'limit' && order.side === 'buy' && parseFloat(order.price) >= this.currentPrice) &&
            !(order.type === 'limit' && order.side === 'buy' && parseFloat(order.price) * parseFloat(order.size) > this.user.fiatBalance) &&
            !(order.type === 'limit' && order.side === 'sell' && parseFloat(order.price) <= this.currentPrice) &&
            !(order.type === 'market' && order.side === 'buy' && this.currentPrice * parseFloat(order.size) * 1.003 > this.user.fiatBalance) &&
            !(order.type === 'market' && order.side === 'buy' && orderFunds > this.user.fiatBalance) &&
            !(order.type === 'market' && order.side === 'sell' && orderFunds > this.user.cryptoBalance * this.currentPrice) &&
            !(order.side === 'sell' && parseFloat(order.size) > this.user.cryptoBalance) &&
            !(order.side === 'buy' && parseFloat(order.funds) > this.user.fiatBalance)) {

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
                    if (!isNaN(orderFunds)) {
                        order.size = (orderFunds * 0.997 / this.currentPrice).toString()
                    }
                    order.funds = this.user.fiatBalance.toString();
                    this.user.orders.push(order);
                } else {
                    if (!isNaN(orderFunds)) {
                        orderSize = (orderFunds / this.currentPrice)
                        order.size = orderSize.toString();
                    }
                    this.user.cryptoBalance -= orderSize;
                    order.funds = this.user.cryptoBalance.toString();
                    this.user.orders.push(order);
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
        let messages = [];
        let candles = candlesArrayOrObj.length === undefined ? [candlesArrayOrObj] : candlesArrayOrObj;
        let candleCount = count === undefined ? candles.length : count;
        let lastTime = null;
        for (let c = 0; c < candleCount; c++) {
            let candle = candles[c];
            let startTime = new Date(candle.time);

            if (lastTime !== null) {
                while (lastTime + 60000 < startTime.getTime()) {
                    lastTime += 60000;
                    messages.push(this.createHeartbeat(this.pair, lastTime))
                }
            }

            lastTime = startTime.getTime();

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

                //ToDo: base side off of the direction of price movemnet
                let side = Math.random() > 0.5 ? 'buy' : 'sell';

                if (messages.length > 0) {
                    let lastPrice = parseFloat(messages[messages.length - 1].price);
                    if (candle[key] > lastPrice) {
                        side = 'buy';
                    } else if (candle[key] < lastPrice) {
                        side = 'sell'
                    }
                }

                messages.push(this.createMatch({
                    side: side,
                    size: candle.volume / 4,
                    time: startTime.toISOString(),
                    product_id: this.product_id,
                    price: candle[key]
                }));

                startTime.setSeconds(startTime.getSeconds() + 14)
            }
        }


        return messages;
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