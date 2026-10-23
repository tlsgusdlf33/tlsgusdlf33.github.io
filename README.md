# tlsgusdlf33.github.io — 앱 개발자 웹사이트

Google Play 스토어 등록정보의 "개발자 웹사이트"와 개인정보처리방침 주소로 쓰는 공개 사이트입니다.

| 파일 | 주소 | 쓰는 곳 |
|---|---|---|
| `index.html` | https://tlsgusdlf33.github.io/ | 개발자 웹사이트 (앱 목록) |
| `app-ads.txt` | https://tlsgusdlf33.github.io/app-ads.txt | AdMob 앱 소유 확인. 모든 앱이 같은 게시자 ID라 파일 하나로 충분 |
| `jumalnadeuli-privacy.html` | https://tlsgusdlf33.github.io/jumalnadeuli-privacy.html | 주말나들이 개인정보처리방침, 계정 삭제 URL(`#delete`) |

- 원본: 주말나들이 파일은 A9 저장소 `docs/github-site/`. 방침을 고치면 앱 안 방침(A9 `android/app/src/main/assets/www/app.js`)과 시행일을 함께 맞추세요.
- 새 앱을 추가하면 `앱이름-privacy.html`을 올리고 `index.html` 목록에 한 줄 추가합니다.
- 49번 출시 파이프라인의 `playrelease launch`가 이 주소들이 열리는지, app-ads.txt에 게시자 ID가 있는지 확인합니다.
