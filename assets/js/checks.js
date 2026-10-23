/* 출시 전 실수 방지 검사 (49 playrelease/checks.py와 같은 규칙). */
(function (root) {
  'use strict';
  var PR = root.PR || {};
  var policy = PR.policy || require('./policy.js');

  var PASS = 'pass', WARN = 'warn', FAIL = 'fail', SKIP = 'skip';

  function check(id, title, status, detail) { return { id: id, title: title, status: status, detail: detail || '' }; }

  function normFp(v) {
    var h = String(v || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    return h.match(/.{1,2}/g) ? h.match(/.{1,2}/g).join(':') : '';
  }

  function uniq(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }).sort(); }

  function adsCheck(b, opt) {
    var rule = opt.track === 'production' ? 'real' : 'test';
    var title = '광고 ID (' + (rule === 'test' ? '테스트 트랙: 구글 테스트 ID만' : '프로덕션: 실제 ID만') + ')';
    var tests = b.adIds.filter(function (a) { return a.isTest; });
    var reals = b.adIds.filter(function (a) { return !a.isTest; });
    if (opt.noAds) {
      if (b.adIds.length) return check('ads', '광고 ID', WARN, '광고 없는 앱이라고 했는데 광고 ID가 ' + uniq(b.adIds.map(function (a) { return a.value; })).length + '개 들어 있어요');
      return check('ads', '광고 ID', SKIP, '광고 없는 앱');
    }
    if (!b.adIds.length) return check('ads', title, WARN, 'AAB에서 AdMob 광고 ID를 찾지 못했어요 (광고를 안 쓰면 무시)');
    if (rule === 'test') {
      if (reals.length) return check('ads', title, FAIL, '테스트 트랙에 실제 광고 ID가 들어 있어요: ' + uniq(reals.map(function (a) { return a.value; })).join(', ') + '. 나나 테스터가 실제 광고를 누르면 AdMob 계정이 정지될 수 있어요');
      return check('ads', title, PASS, '구글 테스트 ID ' + uniq(b.adIds.map(function (a) { return a.value; })).length + '개');
    }
    var problems = [];
    if (tests.length) problems.push('테스트 광고 ID가 남아 있음 (' + uniq(tests.map(function (a) { return a.value; })).join(', ') + ')');
    var appId = b.manifestAdAppId || '';
    if (!appId) problems.push('매니페스트에 AdMob 앱 ID가 없음');
    if (!reals.some(function (a) { return a.kind === 'unit'; })) problems.push('실제 광고 단위 ID(…/…)가 없음');
    var pubs = uniq(reals.map(function (a) { return a.publisher; }));
    if (pubs.length > 1) problems.push('게시자 ID가 여러 개 섞여 있음: ' + pubs.join(', '));
    var wantPub = String(opt.publisherId || '').replace(/^(ca-app-)?pub-/, '').trim();
    if (wantPub && pubs.length && (pubs.length !== 1 || pubs[0] !== wantPub)) problems.push('게시자 ID가 pub-' + wantPub + '이(가) 아님');
    if (opt.adAppId && appId && appId !== opt.adAppId.trim()) problems.push('앱 ID ' + appId + '이(가) 이 앱 것이 아님 — 다른 앱의 ID를 넣은 것 같아요');
    if (problems.length) return check('ads', title, FAIL, problems.join('; '));
    return check('ads', title, PASS, '실제 ID (앱 ' + appId + ')');
  }

  /**
   * @param b readBundle 결과
   * @param opt { track: 'test'|'production', package, uploadSha256, playMaxVersionCode, publisherId, adAppId, noAds, today }
   */
  function runAll(b, opt) {
    opt = opt || {};
    var out = [];
    if (opt.package) {
      out.push(b.package === opt.package.trim()
        ? check('package', '패키지 이름', PASS, b.package)
        : check('package', '패키지 이름', FAIL, 'AAB는 ' + b.package + ', 기대한 값은 ' + opt.package.trim() + (b.package.slice(-6) === '.debug' ? ' (디버그 빌드를 올리려는 것 같아요)' : '')));
    } else if (b.package.slice(-6) === '.debug') {
      out.push(check('package', '패키지 이름', FAIL, b.package + ' — 디버그 빌드(.debug)는 출시용이 아니에요'));
    } else {
      out.push(check('package', '패키지 이름', PASS, b.package));
    }

    out.push(b.debuggable
      ? check('debuggable', '릴리스 빌드', FAIL, 'android:debuggable=true — 디버그 빌드는 Play에 올릴 수 없어요')
      : check('debuggable', '릴리스 빌드', PASS, '디버그 아님'));

    if (!b.signerSha256) out.push(check('signing', '업로드 키 서명', FAIL, '서명되지 않았어요. 출시용 업로드 키로 서명해 주세요'));
    else if (/Android Debug/i.test(b.signerCN || '')) out.push(check('signing', '업로드 키 서명', FAIL, '디버그 키로 서명됨 — 출시용 업로드 키로 서명해야 해요'));
    else if (!opt.uploadSha256) out.push(check('signing', '업로드 키 서명', PASS, '서명됨 (SHA-256 ' + b.signerSha256.slice(0, 23) + '…). Play Console > 앱 무결성의 업로드 키와 같은지 비교해 보세요'));
    else if (normFp(opt.uploadSha256) === b.signerSha256) out.push(check('signing', '업로드 키 서명', PASS, '적어 준 업로드 키와 같아요'));
    else out.push(check('signing', '업로드 키 서명', FAIL, '업로드 키가 달라요. AAB ' + b.signerSha256.slice(0, 23) + '…, 적어 준 값 ' + normFp(opt.uploadSha256).slice(0, 23) + '…'));

    var top = opt.playMaxVersionCode === '' || opt.playMaxVersionCode === undefined || opt.playMaxVersionCode === null ? null : parseInt(opt.playMaxVersionCode, 10);
    if (b.versionCode === null) out.push(check('version_code', 'versionCode', FAIL, 'versionCode를 읽지 못했어요'));
    else if (top === null || isNaN(top)) out.push(check('version_code', 'versionCode', SKIP, b.versionCode + ' (Play에 올라간 가장 큰 번호를 적으면 중복도 검사해요)'));
    else if (b.versionCode <= top) out.push(check('version_code', 'versionCode', FAIL, b.versionCode + '은(는) 이미 쓴 번호이거나 더 작아요. ' + (top + 1) + ' 이상으로 올려 다시 빌드하세요 ("버전 코드가 이미 사용됨" 오류 예방)'));
    else out.push(check('version_code', 'versionCode', PASS, b.versionCode + ' (Play 최고값 ' + top + ')'));

    out.push(adsCheck(b, opt));

    var need = policy.requiredTargetSdk(opt.today);
    if (b.targetSdk === null) out.push(check('target_sdk', 'targetSdk 정책', WARN, 'targetSdk를 읽지 못했어요'));
    else if (need && b.targetSdk < need) out.push(check('target_sdk', 'targetSdk 정책', WARN, 'targetSdk ' + b.targetSdk + ' < 요구 ' + need + '. Play가 업로드를 거부할 수 있어요'));
    else out.push(check('target_sdk', 'targetSdk 정책', PASS, 'targetSdk ' + b.targetSdk + (need ? ' (요구 ' + need + ' 이상)' : '')));

    var flagged = b.permissions.map(function (p) { var n = policy.permissionNote(p); return n ? p.split('.').pop() + ': ' + n : null; }).filter(Boolean);
    out.push(flagged.length
      ? check('permissions', '신고가 필요한 권한', WARN, flagged.join(' / '))
      : check('permissions', '신고가 필요한 권한', PASS, '권한 ' + b.permissions.length + '개, 특별 신고 대상 없음'));

    var mb = b.size / 1024 / 1024;
    out.push(b.size > 150 * 1024 * 1024
      ? check('size', '파일 크기', WARN, mb.toFixed(1) + 'MB — 200MB 한도에 가까워요')
      : check('size', '파일 크기', PASS, mb.toFixed(1) + 'MB'));
    return out;
  }

  var api = { runAll: runAll, PASS: PASS, WARN: WARN, FAIL: FAIL, SKIP: SKIP };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.PR = root.PR || {})['checks'] = api;
})(typeof self !== 'undefined' ? self : this);
