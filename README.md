# gdax-sim

Simulator used to help unit test and back test various Coinbase-Pro (gdax) interactions.

#Backtest
Reads data from saved candle objects and spits out matches 4 matches, one for open, one for the high, one for the low, and one for the close.

- If open >= close, the high will be 'sent' second and the low third
- If close > open, the low will be 'sent' second and the high third
- Settings to change this will come later
