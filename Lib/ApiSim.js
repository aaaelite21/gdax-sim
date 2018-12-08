const WebocketSim = require('./WebsocketSim');
const UserSim = require('./UserAccountSim');
const crypto = require('crypto');
class ApiSim {
    constructor(fb, cb) {
        this.user = new UserSim();
        this.user.cryptoBalance = isNaN(cb) ? 100 : cb;
        this.user.fiatBalance = isNaN(fb) ? 100 : fb;
        this.websocketClient = new WebocketSim();
        this.currentPrice = 0;

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
        let buyIndex = this.user.openBuys.map((e) => {
            return e.id;
        }).indexOf(orderId);

        let sellIndex = this.user.openSells.map((e) => {
            return e.id;
        }).indexOf(orderId);

        if (buyIndex === -1 && sellIndex === -1) {
            data = {
                message: 'no order by that id'
            };
        } else {
            if (buyIndex !== -1) {
                order = this.user.openBuys.splice(buyIndex, 1)[0];
                this.user.fiatBalance += parseFloat(order.size) * parseFloat(order.price);
            } else if (sellIndex !== -1) {
                order = this.user.openSells.splice(sellIndex, 1)[0];
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
            this.websocketClient.disbatch('message', m);
            if (messages.length > 1) {
                nextPrice = parseFloat(mPrime.price);
                nextTime = mPrime.time;
                if (nextPrice < this.currentPrice) {
                    //buy order check
                    let buysToComplete = this.user.openBuys.map((e) => {
                        let orderPrice = parseFloat(e.price);
                        return orderPrice > nextPrice && orderPrice <= this.currentPrice;
                    });
                    for (let b = 0; b < buysToComplete.length; b++) {
                        if (buysToComplete[b]) {
                            let newmsg = this.fillOrder(this.user.openBuys[b].id, null, this.avgTime(currentTime, nextTime));
                            for (let i = newmsg.length - 1; i >= 0; i--) {
                                messages.push(newmsg[i])
                            }
                        }
                    }
                } else if (nextPrice > this.currentPrice) {
                    //sellOrderCheck
                    let sellsToComplete = this.user.openSells.map((e) => {
                        let orderPrice = parseFloat(e.price);
                        return orderPrice < nextPrice && orderPrice >= this.currentPrice;
                    });
                    for (let s = 0; s < sellsToComplete.length; s++) {
                        if (sellsToComplete[s]) {
                            let newmsg = this.fillOrder(this.user.openSells[s].id, null, this.avgTime(currentTime, nextTime));
                            for (let i = newmsg.length - 1; i >= 0; i--) {
                                messages.push(newmsg[i])
                            }
                        }
                    }
                }
            }
        }
    }

    fillOrder(orderId, size, time) {
        let order;
        let orderCompleted = false;
        let side;
        let messages = [];
        let buyIndex = this.user.openBuys.map((e) => {
            return e.id;
        }).indexOf(orderId);
        let sellIndex = this.user.openSells.map((e) => {
            return e.id;
        }).indexOf(orderId);

        if (buyIndex !== -1 || sellIndex !== -1) {
            if (buyIndex !== -1) {
                order = this.user.openBuys.splice(buyIndex, 1)[0];
                this.user.cryptoBalance += parseFloat(order.size);
                side = 'buy';
            } else if (sellIndex !== -1) {
                order = this.user.openSells.splice(sellIndex, 1)[0];
                this.user.fiatBalance += parseFloat(order.size) * parseFloat(order.price);
                side = 'sell';
            }

            messages.push(this.createMatch({
                side: side,
                maker_order_id: order.id,
                size: order.size,
                price: order.price,
                product_id: order.product_id
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
        }

        return messages;
    }

    createOrder(orderParams, callback) {
        let data;
        let order = {}
        let orderPrice = parseFloat(orderParams.price);
        let orderSize = parseFloat(orderParams.size);

        if ((orderParams.side === 'buy' && orderPrice > this.currentPrice) ||
            (orderParams.side === 'sell' && orderPrice < this.currentPrice) ||
            (orderParams.side === 'buy' && orderPrice * orderSize > this.user.fiatBalance) ||
            (orderParams.side === 'sell' && orderSize > this.user.cryptoBalance)) {
            data = {
                status: 'rejected'
            }

        } else {
            //user defined perams
            order.price = orderParams.price.toString();
            order.post_only = false;
            order.product_id = orderParams.product_id;
            order.size = orderParams.size.toString();
            order.type = "limit";
            order.stp = "dc";


            //Gdax defined peramns
            order.id = crypto.createHash('sha1').update(JSON.stringify(orderParams)).digest("hex");
            order.side = orderParams.side;
            order.time_in_force = "GTC";
            order.filled_size = "0.00000000";
            order.executed_value = "0.0000000000000000";
            order.status = "pending";
            order.settled = false;
            order.fill_fees = "0.0000000000000000";
            order.created_at = "2016-12-08T20:02:28.53864Z";
            //save order
            if (orderParams.side === "buy") {
                this.user.openBuys.push(order);
                this.user.fiatBalance -= orderPrice * orderSize;
            } else {
                this.user.openSells.push(order);
                this.user.cryptoBalance -= orderSize;
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