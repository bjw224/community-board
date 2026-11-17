// 보고 싶은 게시판 목록. 추가/삭제는 여기만 고치면 됩니다.
// type: clien = 클리앙 목록 HTML / rss = RSS 피드
// linkOnly: true → 수집하지 않고 화면에 바로가기 링크만 표시 (외부 서버 접근이 막힌 게시판)
// every: N → N번 실행에 한 번만 수집 (요청 수 제한이 있는 사이트용), offset으로 순번 분산
module.exports = [
  // 클리앙
  { id: 'clien-park',      site: '클리앙', name: '모두의공원',   type: 'clien', url: 'https://www.clien.net/service/board/park' },
  { id: 'clien-news',      site: '클리앙', name: '새로운소식',   type: 'clien', url: 'https://www.clien.net/service/board/news' },
  { id: 'clien-car',       site: '클리앙', name: '굴러간당',     type: 'clien', url: 'https://www.clien.net/service/board/cm_car' },
  { id: 'clien-iphone',    site: '클리앙', name: '아이포니앙',   type: 'clien', url: 'https://www.clien.net/service/board/cm_iphonien' },
  { id: 'clien-useful',    site: '클리앙', name: '유용한사이트', type: 'clien', url: 'https://www.clien.net/service/board/useful' },
  { id: 'clien-lecture',   site: '클리앙', name: '팁과강좌',     type: 'clien', url: 'https://www.clien.net/service/board/lecture' },
  { id: 'clien-use',       site: '클리앙', name: '사용기',       type: 'clien', url: 'https://www.clien.net/service/board/use' },

  // 뽐뿌
  { id: 'ppomppu-hot',     site: '뽐뿌', name: 'HOT게시글',  linkOnly: true, url: 'https://www.ppomppu.co.kr/hot.php' },
  { id: 'ppomppu-car',     site: '뽐뿌', name: '자동차포럼', type: 'rss', url: 'https://www.ppomppu.co.kr/rss.php?id=car' },
  { id: 'ppomppu-money',   site: '뽐뿌', name: '재테크포럼', type: 'rss', url: 'https://www.ppomppu.co.kr/rss.php?id=money' },
  { id: 'ppomppu-phone',   site: '뽐뿌', name: '휴대폰포럼', type: 'rss', url: 'https://www.ppomppu.co.kr/rss.php?id=phone' },

  // 다모앙 (RSS 요청 수 제한이 있어 글이 뜸한 게시판은 20분마다 번갈아 수집)
  // 굴러간당·애플모앙은 GitHub 서버 접근 시 403이라 링크만 표시
  { id: 'damoang-free',    site: '다모앙', name: '자유게시판', type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=free' },
  { id: 'damoang-new',     site: '다모앙', name: '새소식',     type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=new' },
  { id: 'damoang-review',  site: '다모앙', name: '사용기',     type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=tutorial', every: 2, offset: 0 },
  { id: 'damoang-lecture', site: '다모앙', name: '강좌/팁',    type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=lecture', every: 2, offset: 1 },
  { id: 'damoang-car',     site: '다모앙', name: '굴러간당',   linkOnly: true, url: 'https://damoang.net/car' },
  { id: 'damoang-apple',   site: '다모앙', name: '애플모앙',   linkOnly: true, url: 'https://damoang.net/applemoang' },
];
