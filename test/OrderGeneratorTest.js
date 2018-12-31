const orderGenerator = require('../Lib/OrderGenerator');
const assert = require('assert');
const crypto = require('crypto');

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

describe("#OrderGenerator", () => {
    it('properly fills out limit buy orders', () => {
        let o = orderGenerator(buyParams);
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
            created_at: "2016-12-08T20:02:28.53864Z",
            fill_fees: "0.0000000000000000",
            filled_size: "0.00000000",
            executed_value: "0.0000000000000000",
            status: "pending",
            settled: false
        });
    });

    it('properly fills out limit sell orders', () => {
        let o = orderGenerator(sellParams);
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
            created_at: "2016-12-08T20:02:28.53864Z",
            fill_fees: "0.0000000000000000",
            filled_size: "0.00000000",
            executed_value: "0.0000000000000000",
            status: "pending",
            settled: false
        });
    });

    it('properly fills out market sell orders', () => {
        let o = orderGenerator(marketSellParams);
        assert.deepEqual(o, {
            id: crypto.createHash('sha1').update(JSON.stringify(marketSellParams)).digest("hex"),
            size: sellParams.size.toString(),
            product_id: sellParams.product_id,
            side: "sell",
            stp: "dc",
            type: "market",
            time_in_force: "GTC",
            post_only: false,
            created_at: "2016-12-08T20:02:28.53864Z",
            fill_fees: "0.0000000000000000",
            filled_size: "0.00000000",
            executed_value: "0.0000000000000000",
            status: "pending",
            settled: false
        });
    });
});