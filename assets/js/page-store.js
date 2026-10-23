/* 스토어 그래픽·문구 검사 화면 */
(function (root) {
  'use strict';
  var PR = root.PR, ui = PR.ui, ic = PR.imagecheck;

  ui.onReady(function () {
    var out = document.getElementById('store-result');
    var state = { icon: null, feature: null, phones: [] };

    async function info(file) {
      // 크기·형식은 머리 부분에 있어서 앞부분만 읽어도 되지만, 파일 크기 검사를 위해 전체 크기는 따로 씀
      var head = new Uint8Array(await ui.readFile(file.slice(0, 256 * 1024)));
      var im = ic.imageInfo(head, file.name);
      im.size = file.size;
      return im;
    }

    function render() {
      var checks = [
        ic.checkText('title', document.getElementById('t-title').value),
        ic.checkText('short', document.getElementById('t-short').value),
        ic.checkText('full', document.getElementById('t-full').value),
        ic.checkIcon(state.icon), ic.checkFeature(state.feature), ic.checkPhones(state.phones),
      ];
      ui.renderChecks(out, checks);
    }

    function counter(id, limit) {
      var input = document.getElementById(id), label = document.getElementById(id + '-count');
      input.addEventListener('input', function () {
        var n = Array.from(input.value.trim()).length;
        label.textContent = n + ' / ' + limit + '자';
        label.className = n > limit ? 'field-error' : 'hint';
        render();
      });
    }
    counter('t-title', 30);
    counter('t-short', 80);
    counter('t-full', 4000);

    function bind(id, key, many) {
      document.getElementById(id).addEventListener('change', async function (e) {
        var files = Array.from(e.target.files || []);
        try {
          var list = await Promise.all(files.map(info));
          state[key] = many ? list : (list[0] || null);
        } catch (err) {
          state[key] = many ? [] : null;
          ui.renderChecks(out, [{ title: '파일', status: 'fail', detail: err.message }]);
          return;
        }
        render();
      });
    }
    bind('f-icon', 'icon');
    bind('f-feature', 'feature');
    bind('f-phones', 'phones', true);
    render();
  });
})(self);
