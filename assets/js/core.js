/* 공용 도우미. 모든 모듈은 브라우저(window.PR)와 Node 테스트(require) 양쪽에서 동작합니다. */
(function (root) {
  'use strict';

  var utf8 = new TextDecoder('utf-8');

  function text(bytes) {
    return utf8.decode(bytes);
  }

  function hex(bytes, sep) {
    var out = [];
    for (var i = 0; i < bytes.length; i++) out.push((bytes[i] < 16 ? '0' : '') + bytes[i].toString(16));
    return sep === undefined ? out.join('') : out.join(sep).toUpperCase();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var api = { text: text, hex: hex, escapeHtml: escapeHtml };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.PR = root.PR || {})['core'] = api;
})(typeof self !== 'undefined' ? self : this);
