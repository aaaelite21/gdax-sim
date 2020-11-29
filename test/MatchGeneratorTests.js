const assert = require("assert");
const TestData = require("gdax-sim-test-data");
const {
  createMatch,
  createMatchesFromCandle,
} = require("../Lib/MatchGenerators");
const testCandleHighToLow = {
  time: "Tue Nov 27 2018 03:44:00 GMT-0500 (Eastern Standard Time)",
  open: 29.35,
  high: 29.41,
  low: 29.28,
  close: 29.3,
  volume: 100,
};
const testCandleLowToHigh = {
  time: "Tue Nov 27 2018 03:45:00 GMT-0500 (Eastern Standard Time)",
  open: 29.25,
  high: 29.38,
  low: 29.24,
  close: 29.26,
  volume: 41.767021490000005,
};
const testCandleLowToHighLate = {
  time: "Tue Nov 27 2018 03:53:00 GMT-0500 (Eastern Standard Time)",
  open: 29.25,
  high: 29.38,
  low: 29.24,
  close: 29.26,
  volume: 41.767021490000005,
};
const twoCandleArray = [testCandleHighToLow, testCandleLowToHigh];
const matchTemplate = {
  side: "buy",
  price: 32,
  size: 2,
  time: new Date("Dec 1 2018").toISOString(),
  product_id: "LTC-USD",
};

describe("#MatchGenerators", () => {
  describe("#createMatch", () => {
    it("returns a match with the specafied paramaeters", () => {
      let match = createMatch(matchTemplate);
      assert.strictEqual(match.side, matchTemplate.side);
      assert.strictEqual(match.size, matchTemplate.size);
      assert.strictEqual(match.price, matchTemplate.price.toString());
      assert.strictEqual(match.time, matchTemplate.time);
      assert.strictEqual(match.product_id, matchTemplate.product_id);
    });
    it("returns a that generates unspecafied parameters", () => {
      let match = createMatch(matchTemplate);

      assert(match.type === "match");
      assert(typeof match.trade_id === "number");
      assert(typeof match.sequence === "number");
      assert(typeof match.maker_order_id === "string");
      assert(typeof match.taker_order_id === "string");
    });
    it("returns the desired maker order id if specafied", () => {
      let x = JSON.parse(JSON.stringify(matchTemplate));
      x.maker_order_id = "abc123";
      let match = createMatch(x);
      assert.strictEqual(match.maker_order_id, "abc123");
    });
    it("returns the desired taker order id if specafied", () => {
      let x = JSON.parse(JSON.stringify(matchTemplate));
      x.taker_order_id = "abc123";
      let match = createMatch(x);
      assert.strictEqual(match.taker_order_id, "abc123");
    });
  });
  describe("#createMatchesFromCandle", () => {
    it("returns a minimum of 4 matches", () => {
      let matches = createMatchesFromCandle(testCandleLowToHigh);
      assert.strictEqual(matches.length, 4);
    });
    it("returns high before low if the close <= open", () => {
      let matches = createMatchesFromCandle(testCandleHighToLow);
      assert(parseFloat(matches[1].price) >= parseFloat(matches[2].price));
    });
    it("returns low before high if the close > open", () => {
      let matches = createMatchesFromCandle(testCandleLowToHigh);
      assert(parseFloat(matches[1].price) <= parseFloat(matches[2].price));
    });
    it("increases the seconds from each match by 14", () => {
      let matches = createMatchesFromCandle(testCandleLowToHigh);
      for (let i = 1; i < matches.length; i++) {
        let date = new Date(matches[i].time);
        let datePrime = new Date(matches[i - 1].time);
        assert.strictEqual(date.getSeconds() - datePrime.getSeconds(), 14);
      }
    });
    it("changes the side to 'sell' if the price is going down from the last match", () => {
      let matches = createMatchesFromCandle(testCandleHighToLow);
      assert.strictEqual(matches[2].side, "sell");
    });
    it("changes the side to 'buy' if the price is going up from the last match", () => {
      let matches = createMatchesFromCandle(testCandleHighToLow);
      assert.strictEqual(matches[1].side, "buy");
      assert.strictEqual(matches[3].side, "buy");
    });
    it("can take an array of candles and generate matches based off of them", () => {
      let matches = createMatchesFromCandle(twoCandleArray);
      assert.strictEqual(matches.length, 8);
    });
    it("limits the number of messages based on the scaling", () => {
      let matches = createMatchesFromCandle(
        TestData.candles.threeDaysAsArray[0],
        "0000",
        "2460",
        "BTC-USD",
        true,
      );
      assert.strictEqual(matches.length, 384); //matches + heartbeat
    });
    it("does not process duplicate candles", () => {
      let matches = createMatchesFromCandle(
        [testCandleHighToLow, testCandleHighToLow, testCandleLowToHigh],
        "0000",
        "2460",
        "BTC-USD",
        false,
      );
      assert.strictEqual(matches[0].size, testCandleHighToLow.volume / 4);
      assert.strictEqual(matches.length, 8);
    });
    it("does not process duplicate candles w/ reduced signals", () => {
      let matches = createMatchesFromCandle(
        [testCandleHighToLow, testCandleHighToLow, testCandleLowToHigh],
        "0000",
        "2460",
        "BTC-USD",
        true,
      );
      assert.strictEqual(matches[0].size, testCandleHighToLow.volume / 4);
      assert.strictEqual(matches.length, 8);
    });
  });
});
