const ApiSim = require("../Lib/ApiSim");
const TestData = require('./TestData');
const assert = require("assert");

describe('#Historic Rates', () => {
    describe('#ApiSetup', () => {
        it('has a historic object', () => {
            let Gdax = new ApiSim();
            assert.deepEqual(Gdax.historics, {
                m1: [],
                m5: [],
                m15: [],
                h1: [],
                h6: [],
                d1: []
            });
        });
    });
    describe('#ApiFunction', () => {
        it('runs the callback function', (done) => {
            let Gdax = new ApiSim();
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 3600
            }, done);
        });
        it('returns m1 when granularity = 60', () => {
            let Gdax = new ApiSim();
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 777
            }, (err, res, data) => {
                assert.deepEqual(data, {
                    message: 'Unsupported granularity'
                })
            });
        });
        it('returns m1 when granularity = 60', () => {
            let Gdax = new ApiSim();
            Gdax.historics.m1 = TestData.twoHistoricRates.reverse();
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 60
            }, (err, res, data) => {
                assert.deepEqual(data, TestData.twoHistoricRates)
            });
        });
        it('returns m5 when granularity = 300', () => {
            let Gdax = new ApiSim();
            Gdax.historics.m5 = TestData.twoHistoricRates.reverse();
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 300
            }, (err, res, data) => {
                assert.deepEqual(data, TestData.twoHistoricRates)
            });
        });
        it('returns m15 when granularity = 900', () => {
            let Gdax = new ApiSim();
            Gdax.historics.m15 = TestData.twoHistoricRates.reverse();
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 900
            }, (err, res, data) => {
                assert.deepEqual(data, TestData.twoHistoricRates)
            });
        });
        it('returns h1 when granularity = 3600', () => {
            let Gdax = new ApiSim();
            Gdax.historics.h1 = TestData.twoHistoricRates.reverse();
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 3600
            }, (err, res, data) => {
                assert.deepEqual(data, TestData.twoHistoricRates)
            });
        });
        it('returns h6 when granularity = 21600', () => {
            let Gdax = new ApiSim();
            Gdax.historics.h6 = TestData.twoHistoricRates.reverse();
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 21600
            }, (err, res, data) => {
                assert.deepEqual(data, TestData.twoHistoricRates)
            });
        });
        it('returns d1 when granularity = 86400', () => {
            let Gdax = new ApiSim();
            Gdax.historics.d1 = TestData.twoHistoricRates.reverse();
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 86400
            }, (err, res, data) => {
                assert.deepEqual(data, TestData.twoHistoricRates)
            });
        });
    });
    describe('#Recording Data', () => {
        it("collects all of the data for the specific time from 1m-1d", () => {
            let Gdax = new ApiSim();
            Gdax.backtest(TestData.oneHourBacktestData);
            assert.equal(Gdax.historics.m1.length, TestData.oneHourBacktestData.length);
            assert.equal(Gdax.historics.m5.length, 12);
            assert.equal(Gdax.historics.m15.length, 4);
            assert.equal(Gdax.historics.h1.length, 1);
            assert.equal(Gdax.historics.h6.length, 1);
            assert.equal(Gdax.historics.d1.length, 1);
        });
        it("trims all arrays to 300 units max", () => {
            //NOTE THIS NEEDS TO BE CHANGED LATTER BUT FOR NOW
            //THIS WILL WORK FOR MY TESTING
            //                                      ¯\_(ツ)_/¯
            let Gdax = new ApiSim();
            Gdax.backtest(TestData.oneHourBacktestData);
            Gdax.backtest(TestData.oneHourBacktestData);
            Gdax.backtest(TestData.oneHourBacktestData);
            Gdax.backtest(TestData.oneHourBacktestData);
            Gdax.backtest(TestData.oneHourBacktestData);
            Gdax.backtest(TestData.oneHourBacktestData);
            Gdax.backtest(TestData.oneHourBacktestData);
            assert.equal(Gdax.historics.m1.length, 300);
            let lastCandleMinute = (new Date(Gdax.historics.m1[Gdax.historics.m1.length - 1].time)).getMinutes();
            let lastTestMinute = (new Date(TestData.oneHourBacktestData[TestData.oneHourBacktestData.length - 1].time)).getMinutes();
            assert.equal(lastCandleMinute, lastTestMinute)
        });
    });
});