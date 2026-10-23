/* jarsigner 서명(PKCS#7)에서 첫 인증서와 이름(CN)을 꺼냅니다. 필요한 부분만 읽는 최소 DER 해석기. */
(function (root) {
  'use strict';
  var core = (root.PR && root.PR.core) || require('./core.js');

  function tlv(b, p) {
    var tag = b[p], len = b[p + 1], hdr = 2;
    if (len & 0x80) {
      var n = len & 0x7f;
      if (n < 1 || n > 4) throw new Error('서명 형식을 읽지 못했어요');
      len = 0;
      for (var i = 0; i < n; i++) len = len * 256 + b[p + 2 + i];
      hdr = 2 + n;
    }
    if (p + hdr + len > b.length) throw new Error('서명 데이터 길이가 맞지 않아요');
    return { tag: tag, start: p, body: p + hdr, end: p + hdr + len };
  }

  function children(b, t) {
    var out = [], p = t.body;
    while (p < t.end) { var c = tlv(b, p); out.push(c); p = c.end; }
    return out;
  }

  var CN_OID = [0x06, 0x03, 0x55, 0x04, 0x03];

  function commonName(b, name) {
    // Name = SEQUENCE OF SET OF SEQUENCE { OID, value }
    var sets = children(b, name);
    for (var i = 0; i < sets.length; i++) {
      var atvs = children(b, sets[i]);
      for (var j = 0; j < atvs.length; j++) {
        var parts = children(b, atvs[j]);
        if (parts.length < 2) continue;
        var oid = b.subarray(parts[0].start, parts[0].end);
        if (oid.length === 5 && CN_OID.every(function (v, k) { return oid[k] === v; })) {
          return core.text(b.subarray(parts[1].body, parts[1].end));
        }
      }
    }
    return '';
  }

  /** PKCS#7 SignedData → { cert: Uint8Array(DER), subjectCN } */
  function firstCertificate(bytes) {
    var b = bytes;
    var ci = tlv(b, 0); // ContentInfo
    var ciParts = children(b, ci);
    var explicit = ciParts[1]; // [0] EXPLICIT
    if (!explicit || explicit.tag !== 0xa0) throw new Error('PKCS#7 서명이 아닙니다');
    var sd = tlv(b, explicit.body); // SignedData
    var parts = children(b, sd);
    var certs = parts.filter(function (t) { return t.tag === 0xa0; })[0]; // [0] IMPLICIT certificates
    if (!certs) return null;
    var cert = children(b, certs)[0];
    if (!cert) return null;
    var tbs = children(b, cert)[0];
    var f = children(b, tbs);
    var k = f[0].tag === 0xa0 ? 1 : 0; // version 생략 가능
    var subject = f[k + 4]; // serial, sigAlg, issuer, validity, subject
    return { cert: b.subarray(cert.start, cert.end), subjectCN: subject ? commonName(b, subject) : '' };
  }

  var api = { firstCertificate: firstCertificate };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.PR = root.PR || {})['der'] = api;
})(typeof self !== 'undefined' ? self : this);
