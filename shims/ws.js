// Minimal ws shim that adapts browser WebSocket to a subset of the 'ws' API
const EventEmitter = require('events');

class WSWrapper extends EventEmitter {
  constructor(url, protocols, options) {
    super();

    // Handle (url, options) signature
    if (typeof protocols === 'object' && protocols !== null && !Array.isArray(protocols)) {
        options = protocols;
        protocols = undefined;
    }

    if (typeof globalThis.WebSocket === 'undefined') {
      throw new Error('No global WebSocket implementation found in this environment');
    }
    console.log('WSWrapper constructor', url, protocols, options);
    this._ws = new globalThis.WebSocket(url, protocols, options);
    console.log('WSWrapper _ws created', this._ws);
    this.readyState = this._ws.readyState;
    console.log('WSWrapper readyState', this.readyState);

    this._ws.addEventListener('open', (ev) => {
      this.readyState = this._ws.readyState;
      console.log('WSWrapper open event, readyState:', this.readyState);
      this.emit('open', ev);
    });
    this._ws.addEventListener('message', (ev) => {
      // align with ws: message event handler receives data as first arg
      const data = typeof ev.data === 'undefined' ? '' : ev.data;
      console.log('WSWrapper message event', data);
      this.emit('message', data, ev);
    });
    this._ws.addEventListener('close', (ev) => {
      this.readyState = this._ws.readyState;
      console.log('WSWrapper close event, readyState:', this.readyState, 'code:', ev.code, 'reason:', ev.reason);
      this.emit('close', ev.code, ev.reason);
    });
    this._ws.addEventListener('error', (ev) => {
      console.log('WSWrapper error event', ev);
      this.emit('error', ev);
    });
  }

  send(data, cb) {
    console.log('WSWrapper send', data);
    try {
      this._ws.send(data);
      if (cb) cb();
    } catch (err) {
      if (cb) cb(err);
      else this.emit('error', err);
    }
  }

  close(code, reason) {
    console.log('WSWrapper close', code, reason);
    this._ws.close(code, reason);
  }

  terminate() {
    // no direct equivalent; close immediately
    console.log('WSWrapper terminate');
    try {
      this._ws.close();
    } catch (e) {}
  }

  ping() {
    console.log('WSWrapper ping - no-op in browser');
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
