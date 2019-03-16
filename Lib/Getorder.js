module.exports = function (orderId, callback) {
    let data = [];

    let limitBuyIndex = this.user.limitOrders.openBuys.map((e) => {
        return e.id;
    }).indexOf(orderId);

    data = this.user.limitOrders.openBuys[limitBuyIndex];

    if (limitBuyIndex === -1) {
        let marketOrderIndex = this.user.orders.map((e) => {
            return e.id;
        }).indexOf(orderId);

        data = this.user.orders[marketOrderIndex];
    }
    callback(null, null, data);
}