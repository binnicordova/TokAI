// Minimal shim for Node's 'tls' used by some server-side libraries.
// In React Native/browser environment we don't support TLS sockets.
// Export a stub that throws when server APIs are used, but provides
// placeholders for small lookups to avoid bundler errors.

module.exports = {
  // createSecureContext is sometimes called; return a dummy object
  createSecureContext: function () { return {}; },
  // Server/client sockets are not supported in RN; throw if used
  Server: function() { throw new Error('tls.Server is not supported in React Native'); },
  TLSSocket: function() { throw new Error('tls.TLSSocket is not supported in React Native'); },
  // Expose constants if code checks them
  DEFAULT_MIN_VERSION: undefined,
  DEFAULT_MAX_VERSION: undefined,
};
