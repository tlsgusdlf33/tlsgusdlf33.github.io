/* 앱 개인정보처리방침·app-ads.txt 만들기. 입력값은 모두 HTML 이스케이프해서 넣습니다.
   결과는 일반적인 앱을 위한 초안이며, 앱이 실제로 하는 일과 다르면 반드시 고쳐야 합니다. */
(function (root) {
  'use strict';
  var PR = root.PR || {};
  var core = PR.core || require('./core.js');
  var operator = PR.operator || require('./operator.js');
  var esc = core.escapeHtml;

  function koDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? (+m[1]) + '년 ' + (+m[2]) + '월 ' + (+m[3]) + '일' : '';
  }

  function li(items) { return '<ul>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }

  /**
   * o: { appName, operatorName, operatorEmail, operatorEmailAgain, date(YYYY-MM-DD), storage: 'device'|'server',
   *      kakao, google, admob, firebase, location: 'none'|'coarse'|'fine', camera, notifications }
   */
  function generate(o) {
    var problems = [];
    var app = String(o.appName || '').trim();
    if (!app) problems.push({ field: 'app', text: '앱 이름을 적어 주세요' });
    if (app.length > 50) problems.push({ field: 'app', text: '앱 이름이 너무 길어요 (50자 이하)' });
    problems = problems.concat(operator.validate(o.operatorName, o.operatorEmail, o.operatorEmailAgain, app));
    var date = koDate(o.date);
    if (!date) problems.push({ field: 'date', text: '시행일을 골라 주세요' });
    if (problems.length) return { problems: problems, html: '' };

    var A = esc(app), N = esc(String(o.operatorName).trim()), E = esc(String(o.operatorEmail).trim());
    var server = o.storage === 'server';
    var login = o.kakao || o.google;
    var sec = [];

    // 1. 항목과 목적
    var items = [];
    if (o.kakao) items.push('<strong>카카오 로그인</strong>: 카카오 회원번호, 닉네임 — 로그인과 이용자 구분');
    if (o.google) items.push('<strong>Google 로그인</strong>: Google 계정 고유 ID, 이름 — 로그인과 이용자 구분');
    if (o.location === 'fine') items.push('<strong>정확한 위치</strong>: 위치 기반 기능 제공 (이용자가 허용한 경우에만)');
    if (o.location === 'coarse') items.push('<strong>대략적 위치</strong>: 가까운 정보 추천 (이용자가 허용한 경우에만)');
    if (o.camera) items.push('<strong>사진·카메라</strong>: 이용자가 직접 고르거나 찍은 사진을 앱 기능에 사용 (이용자가 허용한 경우에만)');
    items.push('<strong>앱 안에서 입력한 설정</strong>: 앱 기능 제공');
    sec.push('<h2 id="items">1. 처리하는 개인정보와 목적</h2>' + li(items) +
      '<p>' + (server
        ? '이 정보는 앱 운영자의 서버에 저장되며, 위 목적 외에는 쓰지 않습니다.'
        : '이 정보는 <strong>이용자 기기 안에만</strong> 저장하고, 앱 운영자의 서버로 보내지 않습니다.') + '</p>' +
      (login ? '<p>로그인하지 않고 쓸 수 있는 기능은 아무 정보도 저장하지 않습니다.</p>' : ''));

    // 2. 보유 기간과 파기, 계정 삭제
    sec.push('<h2 id="delete">2. 보유 기간, 파기, 계정·데이터 삭제</h2>' +
      (server
        ? '<p>개인정보는 회원 탈퇴 또는 삭제 요청 시 지체 없이 파기합니다. 법령에 따라 보관해야 하는 정보는 그 기간 동안만 보관한 뒤 파기합니다.</p>'
        : '<p>앱 운영자 서버에는 이용자 정보가 없습니다. 앱을 삭제하면 기기에 저장된 정보가 모두 지워집니다.</p>') +
      '<div class="box"><p><strong>계정과 데이터 삭제 방법</strong></p>' +
      li([
        login ? '앱의 계정(설정) 화면에서 <strong>계정 연결 해제 · 데이터 삭제</strong>를 누르면 저장된 정보가 지워집니다.' : '앱을 삭제하면 기기에 저장된 정보가 지워집니다.',
        '앱을 쓸 수 없는 경우 아래 문의 이메일로 삭제를 요청하면 지체 없이 처리합니다.',
      ].concat(o.google ? ['Google 계정과 앱의 연결은 Google 계정 설정(myaccount.google.com → 보안 → 서드 파티 앱 및 서비스)에서도 끊을 수 있습니다.'] : [])) + '</div>');

    // 3. 외부 서비스
    var ext = [];
    if (o.admob) ext.push('<strong>Google AdMob(광고)</strong>: Google은 광고 제공·측정·부정 방지를 위해 광고 ID, IP 주소, 기기·앱 정보, 광고 상호작용 정보를 수집·이용할 수 있습니다. <a href="https://policies.google.com/technologies/partner-sites">파트너 데이터 사용 안내</a>');
    if (o.firebase) ext.push('<strong>Google Firebase(분석·오류 보고)</strong>: 앱 이용 통계와 비정상 종료 정보를 수집해 앱 개선에 씁니다.');
    if (o.kakao) ext.push('<strong>카카오</strong>: 로그인 과정의 정보 처리는 카카오 개인정보처리방침을 따릅니다.');
    if (o.google) ext.push('<strong>Google</strong>: 로그인 과정의 정보 처리는 Google 개인정보처리방침을 따릅니다.');
    sec.push('<h2 id="third">3. 제3자 제공과 외부 서비스</h2>' +
      '<p>앱은 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다.' + (ext.length ? ' 다만 아래 서비스가 그 서비스의 방침에 따라 정보를 처리합니다.' : '') + '</p>' +
      (ext.length ? li(ext) : ''));

    // 4. 자동 수집, 광고
    var auto = [];
    if (o.admob) auto.push('맞춤 광고는 휴대폰 설정(Google → 광고)에서 광고 ID를 재설정하거나 삭제해 끌 수 있습니다. 유럽경제지역·영국·스위스 이용자는 앱의 동의 메시지에서 선택을 바꿀 수 있습니다.');
    if (o.notifications) auto.push('알림은 앱 설정이나 휴대폰 설정에서 언제든 끌 수 있습니다.');
    if (o.location !== 'none' && o.location) auto.push('위치 권한은 휴대폰 설정에서 언제든 거부하거나 다시 허용할 수 있습니다.');
    if (auto.length) sec.push('<h2 id="auto">4. 광고·권한 선택</h2>' + li(auto));

    // 5~9
    sec.push('<h2 id="rights">' + (auto.length ? 5 : 4) + '. 이용자의 권리</h2><p>이용자는 개인정보 열람, 정정, 삭제, 처리정지를 요구할 수 있으며, 아래 연락처로 요청하면 지체 없이 처리합니다.</p>');
    var n = auto.length ? 6 : 5;
    sec.push('<h2 id="security">' + n + '. 안전성 확보 조치</h2><p>' +
      (server ? '접근 권한 관리, 전송 구간 암호화(HTTPS), 접속 기록 보관 등 개인정보 보호를 위한 조치를 합니다.'
        : '정보를 기기 밖으로 보내지 않고, 앱이 외부와 통신할 때는 암호화된 연결(HTTPS)만 씁니다.') + '</p>');
    sec.push('<h2 id="children">' + (n + 1) + '. 아동의 개인정보</h2><p>앱은 만 14세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 일부러 수집하지 않습니다.</p>');
    sec.push('<h2 id="contact">' + (n + 2) + '. 개인정보 보호책임자와 문의</h2><div class="box">' +
      '<p>이름: <span data-operator="name">' + N + '</span></p>' +
      '<p>이메일: <a data-operator="email" href="mailto:' + E + '">' + E + '</a></p></div>' +
      '<p>개인정보 침해 신고·상담: 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118), 개인정보분쟁조정위원회(kopico.go.kr, 1833-6972)</p>');
    sec.push('<p class="foot">이 방침은 ' + date + '부터 적용됩니다. 내용이 바뀌면 이 페이지에 알리고 시행일을 바꿉니다.</p>');

    var html = '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + A + ' 개인정보처리방침</title>\n<style>\n' +
      ':root{color-scheme:light dark;--bg:#fff;--fg:#1f2328;--muted:#59636e;--line:#d1d9e0;--box:#f6f8fa}\n' +
      '@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--muted:#9198a1;--line:#3d444d;--box:#161b22}}\n' +
      'body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.7 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}\n' +
      'main{max-width:720px;margin:0 auto;padding:32px 16px}h1{font-size:1.6rem}h2{font-size:1.15rem;margin-top:2rem}\n' +
      '.box{background:var(--box);border:1px solid var(--line);border-radius:8px;padding:4px 16px}.foot{color:var(--muted);margin-top:2rem}\n' +
      '</style>\n</head>\n<body>\n<main>\n<h1>' + A + ' 개인정보처리방침</h1>\n' +
      '<p>' + A + '(이하 "앱")는 「개인정보 보호법」에 따라 이용자의 개인정보를 보호하기 위해 다음과 같이 개인정보처리방침을 둡니다.</p>\n' +
      sec.join('\n') + '\n</main>\n</body>\n</html>\n';
    return { problems: [], html: html };
  }

  function appAdsTxt(publisherId) {
    var id = String(publisherId || '').trim().replace(/^ca-app-/, '');
    if (!/^pub-\d{16}$/.test(id)) return { error: "게시자 ID는 'pub-' 다음에 숫자 16자리예요. AdMob > 설정 > 계정 정보에서 복사하세요 (예: pub-1234567890123456)" };
    return { text: 'google.com, ' + id + ', DIRECT, f08c47fec0942fa0\n' };
  }

  var api = { generate: generate, appAdsTxt: appAdsTxt };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.PR = root.PR || {})['privacy'] = api;
})(typeof self !== 'undefined' ? self : this);
