/* AdSense 광고 단위 채우기. 광고 자리는 버튼·파일 선택 칸과 떨어진 곳(.ad-box)에만 둡니다. */
(function (root) {
  'use strict';
  function start() {
    var boxes = document.querySelectorAll('ins.adsbygoogle');
    if (!boxes.length) return;
    root.adsbygoogle = root.adsbygoogle || [];
    for (var i = 0; i < boxes.length; i++) {
      try { root.adsbygoogle.push({}); } catch (e) { /* 광고 차단기 등: 무시 */ }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(self);
