/* AAB 안의 AndroidManifest.xml(aapt2 protobuf 형식) 해석. 49 playrelease/protoxml.py와 같은 규칙. */
(function (root) {
  'use strict';
  var core = (root.PR && root.PR.core) || require('./core.js');
  var ANDROID_NS = 'http://schemas.android.com/apk/res/android';

  function varint(b, p) {
    var result = 0, mul = 1, byte;
    do {
      if (p >= b.length) throw new Error('매니페스트가 중간에 끝났습니다');
      byte = b[p++];
      result += (byte & 0x7f) * mul;
      mul *= 128;
      if (mul > Math.pow(2, 70)) throw new Error('varint가 너무 깁니다');
    } while (byte & 0x80);
    return [result, p];
  }

  function fields(b) {
    var out = [], p = 0, r, key, wire, val;
    while (p < b.length) {
      r = varint(b, p); key = r[0]; p = r[1];
      wire = key % 8;
      var num = Math.floor(key / 8);
      if (wire === 0) { r = varint(b, p); val = r[0]; p = r[1]; }
      else if (wire === 1) { val = b.subarray(p, p + 8); p += 8; }
      else if (wire === 2) {
        r = varint(b, p); p = r[1];
        if (p + r[0] > b.length) throw new Error('매니페스트 길이가 맞지 않습니다');
        val = b.subarray(p, p + r[0]); p += r[0];
      } else if (wire === 5) { val = b.subarray(p, p + 4); p += 4; }
      else throw new Error('지원하지 않는 protobuf 형식 ' + wire);
      out.push([num, wire, val]);
    }
    return out;
  }

  function primitive(b) {
    var f = fields(b);
    for (var i = 0; i < f.length; i++) {
      if (f[i][1] !== 0) continue;
      var n = f[i][0], v = f[i][2];
      if (n === 6) return String(v >= Math.pow(2, 63) ? v - Math.pow(2, 64) : v);
      if (n === 7) return '0x' + v.toString(16);
      if (n === 8) return v ? 'true' : 'false';
    }
    return null;
  }

  function item(b) {
    var f = fields(b);
    for (var i = 0; i < f.length; i++) if (f[i][0] === 7 && f[i][1] === 2) return primitive(f[i][2]);
    return null;
  }

  function attribute(b) {
    var ns = '', name = '', value = null, compiled = null;
    fields(b).forEach(function (f) {
      if (f[1] !== 2) return;
      if (f[0] === 1) ns = core.text(f[2]);
      else if (f[0] === 2) name = core.text(f[2]);
      else if (f[0] === 3) value = core.text(f[2]);
      else if (f[0] === 6) compiled = item(f[2]);
    });
    var key = ns === ANDROID_NS ? 'android:' + name : name;
    return [key, value !== null && value !== '' ? value : (compiled || '')];
  }

  function element(b) {
    var el = { name: '', attrs: {}, children: [] };
    fields(b).forEach(function (f) {
      if (f[1] !== 2) return;
      if (f[0] === 3) el.name = core.text(f[2]);
      else if (f[0] === 4) { var a = attribute(f[2]); el.attrs[a[0]] = a[1]; }
      else if (f[0] === 5) { var c = node(f[2]); if (c) el.children.push(c); }
    });
    return el;
  }

  function node(b) {
    var f = fields(b);
    for (var i = 0; i < f.length; i++) if (f[i][0] === 1 && f[i][1] === 2) return element(f[i][2]);
    return null;
  }

  function findAll(el, name) {
    var out = [];
    el.children.forEach(function (c) {
      if (c.name === name) out.push(c);
      out.push.apply(out, findAll(c, name));
    });
    return out;
  }

  function parseManifest(bytes) {
    var root = node(bytes);
    if (!root || root.name !== 'manifest') throw new Error('AAB 매니페스트를 읽지 못했어요 (최상위가 manifest가 아님)');
    return root;
  }

  var api = { parseManifest: parseManifest, findAll: findAll };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.PR = root.PR || {})['protoxml'] = api;
})(typeof self !== 'undefined' ? self : this);
