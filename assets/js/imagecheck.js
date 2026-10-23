/* 스토어 그래픽·문구 규격 검사 (49 playrelease/store.py와 같은 규칙). 파일은 브라우저 안에서만 읽습니다. */
(function (root) {
  'use strict';
  var MB = 1024 * 1024;
  var TEXT_LIMITS = { title: 30, short: 80, full: 4000 };

  /** 머리 부분 바이트로 크기·형식·투명(알파) 여부 */
  function imageInfo(bytes, name) {
    var b = bytes;
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
      var w = (b[16] << 24 | b[17] << 16 | b[18] << 8 | b[19]) >>> 0;
      var h = (b[20] << 24 | b[21] << 16 | b[22] << 8 | b[23]) >>> 0;
      var color = b[25];
      var head = String.fromCharCode.apply(null, b.subarray(0, Math.min(b.length, 4096)));
      return { name: name, width: w, height: h, fmt: 'png', alpha: color === 4 || color === 6 || head.indexOf('tRNS') >= 0, size: b.length };
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
      var p = 2;
      while (p < b.length - 9) {
        if (b[p] !== 0xff) { p++; continue; }
        var m = b[p + 1];
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].indexOf(m) >= 0) {
          return { name: name, width: b[p + 7] << 8 | b[p + 8], height: b[p + 5] << 8 | b[p + 6], fmt: 'jpeg', alpha: false, size: b.length };
        }
        p += 2 + (b[p + 2] << 8 | b[p + 3]);
      }
      throw new Error(name + ': JPEG 크기를 읽지 못했어요');
    }
    throw new Error(name + ': PNG나 JPEG가 아니에요');
  }

  function r(id, title, status, detail) { return { id: id, title: title, status: status, detail: detail }; }

  function checkIcon(im) {
    var t = '앱 아이콘';
    if (!im) return r('icon', t, 'fail', '512×512 PNG 파일을 골라 주세요');
    if (im.width !== 512 || im.height !== 512 || im.fmt !== 'png') return r('icon', t, 'fail', im.name + ': ' + im.width + '×' + im.height + ' ' + im.fmt + ' — 512×512 PNG여야 해요');
    if (im.size > MB) return r('icon', t, 'fail', im.name + ': 1MB 이하여야 해요');
    if (!im.alpha) return r('icon', t, 'warn', im.name + ': 투명(알파) 정보가 없는 PNG예요. Play 안내는 32비트 PNG(알파 포함)라서, 거절되면 RGBA로 다시 저장하세요');
    return r('icon', t, 'pass', im.name + ' 512×512');
  }

  function checkFeature(im) {
    var t = '그래픽 이미지';
    if (!im) return r('feature', t, 'fail', '1024×500 PNG 또는 JPEG 파일을 골라 주세요');
    if (im.width !== 1024 || im.height !== 500) return r('feature', t, 'fail', im.name + ': ' + im.width + '×' + im.height + ' — 1024×500이어야 해요');
    if (im.alpha) return r('feature', t, 'fail', im.name + ': 투명한 부분이 없어야 해요 (JPEG 또는 24비트 PNG)');
    if (im.size > 15 * MB) return r('feature', t, 'fail', im.name + ': 15MB 이하여야 해요');
    return r('feature', t, 'pass', im.name + ' 1024×500');
  }

  function checkPhones(list) {
    var t = '휴대폰 스크린샷';
    var problems = [];
    list.forEach(function (im) {
      var lo = Math.min(im.width, im.height), hi = Math.max(im.width, im.height);
      if (lo < 320 || hi > 3840) problems.push(im.name + ' 크기 ' + im.width + '×' + im.height + ' (한 변 320~3840px)');
      else if (hi > 2 * lo) problems.push(im.name + ' 비율 (긴 변이 짧은 변의 2배 이하)');
      else if (im.alpha) problems.push(im.name + ' 투명(알파) 포함');
      else if (im.size > 8 * MB) problems.push(im.name + ' 8MB 초과');
    });
    if (problems.length) return r('phones', t, 'fail', problems.join('; '));
    if (list.length < 2 || list.length > 8) return r('phones', t, 'fail', list.length + '장 — 2~8장이어야 해요');
    var minSide = Math.min.apply(null, list.map(function (i) { return Math.min(i.width, i.height); }));
    if (list.length < 4 || minSide < 1080) return r('phones', t, 'warn', list.length + '장 — 추천 영역에 노출되려면 1080px 이상 4장 이상을 권장해요');
    return r('phones', t, 'pass', list.length + '장');
  }

  function checkText(kind, value) {
    var names = { title: '앱 이름', short: '짧은 설명', full: '자세한 설명' };
    var limit = TEXT_LIMITS[kind], len = Array.from(String(value || '').trim()).length;
    if (!len) return r(kind, names[kind], 'fail', '비어 있어요');
    if (len > limit) return r(kind, names[kind], 'fail', len + '자 — ' + limit + '자 이하여야 해요');
    return r(kind, names[kind], 'pass', len + '/' + limit + '자');
  }

  var api = { imageInfo: imageInfo, checkIcon: checkIcon, checkFeature: checkFeature, checkPhones: checkPhones, checkText: checkText, TEXT_LIMITS: TEXT_LIMITS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.PR = root.PR || {})['imagecheck'] = api;
})(typeof self !== 'undefined' ? self : this);
