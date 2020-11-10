const ApiSim = require("../gdax-sim");
const assert = require("assert");
const day = require("../TestData/27Nov2018LTCUSD.json");
const gdaxSim = require("../gdax-sim");

describe("#start and stop times", () => {
  it("limits creation of messages to after the designated start time", () => {
    let Gdax = new ApiSim();
    let m = Gdax.createMatchesFromCandle(day, "1330");
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
    let Gdax = new ApiSim();
    let m = Gdax.createMatchesFromCandle(day, "0000", "2000");
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
});
