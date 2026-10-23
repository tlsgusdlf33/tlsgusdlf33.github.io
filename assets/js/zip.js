/* ZIP(AAB) 읽기: 중앙 디렉터리를 읽고, 필요한 파일만 브라우저 기본 기능(DecompressionStream)으로 풉니다. */
(function (root) {
  'use strict';
  var core = (root.PR && root.PR.core) || require('./core.js');

  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + b[o + 3] * 16777216; }

  function entries(buf) {
    var b = new Uint8Array(buf);
    var end = -1;
    for (var i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
      if (b[i] === 0x50 && b[i + 1] === 0x4b && b[i + 2] === 0x05 && b[i + 3] === 0x06) { end = i; break; }
    }
    if (end < 0) throw new Error('ZIP 파일이 아닙니다 (AAB는 ZIP 형식이어야 해요)');
    var count = u16(b, end + 10);
    var cdOffset = u32(b, end + 16);
    if (count === 0xffff || cdOffset === 0xffffffff) throw new Error('4GB가 넘는 ZIP(ZIP64)은 지원하지 않아요');
    var list = [];
    var p = cdOffset;
    for (var n = 0; n < count; n++) {
      if (u32(b, p) !== 0x02014b50) throw new Error('ZIP 목록이 손상되었습니다');
      var method = u16(b, p + 10);
      var csize = u32(b, p + 20);
      var size = u32(b, p + 24);
      var nameLen = u16(b, p + 28);
      var extraLen = u16(b, p + 30);
      var commentLen = u16(b, p + 32);
      var local = u32(b, p + 42);
      var name = core.text(b.subarray(p + 46, p + 46 + nameLen));
      list.push({ name: name, method: method, compressedSize: csize, size: size, localOffset: local });
      p += 46 + nameLen + extraLen + commentLen;
    }
    return list;
  }

  async function inflateRaw(data) {
    var ds = new DecompressionStream('deflate-raw');
    var stream = new Blob([data]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function read(buf, entry) {
    var b = new Uint8Array(buf);
    var o = entry.localOffset;
    if (u32(b, o) !== 0x04034b50) throw new Error('ZIP 항목이 손상되었습니다: ' + entry.name);
    var start = o + 30 + u16(b, o + 26) + u16(b, o + 28);
    var data = b.subarray(start, start + entry.compressedSize);
    if (entry.method === 0) return data;
    if (entry.method === 8) return inflateRaw(data);
    throw new Error('지원하지 않는 압축 방식(' + entry.method + '): ' + entry.name);
  }

  var api = { entries: entries, read: read };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.PR = root.PR || {})['zip'] = api;
})(typeof self !== 'undefined' ? self : this);
