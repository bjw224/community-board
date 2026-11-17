# 커뮤니티 모아보기

클리앙·뽐뿌·다모앙의 지정 게시판 글 목록을 한 화면에서 보는 개인용 페이지.
서버 없이 **GitHub Actions(10분마다 수집) + GitHub Pages(화면)** 로 무료 운영.

```
GitHub Actions (10분 주기)
  └ collect.js : 게시판 목록/RSS 가져오기 → 이전 데이터와 병합 → data.json
  └ gh-pages 브랜치에 index.html + data.json 배포 (매번 커밋 1개로 덮어씀)
GitHub Pages
  └ index.html : data.json 읽어서 게시판 선택·검색·시간순 목록 표시
```

## 설정 (최초 1회, 10분 정도)

1. GitHub에서 새 저장소 생성 (예: `community-board`, **Public**)
   - 무료 계정은 Public 저장소만 Pages 사용 가능
2. 이 폴더 내용을 그대로 push
   ```bash
   git init && git add . && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<아이디>/community-board.git
   git push -u origin main
   ```
3. push하면 Actions가 자동으로 1회 실행됨 → **Actions 탭**에서 초록 체크 확인
   - 실행 안 되면: Actions 탭 → `collect` → **Run workflow**
4. 저장소 **Settings → Pages**
   - Source: `Deploy from a branch`
   - Branch: `gh-pages` / `/ (root)` → Save
5. 1~2분 뒤 `https://<아이디>.github.io/community-board/` 접속

## 게시판 추가/삭제

`boards.js`만 수정 후 push.
- RSS가 있는 사이트(뽐뿌 포럼, 다모앙 등 그누보드 계열)는 `type: 'rss'`로 RSS 주소만 넣으면 됨
  - 뽐뿌: `https://www.ppomppu.co.kr/rss.php?id=<게시판id>`
  - 다모앙: `https://damoang.net/bbs/rss.php?bo_table=<게시판id>`
- 클리앙은 `type: 'clien'`에 게시판 주소 (`/service/board/<id>`)

## 로컬 실행

```bash
npm install
npm test                 # 파서 테스트
npm run collect          # web/data.json 생성
npx serve web            # http://localhost:3000
```

## 알아둘 점

- **수집 실패 게시판**은 왼쪽 목록에 ⚠ 표시 (마우스 올리면 사유). 실패해도 이전에 모은 글은 유지됨
- GitHub Actions 서버는 **해외 IP**라 사이트가 해외 접속을 막으면 해당 게시판이 실패할 수 있음
  → 이 경우 집/회사 PC에서 `npm run collect`로 돌리거나 국내 리전 무료 서버(Oracle Cloud 춘천/서울)로 옮겨야 함
- 스케줄 실행은 GitHub 사정으로 **수 분~수십 분 지연**될 수 있음
- 뽐뿌 포럼·다모앙은 RSS가 **최근 15~20건만** 제공 → 글이 아주 빠른 게시판(다모앙 자유게시판 등)은 수집 지연 시 일부 누락 가능
- 다모앙 RSS는 작성자 정보가 없어 작성자 칸이 비어 있음
- Public 저장소 스케줄은 **60일간 저장소 활동이 없으면 GitHub가 자동 중지**할 수 있음 → 경고 메일이 오면 Actions 탭에서 다시 Enable
- 사이트 HTML 구조가 바뀌면 클리앙 파서(`parsers.js`) 수정 필요
- 다모앙 RSS는 요청 수 제한이 있어 12초 간격으로 요청하고, 글이 뜸한 게시판(사용기·강좌/팁·굴러간당·애플모앙)은 20분마다 번갈아 수집
- 뽐뿌 HOT게시글(hot.php)은 GitHub 서버 접속을 차단(403)해서 제외
- 개인 열람용. 제목·링크만 가져오며 본문은 수집하지 않음
