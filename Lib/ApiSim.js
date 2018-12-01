const WebocketSim = require('./WebsocketSim');

class ApiSim {
    constructor(candles) {
        this.userLimitOrders = [];
        //this.WebsocketClient = WebsocketSim;
    }



    buy(buyParams, callback) {

    }
    sell(sellParams, callback) {

    }
    cancelOrder(orderId, callback) {

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