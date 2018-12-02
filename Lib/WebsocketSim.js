class WebsocketSim {
    constructor() {}

    on(type, func) {
        if (type === 'message') {
            this.message = func;
        } else if (type === 'error') {
            this.error = func;
        } else if (type === 'close') {
            this.close = func;
        } else if (type === 'open') {
            this.open = func;
        }
    }

    disbatch(type, data) {
        if (type === 'message') {
            this.message(data);
        } else if (type === 'error') {
            this.error(data);
        } else if (type === 'close') {
            this.close(data);
        } else if (type === 'open') {
            this.open(data);
        }
    }

    open() {}

    message() {}

    error() {}

    close() {}

}

module.exports = WebsocketSim;