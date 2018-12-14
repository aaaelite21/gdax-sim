const ApiSim = require('../Lib/ApiSim');
const assert = require('assert');

const marketSellPerams = {
    product_id: 'LTC-USD',
    size: 1,
    type: 'market'
};

const badMarketSellPerams = {
    product_id: 'LTC-USD',
    size: 101,
    type: 'market'
};

describe('#ApiSim Market Orders', () => {
    describe('#sell', () => {
        it('adds the funds value to the market order', () => {
            let Gdax = new ApiSim();
            Gdax.sell(marketSellPerams, (err, res, data) => {
                assert.equal(data.funds, Gdax.user.cryptoBalance.toString());
            });
        });
        it('saves the market order to the user.marketOrders.openSells array', () => {
            let Gdax = new ApiSim();
            Gdax.sell(marketSellPerams, (err, res, data) => {
                assert.equal(Gdax.user.marketOrders.openSells[0].id, data.id);
            });
        });
        it('runs the callback after', (done) => {
            let Gdax = new ApiSim();
            Gdax.sell(marketSellPerams, done);
        });
        it('returns the order in the \'data\' attribute of the callback', () => {
            let Gdax = new ApiSim();
            Gdax.sell(marketSellPerams, (err, res, data) => {
                assert.equal(Gdax.user.marketOrders.openSells[0], data);
            });
        });
        it('rejects the order if the user lacks the crypto', () => {
            let Gdax = new ApiSim();
            Gdax.sell(badMarketSellPerams, (err, res, data) => {
                assert.equal(data.status, 'rejected');
            });
        });
        it('deducts the value of the order (size * price) from the crypto balance', () => {
            let Gdax = new ApiSim();
            Gdax.sell(marketSellPerams, (err, res, data) => {
                assert.equal(Gdax.user.cryptoBalance, 99);
            });
        });
    });
    describe('#buy', () => {
        //repeat sell
    });

    describe('#fillOrder', () => {
        it('adds the (size * price) - fee of a market sell order to the fiat account', () => {});
        it('returns an array of messages to disbatch', () => {});
        it('returns the match first', () => {});
        it('returns the \'done\' last', () => {});
        it('the returned \'done\' has the proper data', () => {});
    });
});