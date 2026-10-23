# tlsgusdlf33.github.io — 앱 출시 도우미 + 앱 개발자 웹사이트

GitHub Pages로 제공되는 공개 사이트입니다.

| 내용 | 어디서 만들어지나 |
|---|---|
| 무료 웹 도구·가이드 (`index.html`, `tools/`, `guides/`, `privacy/`, `about/`, `assets/`, `sitemap.xml`, `robots.txt`, `ads.txt`) | 49 저장소 `web/`에서 빌드해 배포 (`site-deploy.yml`). **이 저장소에서 직접 고치지 마세요** — 다음 배포 때 덮어써집니다 |
| `app-ads.txt` | AdMob 앱 소유 확인. 모든 앱이 같은 게시자 ID라 파일 하나 |
| `jumalnadeuli-privacy.html` | 주말나들이 개인정보처리방침. 원본은 A9 `docs/github-site/` (운영자 정보 입력 워크플로가 반영) |

- 새 앱을 추가하면 `앱이름-privacy.html`을 올리고, 49 `web/site.config.json`의 `apps` 목록에 한 줄 추가합니다.
