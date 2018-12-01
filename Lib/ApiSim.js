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
        console.log(data)
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
    createMatch(price, volume, time) {


        // {
        //     "type": "match",
        //     "trade_id": 35233156,
        //     "maker_order_id": "75d1da4b-a79b-43b7-bb21-b10d55d5e147",
        //     "taker_order_id": "6cf683d9-8afe-4ce5-b80e-a2f1e84380bd",
        //     "side": "sell",
        //     "size": "1.43456890",
        //     "price": "33.30000000",
        //     "product_id": "LTC-USD",
        //     "sequence": 3065720894,
        //     "time": "2018-11-29T03:32:10.466000Z"
        //   }
    }
}

module.exports = ApiSim;