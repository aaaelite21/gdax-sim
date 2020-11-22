const ApiSim = require("../Lib/ApiSim");
const TestData = require("gdax-sim-test-data");
const assert = require("assert");
const { chdir } = require("process");

describe("#Historic Rates", () => {
  describe("#ApiSetup", () => {
    it("has a historic object", () => {
      let Gdax = new ApiSim();
      assert.deepStrictEqual(Gdax.historics, {
        m1: [],
        m5: [],
        m15: [],
        h1: [],
        h6: [],
        d1: [],
      });
    });
  });
  describe("#ApiFunction", () => {
    it("runs the callback function", (done) => {
      let Gdax = new ApiSim();
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          granularity: 3600,
        },
        done,
      );
    });
    it("returns m1 when granularity = 60", () => {
      let Gdax = new ApiSim();
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          granularity: 777,
        },
        (err, res, data) => {
          assert.deepStrictEqual(data, {
            message: "Unsupported granularity",
          });
        },
      );
    });
    it("returns m1 when granularity = 60", () => {
      let Gdax = new ApiSim();
      Gdax.historics.m1 = TestData.gdaxOutput.twoHistoricRates;
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          granularity: 60,
        },
        (err, res, data) => {
          assert.deepStrictEqual(
            data,
            TestData.gdaxOutput.twoHistoricRates.slice().reverse(),
          );
        },
      );
    });
    it("returns m5 when granularity = 300", () => {
      let Gdax = new ApiSim();
      Gdax.historics.m5 = TestData.gdaxOutput.twoHistoricRates;
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          granularity: 300,
        },
        (err, res, data) => {
          assert.deepStrictEqual(
            data,
            TestData.gdaxOutput.twoHistoricRates.slice().reverse(),
          );
        },
      );
    });
    it("returns m15 when granularity = 900", () => {
      let Gdax = new ApiSim();
      Gdax.historics.m15 = TestData.gdaxOutput.twoHistoricRates;
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          granularity: 900,
        },
        (err, res, data) => {
          assert.deepStrictEqual(
            data,
            TestData.gdaxOutput.twoHistoricRates.slice().reverse(),
          );
        },
      );
    });
    it("returns h1 when granularity = 3600", () => {
      let Gdax = new ApiSim();
      Gdax.historics.h1 = TestData.gdaxOutput.twoHistoricRates;
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          granularity: 3600,
        },
        (err, res, data) => {
          assert.deepStrictEqual(
            data,
            TestData.gdaxOutput.twoHistoricRates.slice().reverse(),
          );
        },
      );
    });
    it("returns h6 when granularity = 21600", () => {
      let Gdax = new ApiSim();
      Gdax.historics.h6 = TestData.gdaxOutput.twoHistoricRates;
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          granularity: 21600,
        },
        (err, res, data) => {
          assert.deepStrictEqual(
            data,
            TestData.gdaxOutput.twoHistoricRates.slice().reverse(),
          );
        },
      );
    });
    it("returns d1 when granularity = 86400", () => {
      let Gdax = new ApiSim();
      Gdax.historics.d1 = TestData.gdaxOutput.twoHistoricRates;
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          granularity: 86400,
        },
        (err, res, data) => {
          assert.deepStrictEqual(
            data,
            TestData.gdaxOutput.twoHistoricRates.slice().reverse(),
          );
        },
      );
    });
    describe("#Data formating is correct", () => {
      let Gdax = new ApiSim();
      Gdax.backtest(TestData.candles.oneHour);
      it("returns an array of arrays", () => {
        Gdax.getProductHistoricRates(
          "ETH-BTC",
          {
            granularity: 60,
          },
          (err, res, data) => {
            for (let i = 0; i < TestData.candles.oneHour.length; i++) {
              if (i > 1) {
                assert.strictEqual(data[i - 1][0] - data[i][0], 60);
              }

              assert.strictEqual(data[i].length, 6);
              assert.strictEqual(
                data[i][1],
                TestData.candles.oneHour[59 - i].low,
              );
              assert.strictEqual(
                data[i][2],
                TestData.candles.oneHour[59 - i].high,
              );
              assert.strictEqual(
                data[i][3],
                TestData.candles.oneHour[59 - i].open,
              );
              assert.strictEqual(
                data[i][4],
                TestData.candles.oneHour[59 - i].close,
              );
              assert.strictEqual(
                data[i][5],
                TestData.candles.oneHour[59 - i].volume,
              );
            }
          },
        );
      });
    });
    describe("proper number of data points", () => {
      let Gdax = new ApiSim();
      Gdax.backtest(TestData.candles.threeDaysContinuous);
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          granularity: 3600 * 24,
        },
        (err, res, data) => {
          assert.strictEqual(data.length, 3);
        },
      );
    });
    describe("#0 index is most recent", () => {
      let Gdax = new ApiSim();
      Gdax.backtest(TestData.candles.threeDaysContinuous);
      it("returns the minutes with a time 60 apart", () => {
        Gdax.getProductHistoricRates(
          "ETH-BTC",
          {
            granularity: 60,
          },
          (err, res, data) => {
            assert.strictEqual(data[0][0] - data[1][0], 60);
          },
        );
      });
      it("returns the 5 minutes with a time 300 apart", () => {
        Gdax.getProductHistoricRates(
          "ETH-BTC",
          {
            granularity: 300,
          },
          (err, res, data) => {
            for (let i = 1; i < data.length; i++) {
              assert.strictEqual(data[i - 1][0] - data[i][0], 300);
            }
          },
        );
      });
      it("returns the 15 minutes with a time 900 apart", () => {
        Gdax.getProductHistoricRates(
          "ETH-BTC",
          {
            granularity: 900,
          },
          (err, res, data) => {
            for (let i = 1; i < data.length; i++) {
              assert.strictEqual(data[i - 1][0] - data[i][0], 900);
            }
          },
        );
      });
      it("returns the days with a time 86400 apart", () => {
        Gdax.getProductHistoricRates(
          "ETH-BTC",
          {
            granularity: 86400,
          },
          (err, res, data) => {
            for (let i = 1; i < data.length; i++) {
              assert.strictEqual(data[i - 1][0] - data[i][0], 86400);
            }
          },
        );
      });
    });
  });
  describe("#Recording Data", () => {
    it("collects all of the data for the specific time from 1m-1d", () => {
      let Gdax = new ApiSim();
      Gdax.backtest(TestData.candles.oneHour);
      assert.strictEqual(Gdax.historics.m1.length, 60);
      assert.strictEqual(Gdax.historics.m5.length, 12);
      assert.strictEqual(Gdax.historics.m15.length, 4);
      assert.strictEqual(Gdax.historics.h1.length, 1);
      assert.strictEqual(Gdax.historics.h6.length, 1);
      assert.strictEqual(Gdax.historics.d1.length, 1);
    });
    it("trims all arrays to 300 units max", () => {
      //NOTE THIS NEEDS TO BE CHANGED LATTER BUT FOR NOW
      //THIS WILL WORK FOR MY TESTING
      //                                      ¯\_(ツ)_/¯
      let Gdax = new ApiSim();
      Gdax.backtest(TestData.candles.threeDaysAsArray[0]);
      assert.strictEqual(Gdax.historics.m1.length, 300);
      let lastCandleMinute = new Date(
        Gdax.historics.m1[Gdax.historics.m1.length - 1].time,
      ).getMinutes();
      let lastTestMinute = new Date(
        TestData.candles.oneHour[TestData.candles.oneHour.length - 1].time,
      ).getMinutes();
      assert.strictEqual(lastCandleMinute, lastTestMinute);
    });
    it("works with consecuative runs of different inputs", () => {
      let Gdax = new ApiSim();
      let days = TestData.candles.threeDaysAsArray;
      for (let i = 0; i < days.length; i++) {
        Gdax.backtest(days[i]);
        Gdax.getProductHistoricRates(
          "ETH-BTC",
          {
            granularity: 86400,
          },
          (err, res, data) => {
            assert.strictEqual(data.length, i + 1);
          },
        );
      }
    });
    it("collects all of the data for the specific time from m15-1d when reduce signals is used", () => {
      let Gdax = new ApiSim();
      Gdax.backtest(TestData.candles.threeDaysContinuous, {
        reduceSignals: true,
      });
      assert.strictEqual(Gdax.historics.m15.length, 288);
      assert.strictEqual(Gdax.historics.h1.length, 72);
      assert.strictEqual(Gdax.historics.h6.length, 12);
      assert.strictEqual(Gdax.historics.d1.length, 3);
    });
    it("has a first candle is midnight with the turbo mode on", () => {
      let Gdax = new ApiSim();
      Gdax.backtest(TestData.candles.threeDaysAsArray[0], {
        reduceSignals: true,
      });
      let d = new Date(Gdax.historics.m15[0].time);
      assert.strictEqual(d.getMinutes(), 0);
    });
  });
  describe("#Start and End parameters", () => {
    it("the most recent candle does not exceed the end param", () => {
      let Gdax = new ApiSim();
      let days = TestData.candles.threeDaysAsArray;
      let end_time = new Date("Sun, 03 Jan 2016 23:21:00 GMT");
      let start_time = new Date(end_time - 300 * 60 * 1000);

      for (let i = 0; i < days.length; i++) {
        Gdax.backtest(days[i]);
      }
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          granularity: 60,
          start: start_time.toISOString(),
          end: end_time.toISOString(),
        },
        (err, res, data) => {
          assert(data[0][0] * 1000 === end_time.getTime());
        },
      );
    });
    it("the oldest candle does not preceed the start param", () => {
      let Gdax = new ApiSim();
      let days = TestData.candles.threeDaysAsArray;
      let end_time = new Date("Sun, 03 Jan 2016 23:21:00 GMT");
      let start_time = new Date(end_time - 10 * 60 * 1000);

      for (let i = 0; i < days.length; i++) {
        Gdax.backtest(days[i]);
      }
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          granularity: 60,
          start: start_time.toISOString(),
          end: end_time.toISOString(),
        },
        (err, res, data) => {
          assert(data[data.length - 1][0] * 1000 >= start_time.getTime());
        },
      );
    });
    it("if no start end is ignored", () => {
      let Gdax = new ApiSim();
      let days = TestData.candles.threeDaysAsArray;
      let end_time = new Date("Sun, 03 Jan 2016 23:21:00 GMT");

      for (let i = 0; i < days.length; i++) {
        Gdax.backtest(days[i]);
      }
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          granularity: 60,
          end: end_time.toISOString(),
        },
        (err, res, data) => {
          assert(data[0][0] * 1000 > end_time.getTime());
        },
      );
    });
  });
  describe("#Offset Hours for stock market", () => {
    it("has all of its hourly (granularity 3600) candles start on a half hour mark when 30 is used", () => {
      let Gdax = new ApiSim({ hour_start_on: 30 });
      Gdax.backtest(TestData.candles.threeDaysAsArray[0]);
      assert.strictEqual(
        Gdax.historics.h1.length,
        25,
        "number of candles is wrong",
      );
      assert.strictEqual(
        new Date(Gdax.historics.h1[0].time).getMinutes(),
        30,
        "minutes of candles is wrong",
      );
      assert.strictEqual(
        new Date(Gdax.historics.h1[0].time).getUTCHours(),
        23,
        "hours of candles is wrong",
      );
    });
    it("has all of its hourly (granularity 3600) candles start on a 45 min mark when 45 is used", () => {
      let Gdax = new ApiSim({ hour_start_on: 45 });
      Gdax.backtest(TestData.candles.threeDaysAsArray[0]);
      assert.strictEqual(
        Gdax.historics.h1.length,
        25,
        "number of candles is wrong",
      );
      assert.strictEqual(
        new Date(Gdax.historics.h1[0].time).getMinutes(),
        45,
        "minutes of candles is wrong",
      );
      assert.strictEqual(
        new Date(Gdax.historics.h1[0].time).getUTCHours(),
        23,
        "hours of candles is wrong",
      );
    });
    it("has normal functionality when zero is used for an offset on the hourly", () => {
      let Gdax = new ApiSim({ hour_start_on: 0 });
      Gdax.backtest(TestData.candles.threeDaysAsArray[0]);
      assert.strictEqual(
        Gdax.historics.h1.length,
        24,
        "number of candles is wrong",
      );
      assert.strictEqual(
        new Date(Gdax.historics.h1[0].time).getMinutes(),
        0,
        "minutes of candles is wrong",
      );
      assert.strictEqual(
        new Date(Gdax.historics.h1[0].time).getUTCHours(),
        0,
        "hours of candles is wrong",
      );
    });
    it("returns the candles contining the start and end times when not exactly on the money", () => {
      let Gdax = new ApiSim({ hour_start_on: 30 });
      Gdax.backtest(TestData.candles.threeDaysAsArray[0]);
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          start: new Date(
            TestData.candles.threeDaysAsArray[0][0].time,
          ).toISOString(),
          end: new Date(
            TestData.candles.threeDaysAsArray[0][300].time,
          ).toISOString(),
          granularity: 3600,
        },
        (err, res, data) => {
          assert.strictEqual(
            data.length,
            5,
            "not the right number of hours returned",
          );
          assert.strictEqual(
            new Date(data[0][0] * 1000).toISOString(),
            "2016-01-01T04:30:00.000Z",
            "not the right starting hour",
          );
        },
      );
    });
    it("does not fill candles with blank spaces when there is a gap in open/close data", () => {
      let Gdax = new ApiSim();
      Gdax.backtest(
        [
          {
            time: "Wed, 22 Jul 2015 19:57:00 GMT",
            open: 125.12,
            high: 125.12,
            low: 125.08,
            close: 125.09,
            volume: 9389,
          },
          {
            time: "Thu, 23 Jul 2015 13:33:00 GMT",
            open: 222.12,
            high: 256.12,
            low: 211.08,
            close: 223.09,
            volume: 9389,
          },
        ],
        {
          start_time: "1330",
          end_time: "2000",
        },
      );
      assert.strictEqual(
        Gdax.historics.h1.length,
        2,
        "number of candles is wrong",
      );
    });
  });
  describe("getting data using limit functionality", () => {
    it("has a time no latter then the end time", () => {
      let testTime = new Date("Sun, 03 Jan 2016 15:30:00 GMT");
      let Gdax = new ApiSim({ hour_start_on: 30 });
      Gdax.backtest(TestData.candles.threeDaysContinuous);
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          limit: 10,
          granularity: 3600,
          end: testTime.toISOString(),
        },
        (err, res, data) => {
          assert.strictEqual(
            data[0][0],
            testTime.getTime() / 1000,
            "end not take into account properly",
          );
        },
      );
    });
    it("only returns a number of candles equal to the limit", () => {
      let testTime = new Date("Sun, 03 Jan 2016 15:30:00 GMT");
      let Gdax = new ApiSim({ hour_start_on: 30 });
      Gdax.backtest(TestData.candles.threeDaysContinuous);
      Gdax.getProductHistoricRates(
        "ETH-BTC",
        {
          limit: 10,
          granularity: 3600,
          end: testTime.toISOString(),
        },
        (err, res, data) => {
          assert.strictEqual(
            data.length,
            10,
            "limit not take into account properly",
          );
        },
      );
    });
  });
});
