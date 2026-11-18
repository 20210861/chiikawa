# 캐릭터 이미지 넣는 곳

아래 이름으로 파일을 넣으면 기본 캐릭터(보리) 대신 그 이미지가 나와요.
GIF / PNG / WebP 모두 되지만, 확장자가 다르면 `js/app.js`의 `CONFIG.images` 경로도 같이 바꿔 주세요.

| 파일 | 언제 나오나 |
|---|---|
| `idle.gif` | 처음 화면, 손을 뗐을 때 |
| `drinking.gif` | 꾹 누르는 동안 (꿀꺽꿀꺽) |
| `finish.gif` | 다 마시고 "프하~!" 할 때 |

- 일부만 넣어도 돼요. 없는 장면은 `idle` 이미지로 대신 보여줘요.
- 정사각형에 가까운 투명 배경 이미지가 가장 자연스러워요.
- **액자 모드**(기본 켜짐): 이미지를 하나라도 넣으면 둥근 액자에 담아 보여줘요. 배경 있는 사각 GIF(Tenor 등)에 잘 맞아요.
  - 맥주잔은 액자 오른쪽 아래에서 '남은 맥주' 게이지로 바뀌어요. 필요 없으면 `CONFIG.showMug: false`
  - 액자 위 라벨 문구는 `CONFIG.frameLabel`로 바꾸거나 `''`로 숨겨요.
  - 배경이 투명한 캐릭터 이미지라면 `CONFIG.imageFrame: false`로 끄면 캐릭터가 바닥에 서 있는 모습으로 나와요.
- 마시는 장면과 "프하" 장면이 한 GIF에 이어져 있으면 ffmpeg로 나눠요(프레임 번호는 GIF에 맞게):
  ```bash
  ffmpeg -i 원본.gif -vf "select='lt(n,8)',setpts=N/FRAME_RATE/TB" -loop 0 drinking.gif
  ffmpeg -i 원본.gif -vf "select='gte(n,8)',setpts=N/FRAME_RATE/TB" -loop 0 finish.gif
  ```
- ⚠️ 공식 캐릭터 이미지는 저작권이 있어요. 혼자 보거나 친구끼리 보내는 용도로만 쓰고,
  공개 저장소에 올리거나 상업적으로 쓰지 않는 걸 추천해요. (이 폴더를 `.gitignore`에 넣어 둬도 좋아요.)
