const ApiSim = require("../Lib/ApiSim");
const TestData = require('gdax-sim-test-data');
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
            Gdax.historics.m1 = TestData.gdaxOutput.twoHistoricRates;
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 60
            }, (err, res, data) => {
                assert.deepEqual(data, TestData.gdaxOutput.twoHistoricRates.slice().reverse());
            });
        });
        it('returns m5 when granularity = 300', () => {
            let Gdax = new ApiSim();
            Gdax.historics.m5 = TestData.gdaxOutput.twoHistoricRates;
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 300
            }, (err, res, data) => {
                assert.deepEqual(data, TestData.gdaxOutput.twoHistoricRates.slice().reverse());
            });
        });
        it('returns m15 when granularity = 900', () => {
            let Gdax = new ApiSim();
            Gdax.historics.m15 = TestData.gdaxOutput.twoHistoricRates;
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 900
            }, (err, res, data) => {
                assert.deepEqual(data, TestData.gdaxOutput.twoHistoricRates.slice().reverse());
            });
        });
        it('returns h1 when granularity = 3600', () => {
            let Gdax = new ApiSim();
            Gdax.historics.h1 = TestData.gdaxOutput.twoHistoricRates;
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 3600
            }, (err, res, data) => {
                assert.deepEqual(data, TestData.gdaxOutput.twoHistoricRates.slice().reverse());
            });
        });
        it('returns h6 when granularity = 21600', () => {
            let Gdax = new ApiSim();
            Gdax.historics.h6 = TestData.gdaxOutput.twoHistoricRates;
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 21600
            }, (err, res, data) => {
                assert.deepEqual(data, TestData.gdaxOutput.twoHistoricRates.slice().reverse());
            });
        });
        it('returns d1 when granularity = 86400', () => {
            let Gdax = new ApiSim();
            Gdax.historics.d1 = TestData.gdaxOutput.twoHistoricRates;
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 86400
            }, (err, res, data) => {
                assert.deepEqual(data, TestData.gdaxOutput.twoHistoricRates.slice().reverse());
            });
        });
        describe("#Data formating is correct", () => {
            let Gdax = new ApiSim();
            Gdax.backtest(TestData.candles.oneHour);
            it('returns an array of arrays', () => {
                Gdax.getProductHistoricRates('ETH-BTC', {
                    granularity: 60
                }, (err, res, data) => {
                    for (let i = 0; i < TestData.candles.oneHour.length; i++) {
                        if (i > 1) {
                            assert.equal(data[i - 1][0] - data[i][0], 60);
                        }

                        assert.equal(data[i].length, 6);
                        assert.equal(data[i][1], TestData.candles.oneHour[59 - i].low);
                        assert.equal(data[i][2], TestData.candles.oneHour[59 - i].high);
                        assert.equal(data[i][3], TestData.candles.oneHour[59 - i].open);
                        assert.equal(data[i][4], TestData.candles.oneHour[59 - i].close);
                        assert.equal(data[i][5], TestData.candles.oneHour[59 - i].volume);
                    }
                });
            });
        });
        describe('proper number of data points', () => {
            let Gdax = new ApiSim();
            Gdax.backtest(TestData.candles.threeDaysContinuous);
            Gdax.getProductHistoricRates('ETH-BTC', {
                granularity: 3600 * 24
            }, (err, res, data) => {
                assert.equal(data.length, 3);
            });
        });
        describe('#0 index is most recent', () => {
            let Gdax = new ApiSim();
            Gdax.backtest(TestData.candles.threeDaysContinuous);
            it('returns the minutes with a time 60 apart', () => {
                Gdax.getProductHistoricRates('ETH-BTC', {
                    granularity: 60
                }, (err, res, data) => {
                    assert.equal(data[0][0] - data[1][0], 60);
                });
            });
            it('returns the 5 minutes with a time 300 apart', () => {
                Gdax.getProductHistoricRates('ETH-BTC', {
                    granularity: 300
                }, (err, res, data) => {
                    for (let i = 1; i < data.length; i++) {
                        assert.equal(data[i - 1][0] - data[i][0], 300);
                    }
                });
            });
            it('returns the 15 minutes with a time 900 apart', () => {
                Gdax.getProductHistoricRates('ETH-BTC', {
                    granularity: 900
                }, (err, res, data) => {
                    for (let i = 1; i < data.length; i++) {
                        assert.equal(data[i - 1][0] - data[i][0], 900);
                    }
                });
            });
            it('returns the days with a time 86400 apart', () => {
                Gdax.getProductHistoricRates('ETH-BTC', {
                    granularity: 86400
                }, (err, res, data) => {
                    for (let i = 1; i < data.length; i++) {
                        assert.equal(data[i - 1][0] - data[i][0], 86400);
                    }
                });
            });
        });
    });
    describe('#Recording Data', () => {
        it("collects all of the data for the specific time from 1m-1d", () => {
            let Gdax = new ApiSim();
            Gdax.backtest(TestData.candles.oneHour);
            assert.equal(Gdax.historics.m1.length, 60);
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
            Gdax.backtest(TestData.candles.threeDaysAsArray[0]);
            assert.equal(Gdax.historics.m1.length, 300);
            let lastCandleMinute = (new Date(Gdax.historics.m1[Gdax.historics.m1.length - 1].time)).getMinutes();
            let lastTestMinute = (new Date(TestData.candles.oneHour[TestData.candles.oneHour.length - 1].time)).getMinutes();
            assert.equal(lastCandleMinute, lastTestMinute)
        });
        it("works with consecuative runs of different inputs", () => {
            let Gdax = new ApiSim();
            let days = TestData.candles.threeDaysAsArray;
            for (let i = 0; i < days.length; i++) {
                Gdax.backtest(days[i]);
                Gdax.getProductHistoricRates('ETH-BTC', {
                    granularity: 86400
                }, (err, res, data) => {
                    assert.equal(data.length, i + 1);
                });
            }
        });
    });
});