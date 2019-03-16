class UserAccountSim {
    constructor() {
        this.fiatBalance = 0;
        this.cryptoBalance = 0;
        this.holds = {
            crypto: 0,
            fiat: 0
        }
        this.limitOrders = {
            openSells: [],
            openBuys: []
        }
        this.marketOrders = {
            openSells: [],
            openBuys: []
        }
        this.orders = [];
        this.marketOrders.openBuys = this.orders;
        this.marketOrders.openSells = this.orders;
    }

}

module.exports = UserAccountSim;