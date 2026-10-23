/* 운영자(개인정보 보호책임자) 이름·문의 이메일 검사. 49 playrelease/operator.py와 같은 규칙 (오타 목록은 거기서 생성). */
(function (root) {
  'use strict';
  var EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;
  var DOMAIN_TYPOS = {
      "gmail.con": "gmail.com",
      "gmail.co": "gmail.com",
      "gmail.cm": "gmail.com",
      "gmail.om": "gmail.com",
      "gmial.com": "gmail.com",
      "gmai.com": "gmail.com",
      "gamil.com": "gmail.com",
      "gmali.com": "gmail.com",
      "gmail.net": "gmail.com",
      "gmaill.com": "gmail.com",
      "gmil.com": "gmail.com",
      "g-mail.com": "gmail.com",
      "naver.con": "naver.com",
      "naver.co": "naver.com",
      "naver.cm": "naver.com",
      "naver.net": "naver.com",
      "nave.com": "naver.com",
      "navr.com": "naver.com",
      "navar.com": "naver.com",
      "nvaer.com": "naver.com",
      "hanmail.ne": "hanmail.net",
      "hanmail.com": "hanmail.net",
      "hanmil.net": "hanmail.net",
      "daum.ne": "daum.net",
      "daum.com": "daum.net",
      "kakao.con": "kakao.com",
      "hotmial.com": "hotmail.com",
      "hotmail.con": "hotmail.com",
      "outlook.con": "outlook.com",
      "nate.con": "nate.com",
      "icloud.con": "icloud.com"
  };
  var PLACEHOLDER_NAMES = ["-", ".", "admin", "name", "test", "개발자", "개인정보 보호책임자", "관리자", "모름", "없음", "운영자", "운영자 이름", "이름", "책임자", "테스트", "홍길동"];
  var PLACEHOLDER_EMAIL_DOMAINS = ["aaa.com", "domain.com", "email.com", "example.com", "example.org", "test.com"];

  function validate(name, email, emailAgain, appName) {
    var out = [];
    var n = String(name || '').trim(), e = String(email || '').trim();
    function add(field, text) { out.push({ field: field, text: text }); }
    if (!n) add('name', '이름 칸이 비어 있어요. 앱을 만든 사람(나)의 이름을 적어 주세요. 예: 김민수');
    else {
      if (n.indexOf('@') >= 0) add('name', '이름 칸에 이메일을 적은 것 같아요. 이름 칸에는 사람 이름만 적어요. 예: 김민수');
      if (PLACEHOLDER_NAMES.indexOf(n.toLowerCase()) >= 0) add('name', "'" + n + "'은(는) 예시나 자리 표시 말이에요. 진짜 내 이름을 적어 주세요");
      if (appName && n.replace(/\s/g, '') === String(appName).replace(/\s/g, '')) add('name', '앱 이름을 적었어요. 앱 이름이 아니라, 앱을 만든 사람의 이름을 적어 주세요');
      if (/^\d+$/.test(n)) add('name', '숫자만 있어요. 사람 이름을 글자로 적어 주세요');
      if (n.length < 2) add('name', '이름이 너무 짧아요. 성과 이름을 함께 적어 주세요. 예: 김민수');
      if (n.length > 40) add('name', '이름이 너무 길어요 (40자 이하). 설명은 빼고 이름만 적어 주세요');
      if (/[<>{}\[\]]/.test(n)) add('name', '이름에 < > { } [ ] 같은 기호는 넣지 말아 주세요');
    }
    if (!e) { add('email', '이메일 칸이 비어 있어요. 내가 자주 확인하는 메일 주소를 적어 주세요. 예: minsu123@gmail.com'); return out; }
    if (/[ 　]/.test(e)) add('email', '이메일에 띄어쓰기가 있어요. 띄어쓰기 없이 붙여서 적어 주세요');
    if (/[^\x00-\x7f]/.test(e)) add('email', '이메일에 한글이나 특수 문자가 섞여 있어요. 영어·숫자·@·점(.)만 써요. 한/영 키를 확인해 주세요');
    var at = e.split('@').length - 1;
    if (at !== 1) add('email', '이메일에는 @가 꼭 하나 있어야 해요. 예: minsu123@gmail.com');
    else if (!EMAIL_RE.test(e)) add('email', "이메일 모양이 이상해요. '아이디@메일회사주소' 모양이어야 해요. 예: minsu123@gmail.com");
    else {
      var parts = e.split('@'), domain = parts[1].toLowerCase();
      if (DOMAIN_TYPOS[domain]) add('email', "'@" + domain + "'은(는) 오타 같아요. '" + parts[0] + '@' + DOMAIN_TYPOS[domain] + "' 아닌가요? 다시 확인해 주세요");
      if (PLACEHOLDER_EMAIL_DOMAINS.indexOf(domain) >= 0) add('email', "'" + domain + "'은(는) 예시용 주소예요. 내가 실제로 쓰는 메일 주소를 적어 주세요");
    }
    if (emailAgain !== undefined && emailAgain !== null && String(emailAgain).trim() !== e) add('email', '두 번 적은 이메일이 서로 달라요. 두 칸에 똑같이 적어 주세요 (오타를 막기 위해 두 번 받아요)');
    return out;
  }

  var api = { validate: validate };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.PR = root.PR || {})['operator'] = api;
})(typeof self !== 'undefined' ? self : this);
