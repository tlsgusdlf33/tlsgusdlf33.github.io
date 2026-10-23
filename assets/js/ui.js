/* 화면 공용 도우미. 사용자·파일에서 온 값은 textContent로만 넣습니다 (innerHTML 금지). */
(function (root) {
  'use strict';
  var ICON = { pass: '✓', warn: '!', fail: '✕', skip: '–' };
  var WORD = { pass: '통과', warn: '확인 필요', fail: '고쳐야 함', skip: '건너뜀' };

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }

  function renderChecks(container, checks) {
    container.textContent = '';
    var fails = checks.filter(function (c) { return c.status === 'fail'; }).length;
    var warns = checks.filter(function (c) { return c.status === 'warn'; }).length;
    var summary = fails ? '고쳐야 할 항목 ' + fails + '개' + (warns ? ', 확인할 항목 ' + warns + '개' : '')
      : warns ? '막히는 것은 없어요. 확인할 항목 ' + warns + '개' : '모두 통과했어요';
    container.appendChild(el('p', { class: 'summary', role: 'status', text: (fails ? '✕ ' : '✓ ') + summary }));
    var ul = el('ul', { class: 'results' });
    checks.forEach(function (c) {
      ul.appendChild(el('li', { class: c.status }, [
        el('span', { class: 'icon', 'aria-hidden': 'true', text: ICON[c.status] }),
        el('strong', { text: c.title }),
        el('span', { class: 'muted', text: ' · ' + WORD[c.status] }),
        el('span', { class: 'detail', text: c.detail }),
      ]));
    });
    container.appendChild(ul);
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error('파일을 읽지 못했어요: ' + file.name)); };
      r.readAsArrayBuffer(file);
    });
  }

  function download(filename, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type || 'text/plain;charset=utf-8' }));
    var a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function copy(text, button) {
    function done(ok) {
      if (!button) return;
      var old = button.textContent;
      button.textContent = ok ? '복사했어요' : '복사 실패 — 직접 선택해 복사하세요';
      setTimeout(function () { button.textContent = old; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    else done(false);
  }

  function fieldErrors(form, problems, map) {
    form.querySelectorAll('.field-error').forEach(function (n) { n.remove(); });
    problems.forEach(function (p) {
      var input = form.querySelector(map[p.field] || '');
      var target = input ? input.closest('label') || input : form;
      target.after(el('p', { class: 'field-error', role: 'alert', text: p.text }));
    });
  }

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  root.PR = root.PR || {};
  root.PR.ui = { el: el, renderChecks: renderChecks, readFile: readFile, download: download, copy: copy, fieldErrors: fieldErrors, onReady: onReady };
})(self);
