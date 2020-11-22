const ApiSim = require("../Lib/ApiSim");
const WebsocketSim = require("../Lib/WebsocketSim");
const UserSim = require("../Lib/UserAccountSim");

const assert = require("assert");
const crypto = require("crypto");
//const TestDay = require('../TestData/27Nov2018LTCUSD.json');
const testCandleHighToLow = {
  time: "Tue Nov 27 2018 03:44:00 GMT-0500 (Eastern Standard Time)",
  open: 29.35,
  high: 29.41,
  low: 29.28,
  close: 29.3,
  volume: 58.25595405999999,
};
const testCandleLowToHigh = {
  time: "Tue Nov 27 2018 03:45:00 GMT-0500 (Eastern Standard Time)",
  open: 29.25,
  high: 29.38,
  low: 29.24,
  close: 29.26,
  volume: 41.767021490000005,
};
const twoCandleArray = [testCandleHighToLow, testCandleLowToHigh];
const buyParams = {
  price: 25.0,
  size: 0.1,
  product_id: "LTC-USD",
};
const sellParams = {
  price: 38.0,
  size: 0.1,
  product_id: "LTC-USD",
};

describe("#ApiSim", () => {
  describe("#init", () => {
    it("has a user account sim", () => {
      let Gdax = new ApiSim();
      assert(Gdax.user instanceof UserSim);
    });
    it("has a current price that starts at 0", () => {
      let Gdax = new ApiSim();
      assert.strictEqual(Gdax.currentPrice, 0);
    });
    it("has a websocketsim", () => {
      let Gdax = new ApiSim();
      assert(Gdax.websocketClient instanceof WebsocketSim);
    });
    it("has a usersim", () => {
      let Gdax = new ApiSim();
      assert(Gdax.user instanceof UserSim);
    });
  });

  describe("#fillOrder", () => {
    let time = "2018-12-06T01:46:01.162000Z";
    it("adds the size of a buy order to the crypto account if 100% filled", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      let target = Gdax.user.cryptoBalance + buyParams.size;
      Gdax.buy(buyParams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(Gdax.user.cryptoBalance, target);
      });
    });
    it("adds the size * price of a sell order to the fiat account if 100% filled", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      let target = Gdax.user.fiatBalance + sellParams.size * sellParams.price;
      Gdax.sell(sellParams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(Gdax.user.fiatBalance, target);
      });
    });
    it("returns an array of messages to disbatch", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.buy(buyParams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(ret.length, 2);
      });
    });
    it("returns the match first", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.buy(buyParams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(ret[0].type, "match");
      });
    });
    it("returns the 'done' last", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.buy(buyParams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(ret[ret.length - 1].type, "done");
      });
    });
    it("the returned 'done' has the proper data", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.buy(buyParams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        let done = ret[ret.length - 1];
        assert.strictEqual(done.order_id, data.id);
        assert.strictEqual(done.price, data.price);
        assert.strictEqual(done.side, data.side);
      });
    });
    /*it('fill message is only done if the order\'s volume is completle satisfied', () => {
            let Gdax = new ApiSim();
            Gdax.currentPrice = 35;

        });*/
  });

  describe("#backtest", () => {
    it("runs the afterSessionFunction", (done) => {
      let Gdax = new ApiSim();
      Gdax.afterSession = done;
      Gdax.backtest(twoCandleArray);
    });
    describe("completing orders", () => {
      it("completes a buy order when the price crosses down through that price between matches", () => {
        let count = 0;
        let Gdax = new ApiSim();
        Gdax.currentPrice = 29.4;
        Gdax.buy({
          price: 29.26,
          size: 0.1,
          product_id: "LTC-USD",
        });
        Gdax.websocketClient.on("message", (message) => {
          if (count === 4) {
            assert.strictEqual(
              Gdax.user.limitOrders.openBuys
                .map((x) => x.status)
                .indexOf("pending"),
              -1,
            );
          }
          count++;
        });
        Gdax.backtest(twoCandleArray);
      });
      it("completes a sell order when the price crosses up through that price between matches", () => {
        let count = 0;
        let Gdax = new ApiSim();

        function placeOrder() {
          Gdax.sell({
            price: 29.3,
            size: 0.1,
            product_id: "LTC-USD",
          });
        }

        Gdax.websocketClient.on("message", (message) => {
          if (count === 2) {
            placeOrder();
            assert.strictEqual(
              Gdax.user.limitOrders.openSells
                .map((x) => x.status)
                .indexOf("pending"),
              0,
            );
          }
          if (count === 6) {
            assert.strictEqual(
              Gdax.user.limitOrders.openSells
                .map((x) => x.status)
                .indexOf("pending"),
              -1,
            );
          }
          count++;
        });
        Gdax.backtest(twoCandleArray);
      });
      it("buy: disbatches a 'match' that includes the order's specific details", () => {
        let Gdax = new ApiSim();
        Gdax.currentPrice = 29.4;
        let count = 0;
        let order;
        Gdax.buy(
          {
            price: 29.26,
            size: 0.1,
            product_id: "LTC-USD",
          },
          (err, res, data) => {
            order = data;
          },
        );
        Gdax.websocketClient.on("message", (message) => {
          if (count === 4) {
            assert.strictEqual(message.maker_order_id, order.id);
          }
          count++;
        });
        Gdax.backtest(twoCandleArray);
      });
      it("buy: disbatches a 'type = done reason = filled' that includes the order's id", () => {
        let Gdax = new ApiSim();
        Gdax.currentPrice = 29.4;
        let count = 0;
        let order;
        Gdax.buy(
          {
            price: 29.26,
            size: 0.1,
            product_id: "LTC-USD",
          },
          (err, res, data) => {
            order = data;
          },
        );
        Gdax.websocketClient.on("message", (message) => {
          if (count === 5) {
            assert.strictEqual(message.type, "done");
            assert.strictEqual(message.order_id, order.id);
          }
          count++;
        });
        Gdax.backtest(twoCandleArray);
      });
      it("sell: disbatches a 'match' that includes the order's specific details", () => {
        let Gdax = new ApiSim();
        let count = 0;
        let order;

        function placeOrder() {
          Gdax.sell(
            {
              price: 29.3,
              size: 0.1,
              product_id: "LTC-USD",
            },
            (err, res, data) => {
              order = data;
            },
          );
        }
        Gdax.websocketClient.on("message", (message) => {
          if (count === 2) {
            placeOrder();
          }
          if (count === 6) {
            assert.strictEqual(message.maker_order_id, order.id);
          }
          count++;
        });
        Gdax.backtest(twoCandleArray);
      });
      it("sell: disbatches a 'type = fill reason = done' that includes the order's id", () => {
        let Gdax = new ApiSim();
        let count = 0;
        let order;

        function placeOrder() {
          Gdax.sell(
            {
              price: 29.3,
              size: 0.1,
              product_id: "LTC-USD",
            },
            (err, res, data) => {
              order = data;
            },
          );
        }
        Gdax.websocketClient.on("message", (message) => {
          if (count === 2) {
            placeOrder();
          }
          if (count === 7) {
            assert.strictEqual(message.type, "done");
            assert.strictEqual(message.order_id, order.id);
          }
          count++;
        });
        Gdax.backtest(twoCandleArray);
      });
    });
    it("disbatches all matches to the websocket in time order", () => {
      let Gdax = new ApiSim();
      let count = 0;
      Gdax.websocketClient.on("message", () => {
        count++;
      });
      Gdax.backtest(twoCandleArray);
      assert.strictEqual(count, 8);
    });
    it("disbatches all matches to the websocket from oldest to most recent", () => {
      let Gdax = new ApiSim();
      let lastTime = null;
      Gdax.websocketClient.on("message", (data) => {
        if (lastTime === null) {
          lastTime = new Date(data.time).getTime();
        } else {
          let now = new Date(data.time).getTime();
          assert(now > lastTime);
          lastTime = now;
        }
      });
      Gdax.backtest(twoCandleArray);
    });
    it("disbatches all matches to the websocket from oldest to most recent", () => {
      let Gdax = new ApiSim();
      let lastTime = null;
      Gdax.websocketClient.on("message", (data) => {
        if (lastTime === null) {
          lastTime = new Date(data.time).getTime();
        } else {
          let now = new Date(data.time).getTime();
          assert(now > lastTime);
          lastTime = now;
        }
      });
      Gdax.backtest(twoCandleArray);
    });
    it("sets the current price to that of the most recent match", () => {
      let Gdax = new ApiSim();
      Gdax.websocketClient.on("message", (data) => {
        assert.strictEqual(Gdax.currentPrice, parseFloat(data.price));
      });
      Gdax.backtest(twoCandleArray);
    });
  });

  describe("#cancleOrder", () => {
    it("runs the callback", (done) => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.buy(buyParams, (err, res, data) => {
        Gdax.cancelOrder(data.id, done);
      });
    });
    it("returns the order id in the 'data' attribute of the callback if successful", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      let orderId;
      Gdax.buy(buyParams, (err, res, d) => {
        orderId = d.id;
        Gdax.cancelOrder(orderId, (err, res, data) => {
          assert.strictEqual(data, orderId);
        });
      });
    });
    it("removes the order from limit buy order array", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.buy(buyParams, (err, res, d) => {
        assert.strictEqual(
          Gdax.user.limitOrders.openBuys
            .map((x) => x.status)
            .indexOf("pending"),
          0,
        );
        Gdax.cancelOrder(d.id, (err, res, data) => {
          assert.strictEqual(Gdax.user.limitOrders.openBuys.length, 0);
        });
      });
    });
    it("removes the order from limit sell order array", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.sell(sellParams, (err, res, d) => {
        assert.strictEqual(Gdax.user.limitOrders.openSells.length, 1);
        Gdax.cancelOrder(d.id, (err, res, data) => {
          assert.strictEqual(
            Gdax.user.limitOrders.openSells
              .map((x) => x.status)
              .indexOf("pending"),
            -1,
          );
        });
      });
    });
    it("returns the balance to the fiat balance if it was a buy order", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      let start = Gdax.user.fiatBalance;
      Gdax.buy(buyParams, (err, res, d) => {
        assert(
          start !== Gdax.user.fiatBalance,
          "without a balance change this test is invalid",
        );
        Gdax.cancelOrder(d.id, (err, res, data) => {
          assert.strictEqual(Gdax.user.fiatBalance, start);
        });
      });
    });
    it("it returns the balance to the crypto balance if it was a sell order", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      let start = Gdax.user.cryptoBalance;
      Gdax.sell(sellParams, (err, res, d) => {
        assert(
          start !== Gdax.user.cryptoBalance,
          "without a balance change this test is invalid",
        );
        Gdax.cancelOrder(d.id, (err, res, data) => {
          assert.strictEqual(Gdax.user.cryptoBalance, start);
        });
      });
    });
  });

  describe("#buy", () => {
    it("saves the limit order to the userLimitOrders.buys array ", () => {
      let Gdax = new ApiSim();
      Gdax.generateSalt = () => {
        return "x";
      };
      Gdax.currentPrice = 35;
      Gdax.buy(buyParams);
      assert.deepStrictEqual(Gdax.user.limitOrders.openBuys[0], {
        id: crypto
          .createHash("sha1")
          .update(JSON.stringify(buyParams) + "x")
          .digest("hex"),
        price: buyParams.price.toString(),
        size: buyParams.size.toString(),
        product_id: buyParams.product_id,
        side: "buy",
        stp: "dc",
        type: "limit",
        time_in_force: "GTC",
        post_only: false,
        created_at: Gdax.currentTime,
        fill_fees: "0.0000000000000000",
        filled_size: "0.00000000",
        executed_value: "0.0000000000000000",
        status: "pending",
        settled: false,
      });
    });
    it("runs the callback after", (done) => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.buy(buyParams, done);
    });
    it("returns the order in the 'data' attribute of the callback", () => {
      let Gdax = new ApiSim();
      Gdax.generateSalt = () => {
        return "x";
      };
      Gdax.currentPrice = 35;
      Gdax.buy(buyParams, function (err, res, data) {
        assert.deepStrictEqual(data, {
          id: crypto
            .createHash("sha1")
            .update(JSON.stringify(buyParams) + "x")
            .digest("hex"),
          price: buyParams.price.toString(),
          size: buyParams.size.toString(),
          product_id: buyParams.product_id,
          side: "buy",
          stp: "dc",
          type: "limit",
          time_in_force: "GTC",
          post_only: false,
          created_at: Gdax.currentTime,
          fill_fees: "0.0000000000000000",
          filled_size: "0.00000000",
          executed_value: "0.0000000000000000",
          status: "pending",
          settled: false,
        });
      });
    });
    it("rejects the order if the price is above the current price", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 12;
      Gdax.buy(buyParams, (err, res, data) => {
        assert.strictEqual(data.status, "rejected");
      });
    });
    it("rejects the order if the user does not have enough fiat", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.user.fiatBalance = 0;
      Gdax.buy(buyParams, (err, res, data) => {
        assert.strictEqual(data.status, "rejected");
      });
    });
    it("deducts the value of the order (size * price) from the fiat balance", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      let targetValue =
        Gdax.user.fiatBalance - buyParams.size * buyParams.price;
      Gdax.buy(buyParams, () => {
        assert.strictEqual(Gdax.user.fiatBalance, targetValue);
      });
    });
  });
  describe("#sell", () => {
    it("saves the limit order to the user.LimitOrders.openSells array ", () => {
      let Gdax = new ApiSim();
      Gdax.generateSalt = () => {
        return "x";
      };
      Gdax.currentPrice = 35;
      Gdax.sell(sellParams);
      assert.deepStrictEqual(Gdax.user.limitOrders.openSells[0], {
        id: crypto
          .createHash("sha1")
          .update(JSON.stringify(sellParams) + "x")
          .digest("hex"),
        price: sellParams.price.toString(),
        size: sellParams.size.toString(),
        product_id: sellParams.product_id,
        side: "sell",
        stp: "dc",
        type: "limit",
        time_in_force: "GTC",
        post_only: false,
        created_at: Gdax.currentTime,
        fill_fees: "0.0000000000000000",
        filled_size: "0.00000000",
        executed_value: "0.0000000000000000",
        status: "pending",
        settled: false,
      });
    });
    it("runs the callback after", (done) => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.sell(sellParams, done);
    });
    it("returns the order in the 'data' attribute of the callback", () => {
      let Gdax = new ApiSim();
      Gdax.generateSalt = () => {
        return "x";
      };
      Gdax.currentPrice = 35;
      Gdax.sell(sellParams, function (err, res, data) {
        assert.deepStrictEqual(data, {
          id: crypto
            .createHash("sha1")
            .update(JSON.stringify(sellParams) + "x")
            .digest("hex"),
          price: sellParams.price.toString(),
          size: sellParams.size.toString(),
          product_id: sellParams.product_id,
          side: "sell",
          stp: "dc",
          type: "limit",
          time_in_force: "GTC",
          post_only: false,
          created_at: Gdax.currentTime,
          fill_fees: "0.0000000000000000",
          filled_size: "0.00000000",
          executed_value: "0.0000000000000000",
          status: "pending",
          settled: false,
        });
      });
    });
    it("rejects the order if the price is above the current price", () => {
      let Gdax = new ApiSim(1000, 1000);
      Gdax.currentPrice = 40;
      Gdax.sell(sellParams, (err, res, data) => {
        assert.strictEqual(data.status, "rejected");
      });
    });
    it("rejects the order if the user does not have enough crypto", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.user.cryptoBalance = 0;
      Gdax.sell(sellParams, (err, res, data) => {
        assert.strictEqual(data.status, "rejected");
      });
    });
    it("deducts the value of the order (size * price) from the crypto balance", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      let targetValue = Gdax.user.cryptoBalance - sellParams.size;
      Gdax.sell(sellParams, (err, res, data) => {
        assert.strictEqual(Gdax.user.cryptoBalance, targetValue);
      });
    });
  });

  describe("#avgTime", () => {
    it("returns a time between the two times", () => {
      let Gdax = new ApiSim();
      let time1 = testCandleHighToLow.time,
        time2 = testCandleLowToHigh.time;
      let avgTime = Gdax.avgTime(time1, time2);
      let a = new Date(avgTime).getTime(),
        t1 = new Date(time1).getTime(),
        t2 = new Date(time2).getTime();
      assert(a < Math.max(t1, t2));
      assert(a > Math.min(t1, t2));
    });
  });
});
