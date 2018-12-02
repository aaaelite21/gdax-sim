const WebocketSim = require('./WebsocketSim');
const crypto = require('crypto');
class ApiSim {
    constructor(candles) {
        this.userLimitOrders = {
            sells: [],
            buys: []
        };
        this.currentPrice = 0;
        //this.WebsocketClient = WebsocketSim;
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
        let buyIndex = this.userLimitOrders.buys.map((e) => {
            return e.id;
        }).indexOf(orderId);

        let sellIndex = this.userLimitOrders.sells.map((e) => {
            return e.id;
        }).indexOf(orderId);

        if (buyIndex === -1 && sellIndex === -1) {
            data = {
                message: 'no order by that id'
            };
        } else if (buyIndex !== -1) {
            data = this.userLimitOrders.buys.splice(buyIndex, 1)[0].id;
        } else if (sellIndex !== -1) {
            data = this.userLimitOrders.sells.splice(sellIndex, 1)[0].id;
        }
        if (typeof callback === 'function') {
            callback(null, null, data);
        }
    }

    createOrder(orderParams, callback) {
        let data;
        let order = {}
        let orderPrice = parseFloat(orderParams.price);

        if ((orderParams.side === 'buy' && orderPrice > this.currentPrice) ||
            (orderParams.side === 'sell' && orderPrice < this.currentPrice)) {
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
                this.userLimitOrders.buys.push(order);
            } else {
                this.userLimitOrders.sells.push(order);
            }
            //set data to order for callback
            data = order;
        }


        if (typeof callback === 'function') {
            callback(null, null, data)
        }
    }


    //Below are supporting functions
    createMatchesFromCandle(candle) {
        let matches = [];
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
            matches.push(this.createMatch({
                side: 'buy',
                size: candle.volume / 4,
                time: startTime.toISOString(),
                product_id: 'LTC-USD',
                price: candle[key]
            }));

            startTime.setSeconds(startTime.getSeconds() + 14)
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
}

module.exports = ApiSim;