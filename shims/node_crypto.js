// Lazy wrapper for crypto to avoid executing crypto-browserify at module-evaluation time
// Ensures global Buffer is present and provides fallbacks for common methods used by ws and other libs.
function ensureGlobals() {
  try {
    if (typeof global.Buffer === 'undefined') {
      // attempt to set Buffer from buffer package
      global.Buffer = require('buffer').Buffer;
    }
  } catch (e) {
    // ignore
  }

  try {
    if (typeof global.crypto === 'undefined') {
      if (typeof window !== 'undefined' && window.crypto) global.crypto = window.crypto;
      else if (typeof self !== 'undefined' && self.crypto) global.crypto = self.crypto;
    }
  } catch (e) {
    // ignore
  }
}

let _impl = null;
function loadImpl() {
  if (_impl) return _impl;
  ensureGlobals();
  try {
    _impl = require('crypto-browserify');
    return _impl;
  } catch (err) {
    // fallback: provide minimal implementations for things commonly used
    const fallback = {};
    try {
      // try to load create-hash/create-hmac if available
      const createHash = require('create-hash');
      fallback.createHash = (alg) => createHash(alg);
    } catch (e) {
      fallback.createHash = function () {
        throw new Error('createHash not available in this environment');
      };
    }

    try {
      const createHmac = require('create-hmac');
      fallback.createHmac = (alg, key) => createHmac(alg, key);
    } catch (e) {
      fallback.createHmac = function () {
        throw new Error('createHmac not available in this environment');
      };
    }

    // Minimal randomBytes implementation using global.crypto.getRandomValues if available
    fallback.randomBytes = function (size, cb) {
      if (typeof size !== 'number') {
        throw new TypeError('size must be a number');
      }
      if (!global.crypto || typeof global.crypto.getRandomValues !== 'function') {
        const err = new Error('secure random not available');
        if (typeof cb === 'function') return cb(err);
        throw err;
      }
      const arr = new Uint8Array(size);
      global.crypto.getRandomValues(arr);
      const buf = Buffer.from(arr);
      if (typeof cb === 'function') return cb(null, buf);
      return buf;
    };

    // Expose randomFill / randomFillSync as no-ops erroring if used
    fallback.randomFill = function () { throw new Error('randomFill not available'); };
    fallback.randomFillSync = function () { throw new Error('randomFillSync not available'); };

    _impl = fallback;
    return _impl;
  }
}

const handler = {
  get(_, prop) {
    const impl = loadImpl();
    return impl[prop];
  },
  apply(_, thisArg, args) {
    const impl = loadImpl();
    return impl.apply(thisArg, args);
  }
};

module.exports = new Proxy({}, handler);
module.exports.createHash = function (alg) { return loadImpl().createHash(alg); };
module.exports.createHmac = function (alg, key) { return loadImpl().createHmac(alg, key); };
module.exports.randomBytes = function (size, cb) { return loadImpl().randomBytes(size, cb); };
