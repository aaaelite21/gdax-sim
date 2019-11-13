const orderGenerator = require('../Lib/OrderGenerator');
const assert = require('assert');
const crypto = require('crypto');
const ApiSim = require('../Lib/ApiSim');

const buyParams = {
    price: 25.00,
    size: 0.1,
    product_id: 'LTC-USD',
    side: 'buy'
};

const sellParams = {
    price: 38.00,
    size: 0.1,
    product_id: 'LTC-USD',
    side: 'sell'
};

const marketSellParams = {
    size: 0.1,
    product_id: 'LTC-USD',
    side: 'sell',
    type: 'market'
};

const marKetBuyParamsWithFunds = {
    funds: 200,
    product_id: 'LTC-USD',
    side: 'buy',
    type: 'market'
}

class testSim {
    constructor() {
        this.currentTime = (new Date()).toISOString();
        this.taker_fee = 0.005;
        this.user = {
            cryptoBalance: 2
        }
    }
    make(p, s) {
        return orderGenerator.call(this, p, s);
    }
}
let og = new testSim();

describe("#OrderGenerator", () => {
    it('properly fills out limit buy orders', () => {
        let o = og.make(buyParams);
        assert.deepEqual(o, {
            id: crypto.createHash('sha1').update(JSON.stringify(buyParams)).digest("hex"),
            price: buyParams.price.toString(),
            size: buyParams.size.toString(),
            product_id: buyParams.product_id,
            side: "buy",
            stp: "dc",
            type: "limit",
            time_in_force: "GTC",
            post_only: false,
            created_at: og.currentTime,
            fill_fees: "0.0000000000000000",
            filled_size: "0.00000000",
            executed_value: "0.0000000000000000",
            status: "pending",
            settled: false
        });
    });

    it('properly fills out limit sell orders', () => {
        let o = og.make(sellParams);
        assert.deepEqual(o, {
            id: crypto.createHash('sha1').update(JSON.stringify(sellParams)).digest("hex"),
            price: sellParams.price.toString(),
            size: sellParams.size.toString(),
            product_id: sellParams.product_id,
            side: "sell",
            stp: "dc",
            type: "limit",
            time_in_force: "GTC",
            post_only: false,
            created_at: og.currentTime,
            fill_fees: "0.0000000000000000",
            filled_size: "0.00000000",
            executed_value: "0.0000000000000000",
            status: "pending",
            settled: false
        });
    });

    it('properly fills out market sell orders', () => {
        let o = og.make(marketSellParams);
        assert.deepEqual(o, {
            id: crypto.createHash('sha1').update(JSON.stringify(marketSellParams)).digest("hex"),
            size: sellParams.size.toString(),
            product_id: sellParams.product_id,
            side: "sell",
            stp: "dc",
            type: "market",
            post_only: false,
            created_at: og.currentTime,
            fill_fees: "0.0000000000000000",
            filled_size: "0.00000000",
            executed_value: "0.0000000000000000",
            status: "pending",
            settled: false
        });
    });

    it('properly fills out market buy orders for market orders with funds', () => {
        let o = og.make(marKetBuyParamsWithFunds);
        assert.deepEqual(o, {
            id: crypto.createHash('sha1').update(JSON.stringify(marKetBuyParamsWithFunds)).digest("hex"),
            product_id: sellParams.product_id,
            side: "buy",
            stp: "dc",
            specified_funds: marKetBuyParamsWithFunds.funds.toString(),
            funds: (marKetBuyParamsWithFunds.funds * 0.995).toString(),
            type: "market",
            post_only: false,
            created_at: og.currentTime,
            fill_fees: "0.0000000000000000",
            filled_size: "0.00000000",
            executed_value: "0.0000000000000000",
            status: "pending",
            settled: false
        });
    });
});