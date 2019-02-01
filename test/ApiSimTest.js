const ApiSim = require('../Lib/ApiSim');
const WebsocketSim = require('../Lib/WebsocketSim');
const UserSim = require('../Lib/UserAccountSim');

const assert = require('assert');
const crypto = require('crypto');
//const TestDay = require('../TestData/27Nov2018LTCUSD.json');
const testCandleHighToLow = {
    time: "Tue Nov 27 2018 03:44:00 GMT-0500 (Eastern Standard Time)",
    open: 29.35,
    high: 29.41,
    low: 29.28,
    close: 29.3,
    volume: 58.25595405999999
}
const testCandleLowToHigh = {
    time: "Tue Nov 27 2018 03:45:00 GMT-0500 (Eastern Standard Time)",
    open: 29.25,
    high: 29.38,
    low: 29.24,
    close: 29.26,
    volume: 41.767021490000005
}
const twoCandleArray = [
    testCandleHighToLow,
    testCandleLowToHigh
]
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
        it('has a user account sim', () => {
            let Gdax = new ApiSim();
            assert(Gdax.user instanceof UserSim);
        });
        it('has a current price that starts at 0', () => {
            let Gdax = new ApiSim();
            assert.equal(Gdax.currentPrice, 0);
        });
        it('has a websocketsim', () => {
            let Gdax = new ApiSim();
            assert(Gdax.websocketClient instanceof WebsocketSim);
        });
        it('has a usersim', () => {
            let Gdax = new ApiSim();
            assert(Gdax.user instanceof UserSim);
        });
    });

    describe('#fillOrder', () => {
        let time = "2018-12-06T01:46:01.162000Z";
        it('adds the size of a buy order to the crypto account if 100% filled', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            let target = Gdax.user.cryptoBalance + buyParams.size;
            Gdax.buy(buyParams, (err, res, data) => {
                Gdax.fillOrder(data.id, data.size, time);
                assert.equal(Gdax.user.cryptoBalance, target);
            });
        });
        it('adds the size * price of a sell order to the fiat account if 100% filled', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            let target = Gdax.user.fiatBalance + (sellParams.size * sellParams.price);
            Gdax.sell(sellParams, (err, res, data) => {
                Gdax.fillOrder(data.id, data.size, time);
                assert.equal(Gdax.user.fiatBalance, target);
            });
        });
        it('returns an array of messages to disbatch', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.buy(buyParams, (err, res, data) => {
                let ret = Gdax.fillOrder(data.id, data.size, time);
                assert.equal(ret.length, 2);
            });
        });
        it('returns the match first', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.buy(buyParams, (err, res, data) => {
                let ret = Gdax.fillOrder(data.id, data.size, time);
                assert.equal(ret[0].type, 'match');
            });
        });
        it('returns the \'done\' last', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.buy(buyParams, (err, res, data) => {
                let ret = Gdax.fillOrder(data.id, data.size, time);
                assert.equal(ret[ret.length - 1].type, 'done');
            });
        });
        it('the returned \'done\' has the proper data', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.buy(buyParams, (err, res, data) => {
                let ret = Gdax.fillOrder(data.id, data.size, time);
                let done = ret[ret.length - 1];
                assert.equal(done.order_id, data.id);
                assert.equal(done.price, data.price);
                assert.equal(done.side, data.side);
            });
        });
        /*it('fill message is only done if the order\'s volume is completle satisfied', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;

        });*/
    });

    describe('#backtest', () => {
        it("runs the afterSessionFunction", (done) => {
            let Gdax = new ApiSim();
            Gdax.afterSession = done;
            Gdax.backtest(twoCandleArray);
        });
        describe('completing orders', () => {
            it('completes a buy order when the price crosses down through that price between matches', () => {
                let count = 0;
                let Gdax = new ApiSim();
                Gdax.currentPrice = 29.40;
                Gdax.buy({
                    price: 29.26,
                    size: 0.1,
                    product_id: 'LTC-USD'
                });
                Gdax.websocketClient.on('message', (message) => {
                    if (count === 4) {
                        assert.equal(Gdax.user.limitOrders.openBuys.length, 0);
                    }
                    count++;
                });
                Gdax.backtest(twoCandleArray);
            });
            it('completes a sell order when the price crosses up through that price between matches', () => {
                let count = 0;
                let Gdax = new ApiSim();

                function placeOrder() {
                    Gdax.sell({
                        price: 29.30,
                        size: 0.1,
                        product_id: 'LTC-USD'
                    });
                }

                Gdax.websocketClient.on('message', (message) => {
                    if (count === 2) {
                        placeOrder();
                        assert.equal(Gdax.user.limitOrders.openSells.length, 1);
                    }
                    if (count === 6) {
                        assert.equal(Gdax.user.limitOrders.openSells.length, 0);
                    }
                    count++;
                });
                Gdax.backtest(twoCandleArray);
            });
            it('buy: disbatches a \'match\' that includes the order\'s specific details', () => {
                let Gdax = new ApiSim();
                Gdax.currentPrice = 29.40;
                let count = 0;
                let order;
                Gdax.buy({
                    price: 29.26,
                    size: 0.1,
                    product_id: 'LTC-USD'
                }, (err, res, data) => {
                    order = data;
                });
                Gdax.websocketClient.on('message', (message) => {
                    if (count === 4) {
                        assert.equal(message.maker_order_id, order.id);
                    }
                    count++;
                });
                Gdax.backtest(twoCandleArray);
            });
            it('buy: disbatches a \'type = done reason = filled\' that includes the order\'s id', () => {
                let Gdax = new ApiSim();
                Gdax.currentPrice = 29.40;
                let count = 0;
                let order;
                Gdax.buy({
                    price: 29.26,
                    size: 0.1,
                    product_id: 'LTC-USD'
                }, (err, res, data) => {
                    order = data;
                });
                Gdax.websocketClient.on('message', (message) => {
                    if (count === 5) {
                        assert.equal(message.type, 'done');
                        assert.equal(message.order_id, order.id);
                    }
                    count++;
                });
                Gdax.backtest(twoCandleArray);
            });
            it('sell: disbatches a \'match\' that includes the order\'s specific details', () => {
                let Gdax = new ApiSim();
                let count = 0;
                let order;

                function placeOrder() {
                    Gdax.sell({
                        price: 29.30,
                        size: 0.1,
                        product_id: 'LTC-USD'
                    }, (err, res, data) => {
                        order = data;
                    });
                }
                Gdax.websocketClient.on('message', (message) => {
                    if (count === 2) {
                        placeOrder();
                    }
                    if (count === 6) {
                        assert.equal(message.maker_order_id, order.id);
                    }
                    count++;
                });
                Gdax.backtest(twoCandleArray);
            });
            it('sell: disbatches a \'type = fill reason = done\' that includes the order\'s id', () => {
                let Gdax = new ApiSim();
                let count = 0;
                let order;

                function placeOrder() {
                    Gdax.sell({
                        price: 29.30,
                        size: 0.1,
                        product_id: 'LTC-USD'
                    }, (err, res, data) => {
                        order = data;
                    });
                }
                Gdax.websocketClient.on('message', (message) => {
                    if (count === 2) {
                        placeOrder();
                    }
                    if (count === 7) {
                        assert.equal(message.type, 'done');
                        assert.equal(message.order_id, order.id);
                    }
                    count++;
                });
                Gdax.backtest(twoCandleArray);
            });
        });
        it('disbatches all matches to the websocket in time order', () => {
            let Gdax = new ApiSim();
            let count = 0;
            Gdax.websocketClient.on('message', () => {
                count++;
            });
            Gdax.backtest(twoCandleArray);
            assert.equal(count, 8);
        });
        it('disbatches all matches to the websocket from oldest to most recent', () => {
            let Gdax = new ApiSim();
            let lastTime = null;
            Gdax.websocketClient.on('message', (data) => {
                if (lastTime === null) {
                    lastTime = (new Date(data.time)).getTime();
                } else {
                    let now = (new Date(data.time)).getTime();
                    assert(now > lastTime);
                    lastTime = now;
                }
            });
            Gdax.backtest(twoCandleArray);
        });
        it('disbatches all matches to the websocket from oldest to most recent', () => {
            let Gdax = new ApiSim();
            let lastTime = null;
            Gdax.websocketClient.on('message', (data) => {
                if (lastTime === null) {
                    lastTime = (new Date(data.time)).getTime();
                } else {
                    let now = (new Date(data.time)).getTime();
                    assert(now > lastTime);
                    lastTime = now;
                }
            });
            Gdax.backtest(twoCandleArray);
        });
        it('sets the current price to that of the most recent match', () => {
            let Gdax = new ApiSim();
            Gdax.websocketClient.on('message', (data) => {
                assert.equal(Gdax.currentPrice, parseFloat(data.price));
            });
            Gdax.backtest(twoCandleArray);
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
            let matches = Gdax.createMatchesFromCandle(testCandleHighToLow);
            assert.equal(matches[2].side, 'sell');
        });
        it('changes the side to \'buy\' if the price is going up from the last match', () => {
            let Gdax = new ApiSim();
            let matches = Gdax.createMatchesFromCandle(testCandleHighToLow);
            assert.equal(matches[1].side, 'buy');
            assert.equal(matches[3].side, 'buy');
        });
        it('can take an array of candles and generate matches based off of them', () => {
            let Gdax = new ApiSim();
            let matches = Gdax.createMatchesFromCandle(twoCandleArray, 2);
            assert.equal(matches.length, 8);
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
                assert.equal(Gdax.user.limitOrders.openBuys.length, 1);
                Gdax.cancelOrder(d.id, (err, res, data) => {
                    assert.equal(Gdax.user.limitOrders.openBuys.length, 0);
                });
            });
        });
        it('removes the order from limit sell order array', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.sell(sellParams, (err, res, d) => {
                assert.equal(Gdax.user.limitOrders.openSells.length, 1);
                Gdax.cancelOrder(d.id, (err, res, data) => {
                    assert.equal(Gdax.user.limitOrders.openSells.length, 0);
                });
            });
        });
        it('returns the balance to the fiat balance if it was a buy order', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            let start = Gdax.user.fiatBalance;
            Gdax.buy(buyParams, (err, res, d) => {
                assert(start !== Gdax.user.fiatBalance, 'without a balance change this test is invalid');
                Gdax.cancelOrder(d.id, (err, res, data) => {
                    assert.equal(Gdax.user.fiatBalance, start);
                });
            });
        });
        it('it returns the balance to the crypto balance if it was a sell order', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            let start = Gdax.user.cryptoBalance;
            Gdax.sell(sellParams, (err, res, d) => {
                assert(start !== Gdax.user.cryptoBalance, 'without a balance change this test is invalid');
                Gdax.cancelOrder(d.id, (err, res, data) => {
                    assert.equal(Gdax.user.cryptoBalance, start);
                });
            });
        });
    });

    describe('#buy', () => {
        it('saves the limit order to the userLimitOrders.buys array ', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.buy(buyParams);
            assert.deepEqual(Gdax.user.limitOrders.openBuys[0], {
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
        });
        it('rejects the order if the user does not have enough fiat', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.user.fiatBalance = 0;
            Gdax.buy(buyParams, (err, res, data) => {
                assert.equal(data.status, "rejected");
            });
        });
        it('deducts the value of the order (size * price) from the fiat balance', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            let targetValue = Gdax.user.fiatBalance - (buyParams.size * buyParams.price);
            Gdax.buy(buyParams, () => {
                assert.equal(Gdax.user.fiatBalance, targetValue);
            });
        });
    });
    describe('#sell', () => {
        it('saves the limit order to the user.LimitOrders.openSells array ', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.sell(sellParams);
            assert.deepEqual(Gdax.user.limitOrders.openSells[0], {
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
            let Gdax = new ApiSim(1000, 1000);
            Gdax.currentPrice = 40;
            Gdax.sell(sellParams, (err, res, data) => {
                assert.equal(data.status, "rejected");
            });
        })
        it('rejects the order if the user does not have enough crypto', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            Gdax.user.cryptoBalance = 0;
            Gdax.sell(sellParams, (err, res, data) => {
                assert.equal(data.status, "rejected");
            });
        });
        it('deducts the value of the order (size * price) from the crypto balance', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;
            let targetValue = Gdax.user.cryptoBalance - (sellParams.size);
            Gdax.sell(sellParams, (err, res, data) => {
                assert.equal(Gdax.user.cryptoBalance, targetValue);
            });
        });
    });

    describe('#avgTime', () => {
        it('returns a time between the two times', () => {
            let Gdax = new ApiSim();
            let time1 = testCandleHighToLow.time,
                time2 = testCandleLowToHigh.time;
            let avgTime = Gdax.avgTime(time1, time2);
            let a = (new Date(avgTime)).getTime(),
                t1 = (new Date(time1)).getTime(),
                t2 = (new Date(time2)).getTime();
            assert(a < Math.max(t1, t2));
            assert(a > Math.min(t1, t2));
        })
    });
});