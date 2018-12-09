# gdax-sim

Simulator used to help unit test and back test various Coinbase-Pro (gdax) interactions.

# Backtest
Reads data from saved candle objects and spits out matches 4 matches, one for open, one for the high, one for the low, and one for the close.
- If open >= close, the high will be 'sent' second and the low third
- If close > open, the low will be 'sent' second and the high third
  - Settings to change this will come later
- Dispatches matches and dones based off of user orders to better replicate actual behavior

# Example Code
```
const ApiSim = require('./gdax-sim/gdax-sim');//npm install coming soon
let gdax = new ApiSim(100, 0); //set base account values (fiat, crypto)
gdax.websocketClient.on('message', (data) => {
  //do stuff here
});
gdax.backtest(require('./gdax-sim/TestData/LTC/27Nov2018.json'));
console.log(gdax.user.fiatBalance, gdax.user.cryptoBalance);
```

# Unit Test
Done using a global install of mocha (fixing this to local latter)
```
gdax-sim> mocha
```

# Rules
Please do the best you can to avoid endless dependencies 
