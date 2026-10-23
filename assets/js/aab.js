/* AAB 파일 정보 꺼내기 (49 playrelease/aab.py와 같은 규칙). 파일은 브라우저 안에서만 읽습니다. */
(function (root) {
  'use strict';
  var PR = root.PR || {};
  var core = PR.core || require('./core.js');
  var zip = PR.zip || require('./zip.js');
  var protoxml = PR.protoxml || require('./protoxml.js');
  var der = PR.der || require('./der.js');

  var TEST_PUBLISHER = '3940256099942544';
  var PLACEHOLDER_PUBLISHER = '0000000000000000'; // 광고 SDK 안의 자리표시자
  var AD_ID_RE = /ca-app-pub-(\d{16})([~/])(\d{10})/g;
  var ADMOB_META = 'com.google.android.gms.ads.APPLICATION_ID';
  var SCAN_LIMIT = 64 * 1024 * 1024;

  function int(v) {
    if (v === undefined || v === null || v === '') return null;
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  function latin1(bytes) {
    // 광고 ID는 ASCII라서 바이트를 그대로 글자로 바꿔 검색 (UTF-8 해석보다 빠르고 깨지지 않음)
    var s = '';
    for (var i = 0; i < bytes.length; i += 65536) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 65536));
    return s;
  }

  async function sha256Hex(bytes, sep) {
    var d = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    return core.hex(d, sep);
  }

  /** @param {ArrayBuffer} buf  @param {(msg:string)=>void} [progress] */
  async function readBundle(buf, progress) {
    progress = progress || function () {};
    var list = zip.entries(buf);
    var byName = {};
    list.forEach(function (e) { byName[e.name] = e; });
    var mEntry = byName['base/manifest/AndroidManifest.xml'];
    if (!mEntry) throw new Error('AAB 파일이 아니에요. APK가 아니라 bundleRelease로 만든 .aab 파일을 넣어 주세요');

    progress('매니페스트 읽는 중…');
    var manifest = protoxml.parseManifest(await zip.read(buf, mEntry));
    var app = protoxml.findAll(manifest, 'application')[0];
    var sdk = protoxml.findAll(manifest, 'uses-sdk')[0];
    var perms = {};
    ['uses-permission', 'uses-permission-sdk-23'].forEach(function (tag) {
      protoxml.findAll(manifest, tag).forEach(function (p) {
        var n = p.attrs['android:name'];
        if (n) perms[n] = true;
      });
    });
    var adAppId = null;
    if (app) protoxml.findAll(app, 'meta-data').forEach(function (m) {
      if (m.attrs['android:name'] === ADMOB_META) adAppId = m.attrs['android:value'] || null;
    });

    progress('광고 ID 찾는 중…');
    var found = {};
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.name.slice(-1) === '/' || e.name.indexOf('META-INF/') === 0 || e.size > SCAN_LIMIT) continue;
      var data = await zip.read(buf, e);
      var s = latin1(data), m;
      AD_ID_RE.lastIndex = 0;
      while ((m = AD_ID_RE.exec(s))) {
        if (m[1] === PLACEHOLDER_PUBLISHER) continue;
        var key = m[0] + '|' + e.name;
        if (!found[key]) found[key] = { value: m[0], publisher: m[1], kind: m[2] === '~' ? 'app' : 'unit', where: e.name, isTest: m[1] === TEST_PUBLISHER };
      }
    }
    var adIds = Object.keys(found).sort().map(function (k) { return found[k]; });

    progress('서명 확인 중…');
    var signer = null, subject = null;
    var sigs = list.filter(function (e) { return /^META-INF\/[^/]+\.(RSA|EC|DSA)$/i.test(e.name); })
      .sort(function (a, b) { return a.name < b.name ? -1 : 1; });
    if (sigs.length) {
      var c = der.firstCertificate(await zip.read(buf, sigs[0]));
      if (c) {
        signer = await sha256Hex(c.cert, ':');
        subject = c.subjectCN;
      }
    }

    return {
      size: buf.byteLength,
      fileSha256: await sha256Hex(new Uint8Array(buf)),
      package: manifest.attrs['package'] || '',
      versionCode: int(manifest.attrs['android:versionCode']),
      versionName: manifest.attrs['android:versionName'] || '',
      minSdk: sdk ? int(sdk.attrs['android:minSdkVersion']) : null,
      targetSdk: sdk ? int(sdk.attrs['android:targetSdkVersion']) : null,
      debuggable: !!(app && app.attrs['android:debuggable'] === 'true'),
      permissions: Object.keys(perms).sort(),
      manifestAdAppId: adAppId,
      adIds: adIds,
      signerSha256: signer,
      signerCN: subject,
    };
  }

  var api = { readBundle: readBundle, TEST_PUBLISHER: TEST_PUBLISHER };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.PR = root.PR || {})['aab'] = api;
})(typeof self !== 'undefined' ? self : this);
