/* 12명·14일 계산기 화면 */
(function (root) {
  'use strict';
  var PR = root.PR, ui = PR.ui;

  ui.onReady(function () {
    var form = document.getElementById('ct-form');
    var out = document.getElementById('ct-result');
    var start = form.querySelector('[name=started]');
    if (!start.value) start.value = new Date().toISOString().slice(0, 10);

    function calc() {
      var f = new FormData(form);
      out.textContent = '';
      var r = PR.closedtest.report(f.get('started'), f.get('testers'), new Date());
      if (!r.ok) { out.appendChild(ui.el('p', { class: 'field-error', text: r.error })); return; }
      var bar = '■'.repeat(r.shownDay) + '□'.repeat(r.requiredDays - r.shownDay);
      var lines = [
        ui.el('p', { class: 'summary', role: 'status', text: r.ready ? '✓ 프로덕션 액세스를 신청할 수 있어요' : '오늘은 ' + r.shownDay + '/' + r.requiredDays + '일째예요' }),
        ui.el('p', { class: 'progress-bar', 'aria-hidden': 'true', text: bar }),
        ui.el('p', { text: '신청 가능한 날: ' + r.eligibleOn + (r.daysLeft ? ' (앞으로 ' + r.daysLeft + '일)' : '') }),
        ui.el('p', { class: r.shortBy ? 'field-error' : '', text: '테스터 ' + r.testers + '/' + r.requiredTesters + '명' + (r.shortBy ? ' — ' + r.shortBy + '명 더 필요해요' : ' — 충분해요') }),
        ui.el('p', { class: 'muted', text: '중간에 참여 인원이 12명 아래로 떨어지면 14일을 처음부터 다시 센다는 보고가 많아요. 15~20명을 모아 두면 안전해요.' }),
      ];
      lines.forEach(function (n) { out.appendChild(n); });
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); calc(); });
    form.addEventListener('input', calc);
    calc();

    var inv = document.getElementById('inv-form');
    var invOut = document.getElementById('inv-text');
    var copyBtn = document.getElementById('inv-copy');
    function invite() {
      var f = new FormData(inv);
      invOut.textContent = PR.closedtest.invite(f.get('app'), f.get('group'), f.get('optin'));
    }
    inv.addEventListener('submit', function (e) { e.preventDefault(); invite(); });
    inv.addEventListener('input', invite);
    copyBtn.addEventListener('click', function () { ui.copy(invOut.textContent, copyBtn); });
    invite();
  });
})(self);
