const ApiSim = require('../Lib/ApiSim');
const assert = require('assert');
const crypto = require('crypto');
const buyParams = {
    price: 25.00,
    size: 0.1,
    product_id: 'LTC-USD'
};
const sellParams = {
    price: 38.00,
    size: 0.1,
    product_id: 'LTC-USD'
};
describe('#ApiSim', () => {
    describe('#init', () => {
        it('has an array of user limit orders', () => {
            let Gdax = new ApiSim();
            assert.deepEqual(Gdax.userLimitOrders, {
                sells: [],
                buys: []
            });
        });
    });

    describe("#cancleOrder", () => {
        it('runs the callback', (done) => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.buy(buyParams, (err, res, data) => {
                Gdax.cancelOrder(data.id, done)
            });
        });
        it('returns the order id in the \'data\' attribute of the callback if successful', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            let orderId;
            Gdax.buy(buyParams, (err, res, d) => {
                orderId = d.id;
                Gdax.cancelOrder(orderId, (err, res, data) => {
                    assert.equal(data, orderId);
                });
            })
        });
        it('removes the order from limit buy order array', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.buy(buyParams, (err, res, d) => {
                assert.equal(Gdax.userLimitOrders.buys.length, 1);
                Gdax.cancelOrder(d.id, (err, res, data) => {
                    assert.equal(Gdax.userLimitOrders.buys.length, 0);
                });
            });
        });
        it('removes the order from limit sell order array', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.sell(sellParams, (err, res, d) => {
                assert.equal(Gdax.userLimitOrders.sells.length, 1);
                Gdax.cancelOrder(d.id, (err, res, data) => {
                    assert.equal(Gdax.userLimitOrders.sells.length, 0);
                });
            });
        });
    });

    describe('#buy', () => {
        it('saves the limit order to the userLimitOrders.buys array ', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.buy(buyParams);
            assert.deepEqual(Gdax.userLimitOrders.buys[0], {
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
        it('runs the callback after', (done) => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.buy(buyParams, done);
        });
        it('returns the order in the \'data\' attribute of the callback', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.buy(buyParams, function (err, res, data) {
                assert.deepEqual(data, {
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
        });
        it('rejects the order if the price is above the current price', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 12;
            Gdax.buy(buyParams, (err, res, data) => {
                assert.equal(data.status, "rejected");
            });
        })
    });
    describe('#sell', () => {
        it('saves the limit order to the userLimitOrders.sells array ', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.sell(sellParams);
            assert.deepEqual(Gdax.userLimitOrders.sells[0], {
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
        it('runs the callback after', (done) => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.sell(sellParams, done);
        });
        it('returns the order in the \'data\' attribute of the callback', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.sell(sellParams, function (err, res, data) {
                assert.deepEqual(data, {
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
        });
        it('rejects the order if the price is above the current price', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 40;
            Gdax.sell(sellParams, (err, res, data) => {
                assert.equal(data.status, "rejected");
            });
        })
    });
});