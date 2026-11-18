# 🍺 한 잔 준비했대…

꾹 누르면 캐릭터가 맥주를 꿀꺽꿀꺽 마시고, 다 마시면 **탕! → 프하~!! → 트림 방울 → 펑!** 하고 메시지가 튀어나오는 메시지 카드예요.

- 서버·DB 없음: 메시지는 링크의 `#c=...` 부분에 Base64로 들어가요.
- 효과음 파일 없음: Web Audio로 꿀꺽/탕/트림/뽁 소리를 직접 합성해요.
- 빌드 없음: `index.html`, `css/style.css`, `js/app.js`가 전부예요.

## 실행해 보기
```bash
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000
```
`#` 없이 들어가면 메시지 작성 화면, 만든 링크로 들어가면 받는 사람 화면이에요.

## 내 캐릭터로 바꾸기
- **링크로**: `js/app.js`의 `CONFIG.clips`에 mp4 링크와 구간(start/end)을 적어요. 저장소에 파일을 넣지 않아도 돼요.
- **파일로**: `assets/character/`에 `idle.gif`, `drinking.gif`, `finish.gif`를 넣으면 돼요. 자세한 건 [assets/character/README.md](assets/character/README.md) 참고.

## 커스터마이징
`js/app.js` 맨 위의 `CONFIG`에서 바꿀 수 있어요.
- `drinkDuration`: 다 마시는 데 걸리는 시간
- `captions`: 단계별 대사 (꿀꺽… / 벌컥벌컥!! / 크으~~ 이 맛이지!! …)
- `title`: 상단 제목

## 배포
GitHub에 올린 뒤 Vercel이나 Netlify에서 이 저장소를 그대로 연결하면 돼요(빌드 설정 없음). GitHub Pages도 돼요.
