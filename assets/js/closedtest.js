/* 비공개 테스트 12명·14일 계산과 테스터 안내문 (49 playrelease/testers.py와 같은 계산). */
(function (root) {
  'use strict';

  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }

  function iso(d) { return d.toISOString().slice(0, 10); }

  /** started: 'YYYY-MM-DD' (12명이 참여한 날), today: Date */
  function report(started, testers, today, requiredTesters, requiredDays) {
    requiredTesters = requiredTesters || 12;
    requiredDays = requiredDays || 14;
    var s = parseDate(started);
    if (!s) return { ok: false, error: '시작일을 YYYY-MM-DD 모양으로 적어 주세요 (예: 2026-10-20)' };
    var t = today || new Date();
    var todayUtc = new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()));
    var day = todayUtc >= s ? Math.floor((todayUtc - s) / 86400000) + 1 : 0;
    var eligible = new Date(s.getTime() + requiredDays * 86400000);
    var n = parseInt(testers, 10) || 0;
    return {
      ok: true,
      day: day,
      shownDay: Math.min(day, requiredDays),
      requiredDays: requiredDays,
      eligibleOn: iso(eligible),
      daysLeft: Math.max(0, Math.round((eligible - todayUtc) / 86400000)),
      testers: n,
      requiredTesters: requiredTesters,
      shortBy: Math.max(0, requiredTesters - n),
      ready: day > requiredDays && n >= requiredTesters,
      started: iso(s),
    };
  }

  function invite(appName, groupUrl, optInUrl) {
    var app = String(appName || '').trim() || '제 앱';
    return [
      '[' + app + ' 테스트 부탁드려요 🙏]',
      '제가 만든 앱을 플레이스토어에 올리려면 14일 동안 12명 이상이 테스트해야 해요.',
      '안드로이드 폰만 가능해요 (아이폰은 안 돼요).',
      '',
      '1) 이 그룹에 가입: ' + (String(groupUrl || '').trim() || '(구글 그룹 주소)'),
      '2) 참여 링크에서 \'테스터 되기\': ' + (String(optInUrl || '').trim() || '(Play Console 참여 링크)'),
      '3) 플레이스토어에서 \'' + app + '\' 설치',
      '4) 14일 동안 지우지 말고, 가끔 한두 번 열어 봐 주세요',
      '5) 불편한 점이나 바랐던 기능을 편하게 알려 주세요',
      '',
      '광고는 테스트용이라 \'Test Ad\'로 보여요. 고맙습니다!',
    ].join('\n');
  }

  var api = { report: report, invite: invite };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.PR = root.PR || {})['closedtest'] = api;
})(typeof self !== 'undefined' ? self : this);
