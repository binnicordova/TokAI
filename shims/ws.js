// Minimal ws shim that adapts browser WebSocket to a subset of the 'ws' API
const EventEmitter = require('events');

class WSWrapper extends EventEmitter {
  constructor(url, protocols, options) {
    super();
    if (typeof globalThis.WebSocket === 'undefined') {
      throw new Error('No global WebSocket implementation found in this environment');
    }
    this._ws = new globalThis.WebSocket(url, protocols);
    this.readyState = this._ws.readyState;

    this._ws.addEventListener('open', (ev) => {
      this.readyState = this._ws.readyState;
      this.emit('open', ev);
    });
    this._ws.addEventListener('message', (ev) => {
      // align with ws: message event handler receives data as first arg
      const data = typeof ev.data === 'undefined' ? '' : ev.data;
      this.emit('message', data, ev);
    });
    this._ws.addEventListener('close', (ev) => {
      this.readyState = this._ws.readyState;
      this.emit('close', ev.code, ev.reason);
    });
    this._ws.addEventListener('error', (ev) => {
      this.emit('error', ev);
    });
  }

  send(data, cb) {
    try {
      this._ws.send(data);
      if (cb) cb();
    } catch (err) {
      if (cb) cb(err);
      else this.emit('error', err);
    }
  }

  close(code, reason) {
    this._ws.close(code, reason);
  }

  terminate() {
    // no direct equivalent; close immediately
    try {
      this._ws.close();
    } catch (e) {}
  }

  ping() {
    // no-op in browser
  }
}

module.exports = WSWrapper;
module.exports.WebSocket = WSWrapper;
module.exports.Server = class {
  constructor() {
    throw new Error('WebSocket.Server is not supported in React Native environment');
  }
};
