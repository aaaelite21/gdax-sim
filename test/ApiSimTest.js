const ApiSim = require('../Lib/ApiSim');
const assert = require('assert');
const crypto = require('crypto');
const testCandleHighToLow = {
    time: "Tue Nov 27 2018 12:20:00 GMT-0500 (Eastern Standard Time)",
    open: 29.35,
    high: 29.41,
    low: 29.3,
    close: 29.3,
    volume: 58.25595405999999
}
const testCandleLowToHigh = {
    time: "Tue Nov 27 2018 03:44:00 GMT-0500 (Eastern Standard Time)",
    open: 29.15,
    high: 29.18,
    low: 29.14,
    close: 29.16,
    volume: 41.767021490000005
}
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
const matchTemplate = {
    side: 'buy',
    price: 32,
    size: 2,
    time: (new Date('Dec 1 2018')).toISOString(),
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
        it('has a current price that starts at 0', () => {
            let Gdax = new ApiSim();
            assert.equal(Gdax.currentPrice, 0);
        });
    });

    describe('#createMatchesFromCandle', () => {
        it('returns a minimum of 4 matches', () => {
            let Gdax = new ApiSim();
            let matches = Gdax.createMatchesFromCandle(testCandleLowToHigh);
            assert.equal(matches.length, 4);
        });
        it('returns high before low if the close <= open', () => {
            let Gdax = new ApiSim();
            let matches = Gdax.createMatchesFromCandle(testCandleHighToLow);
            assert(parseFloat(matches[1].price) >= (parseFloat(matches[2].price)));
        });
        it('returns low before high if the close > open', () => {
            let Gdax = new ApiSim();
            let matches = Gdax.createMatchesFromCandle(testCandleLowToHigh);
            assert(parseFloat(matches[1].price) <= (parseFloat(matches[2].price)));
        });
        it('increases the seconds from each match by 14', () => {
            let Gdax = new ApiSim();
            let matches = Gdax.createMatchesFromCandle(testCandleLowToHigh);
            for (let i = 1; i < matches.length; i++) {
                let date = new Date(matches[i].time);
                let datePrime = new Date(matches[i - 1].time);
                assert.equal(date.getSeconds() - datePrime.getSeconds(), 14);
            }
        });
        it('changes the side to \'sell\' if the price is going down from the last match', () => {
            let Gdax = new ApiSim();
            let matches = Gdax.createMatchesFromCandle(testCandleLowToHigh);
        });
        it('changes the side to \'buy\' if the price is going up from the last match', () => {
            let Gdax = new ApiSim();
            let matches = Gdax.createMatchesFromCandle(testCandleLowToHigh);
        });
    });

    describe('#createMatch', () => {
        it('returns a match with the specafied paramaeters', () => {
            let Gdax = new ApiSim();
            let match = Gdax.createMatch(matchTemplate);
            assert.equal(match.side, matchTemplate.side);
            assert.equal(match.size, matchTemplate.size.toString());
            assert.equal(match.price, matchTemplate.price.toString());
            assert.equal(match.time, matchTemplate.time);
            assert.equal(match.product_id, matchTemplate.product_id);
        });
        it('returns a that generates unspecafied parameters', () => {
            let Gdax = new ApiSim();
            let match = Gdax.createMatch(matchTemplate);
            assert(match.type === 'match');
            assert(typeof match.trade_id === 'number');
            assert(typeof match.sequence === 'number');
            assert(typeof match.maker_order_id === 'string');
            assert(typeof match.taker_order_id === 'string');
        });
        it('returns the desired maker order id if specafied', () => {
            let Gdax = new ApiSim();
            let x = JSON.parse(JSON.stringify(matchTemplate))
            x.maker_order_id = "abc123";
            let match = Gdax.createMatch(x);
            assert.equal(match.maker_order_id, "abc123");
        });
        it('returns the desired taker order id if specafied', () => {
            let Gdax = new ApiSim();
            let x = JSON.parse(JSON.stringify(matchTemplate))
            x.taker_order_id = "abc123";
            let match = Gdax.createMatch(x);
            assert.equal(match.taker_order_id, "abc123");
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