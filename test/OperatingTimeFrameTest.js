const ApiSim = require("../gdax-sim");
const assert = require("assert");
const day = require("../TestData/27Nov2018LTCUSD.json");
const {
  createMatch,
  createMatchesFromCandle,
} = require("../Lib/MatchGenerators");

describe("#start and stop times", () => {
  it("limits creation of messages to after the designated start time", () => {
    let m = createMatchesFromCandle(day, "1330");
    assert.strictEqual(
      new Date(m[0].time).getUTCHours(),
      13,
      "start time failed (hours)",
    );
    assert.strictEqual(
      new Date(m[0].time).getMinutes(),
      30,
      "start time failed (minutes)",
    );
  });
  it("limits creation of messages to before the designated end time", () => {
    let m = createMatchesFromCandle(day, "0000", "2000");
    assert.strictEqual(
      new Date(m[m.length - 1].time).getUTCHours(),
      19,
      `end time failed (hours) ${m[m.length - 1].time}`,
    );
    assert.strictEqual(
      new Date(m[m.length - 1].time).getMinutes(),
      59,
      "end time failed (minutes)",
    );
  });
  it("makes the prpoper number of matcher for the given time period", () => {
    let m = createMatchesFromCandle(day, "1330", "2000");
    assert.strictEqual(
      m.length,
      1560,
      `end time failed (hours) ${m[m.length - 1].time}`,
    );
  });
  it("only makes candles for the desired time frame", () => {
    let sim = new ApiSim({ hour_start_on: 30 });

    sim.backtest(day, { start_time: "1430", end_time: "2100" });
    assert.strictEqual(
      new Date(sim.historics.h1[0].time).getUTCHours(),
      14,
      "time should start at 1430",
    );
  });
});
