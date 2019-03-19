module.exports = function (orderId, callback) {
    let data = [];

    let limitBuyIndex = this.user.limitOrders.openBuys.map((e) => {
        return e.id;
    }).indexOf(orderId);

    let limitSellIndex = this.user.limitOrders.openSells.map((e) => {
        return e.id;
    }).indexOf(orderId);

    if (limitBuyIndex !== -1) {
        data = this.user.limitOrders.openBuys[limitBuyIndex];
    } else if (limitSellIndex !== -1) {
        data = this.user.limitOrders.openSells[limitSellIndex];
    } else {
        let marketOrderIndex = this.user.orders.map((e) => {
            return e.id;
        }).indexOf(orderId);

        data = this.user.orders[marketOrderIndex];
    }
    callback(null, null, data);
}