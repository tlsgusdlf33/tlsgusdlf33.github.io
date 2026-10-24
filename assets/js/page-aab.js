/* AAB 출시 전 검사기 화면 */
(function (root) {
  'use strict';
  var PR = root.PR, ui = PR.ui;

  ui.onReady(function () {
    var drop = document.getElementById('drop');
    var input = document.getElementById('aab-file');
    var form = document.getElementById('aab-form');
    var out = document.getElementById('aab-result');
    var info = document.getElementById('aab-info');
    var status = document.getElementById('aab-status');
    var current = null;

    function options() {
      var f = new FormData(form);
      return {
        track: f.get('track'),
        package: (f.get('package') || '').trim(),
        playMaxVersionCode: (f.get('playMax') || '').trim(),
        uploadSha256: (f.get('upload') || '').trim(),
        publisherId: (f.get('publisher') || '').trim(),
        adAppId: (f.get('adAppId') || '').trim(),
        noAds: f.get('noAds') === 'on',
      };
    }

    function showInfo(b) {
      info.textContent = '';
      var rows = [
        ['패키지 이름', b.package], ['versionCode', String(b.versionCode)], ['versionName', b.versionName],
        ['minSdk / targetSdk', b.minSdk + ' / ' + b.targetSdk], ['서명 이름(CN)', b.signerCN || '없음'],
        ['업로드 키 SHA-256', b.signerSha256 || '없음'], ['권한', b.permissions.length + '개: ' + b.permissions.map(function (p) { return p.split('.').pop(); }).join(', ')],
        ['광고 ID', b.adIds.length ? b.adIds.map(function (a) { return a.value + (a.isTest ? ' (테스트)' : ' (실제)'); }).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).join(', ') : '없음'],
        ['파일 SHA-256', b.fileSha256],
      ];
      var table = ui.el('table', {}, rows.map(function (r) { return ui.el('tr', {}, [ui.el('th', { text: r[0] }), ui.el('td', { text: r[1] })]); }));
      info.appendChild(ui.el('h3', { text: '파일 정보' }));
      info.appendChild(ui.el('div', { class: 'table-scroll' }, [table]));
    }

    function evaluate() {
      if (!current) return;
      ui.renderChecks(out, PR.checks.runAll(current, options()));
    }

    async function handle(file) {
      if (!file) return;
      out.textContent = '';
      info.textContent = '';
      // 휴대폰 파일 선택 창은 .aab 형식을 몰라 accept로 거르면 아예 못 고르는 경우가 있어, 여기서 확인
      if (/\.apk$/i.test(file.name)) {
        status.textContent = 'APK 파일이에요. Play에 올리는 건 AAB예요 (./gradlew bundleRelease → app-release.aab).';
        return;
      }
      status.textContent = file.name + ' 읽는 중…';
      try {
        var buf = await ui.readFile(file);
        current = await PR.aab.readBundle(buf, function (m) { status.textContent = m; });
        status.textContent = file.name + ' (' + (file.size / 1024 / 1024).toFixed(1) + 'MB) 검사 완료 — 파일은 이 기기 밖으로 나가지 않았어요';
        showInfo(current);
        evaluate();
      } catch (e) {
        current = null;
        status.textContent = '검사하지 못했어요: ' + e.message;
      }
    }

    input.addEventListener('change', function () { handle(input.files[0]); });
    form.addEventListener('submit', function (e) { e.preventDefault(); evaluate(); });
    form.addEventListener('input', evaluate);
    form.addEventListener('change', evaluate);
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { handle(e.dataTransfer.files[0]); });
  });
})(self);
