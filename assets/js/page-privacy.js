/* 개인정보처리방침·app-ads.txt 만들기 화면. 운영자 이름·이메일이 바르게 입력되어야 만들 수 있어요. */
(function (root) {
  'use strict';
  var PR = root.PR, ui = PR.ui;

  ui.onReady(function () {
    var form = document.getElementById('pp-form');
    var out = document.getElementById('pp-result');
    var dateInput = form.querySelector('[name=date]');
    if (!dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
    var map = { app: '[name=appName]', name: '[name=operatorName]', email: '[name=operatorEmail]', date: '[name=date]' };

    function values() {
      var f = new FormData(form);
      return {
        appName: f.get('appName'), operatorName: f.get('operatorName'), operatorEmail: f.get('operatorEmail'),
        operatorEmailAgain: f.get('operatorEmailAgain'), date: f.get('date'), storage: f.get('storage'),
        kakao: f.get('kakao') === 'on', google: f.get('google') === 'on', admob: f.get('admob') === 'on',
        firebase: f.get('firebase') === 'on', location: f.get('location'), camera: f.get('camera') === 'on',
        notifications: f.get('notifications') === 'on',
      };
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      out.textContent = '';
      var v = values();
      var res = PR.privacy.generate(v);
      ui.fieldErrors(form, res.problems, map);
      if (res.problems.length) {
        out.appendChild(ui.el('p', { class: 'field-error', role: 'alert', text: '위의 빨간 안내를 고친 뒤 다시 눌러 주세요. 몇 번이든 괜찮아요.' }));
        var first = form.querySelector(map[res.problems[0].field] || '');
        if (first) { first.focus(); first.scrollIntoView({ block: 'center' }); }
        return;
      }
      var slug = (v.appName.trim().replace(/[^0-9A-Za-z가-힣]+/g, '-').replace(/^-|-$/g, '') || 'app') + '-privacy.html';
      var frame = ui.el('iframe', { class: 'preview', title: '개인정보처리방침 미리보기', sandbox: '' });
      frame.srcdoc = res.html;
      var dl = ui.el('button', { type: 'button', text: '파일 받기 (' + slug + ')' });
      dl.addEventListener('click', function () { ui.download(slug, res.html, 'text/html;charset=utf-8'); });
      var cp = ui.el('button', { type: 'button', class: 'secondary', text: 'HTML 복사' });
      cp.addEventListener('click', function () { ui.copy(res.html, cp); });
      out.appendChild(ui.el('h3', { text: '미리보기' }));
      out.appendChild(frame);
      out.appendChild(ui.el('div', {}, [dl, cp]));
      out.appendChild(ui.el('p', { class: 'muted', text: '받은 파일을 공개 웹 주소(예: 계정이름.github.io)에 올리고, 그 주소를 Play Console > 앱 콘텐츠 > 개인정보처리방침에 적으세요.' }));
    });

    var adsForm = document.getElementById('ads-form');
    var adsOut = document.getElementById('ads-result');
    adsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      adsOut.textContent = '';
      var r = PR.privacy.appAdsTxt(new FormData(adsForm).get('publisher'));
      if (r.error) { adsOut.appendChild(ui.el('p', { class: 'field-error', role: 'alert', text: r.error })); return; }
      var dl = ui.el('button', { type: 'button', text: 'app-ads.txt 받기' });
      dl.addEventListener('click', function () { ui.download('app-ads.txt', r.text); });
      adsOut.appendChild(ui.el('pre', { text: r.text }));
      adsOut.appendChild(dl);
    });
  });
})(self);
