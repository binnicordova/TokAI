const { Buffer } = require('buffer');

function randomBytes(size, cb) {
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }

  if (!global.crypto || typeof global.crypto.getRandomValues !== 'function') {
    const err = new Error('global.crypto.getRandomValues is not available. Make sure react-native-get-random-values is imported.');
    if (typeof cb === 'function') return cb(err);
    throw err;
  }

  const arr = new Uint8Array(size);
  global.crypto.getRandomValues(arr);
  const buf = Buffer.from(arr);
  if (typeof cb === 'function') return cb(null, buf);
  return buf;
}

module.exports = randomBytes;
module.exports.randomBytes = randomBytes;
module.exports.rng = randomBytes;
module.exports.pseudoRandomBytes = randomBytes;
module.exports.prng = randomBytes;
