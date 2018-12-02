const WebsocketSim = require('../Lib/WebsocketSim');
const assert = require('assert');

describe('#WebsocketSim', () => {
    describe('#init', () => {
        it('is a class', () => {
            let ws = new WebsocketSim();
            assert(ws !== undefined);
        });
    });
    describe('#disbatch', () => {
        it('calls the on message event when \'message\' is the type', (done) => {
            let ws = new WebsocketSim();
            ws.on('message', done);
            ws.disbatch('message', null);
        });
        it('calls the on error event when \'error\' is the type', (done) => {
            let ws = new WebsocketSim();
            ws.on('error', done);
            ws.disbatch('error', null);
        });
        it('calls the on open event when \'open\' is the type', (done) => {
            let ws = new WebsocketSim();
            ws.on('open', done);
            ws.disbatch('open', null);
        });
        it('calls the on close event when \'close\' is the type', (done) => {
            let ws = new WebsocketSim();
            ws.on('close', done);
            ws.disbatch('close', null);
        });
    });
    describe('#on', () => {
        it('sets the on message event when \'message\' is the type', (done) => {
            let ws = new WebsocketSim();
            ws.on('message', (data) => {
                done();
            });
            ws.message({});
        });
        it('sets the on error event when \'error\' is the type', (done) => {
            let ws = new WebsocketSim();
            ws.on('error', (data) => {
                done();
            });
            ws.error({});
        });
        it('sets the on open event when \'open\' is the type', (done) => {
            let ws = new WebsocketSim();
            ws.on('open', (data) => {
                done();
            });
            ws.open({});
        });
        it('sets the on close event when \'close\' is the type', (done) => {
            let ws = new WebsocketSim();
            ws.on('close', (data) => {
                done();
            });
            ws.close({});
        });
    });
});