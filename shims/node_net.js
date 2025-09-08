// Minimal net shim for environments without Node 'net'
const EventEmitter = require('events');

class Socket extends EventEmitter {
  constructor() {
    super();
    this.destroyed = false;
  }
  write() { throw new Error('net.Socket.write not supported in RN'); }
  end() { this.destroyed = true; }
  destroy() { this.destroyed = true; }
}

class Server extends EventEmitter {
  constructor() { super(); throw new Error('net.Server not supported in RN'); }
}

module.exports = { Socket, Server };
