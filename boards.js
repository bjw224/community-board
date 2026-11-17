// 보고 싶은 게시판 목록. 추가/삭제는 여기만 고치면 됩니다.
// type: clien = 클리앙 목록 HTML / rss = RSS 피드 / ppomppu_hot = 뽐뿌 HOT게시글 HTML
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
  { id: 'ppomppu-hot',     site: '뽐뿌', name: 'HOT게시글',  type: 'ppomppu_hot', url: 'https://www.ppomppu.co.kr/hot.php' },
  { id: 'ppomppu-car',     site: '뽐뿌', name: '자동차포럼', type: 'rss', url: 'https://www.ppomppu.co.kr/rss.php?id=car' },
  { id: 'ppomppu-money',   site: '뽐뿌', name: '재테크포럼', type: 'rss', url: 'https://www.ppomppu.co.kr/rss.php?id=money' },
  { id: 'ppomppu-phone',   site: '뽐뿌', name: '휴대폰포럼', type: 'rss', url: 'https://www.ppomppu.co.kr/rss.php?id=phone' },

  // 다모앙
  { id: 'damoang-free',    site: '다모앙', name: '자유게시판', type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=free' },
  { id: 'damoang-new',     site: '다모앙', name: '새소식',     type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=new' },
  { id: 'damoang-review',  site: '다모앙', name: '사용기',     type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=tutorial' },
  { id: 'damoang-lecture', site: '다모앙', name: '강좌/팁',    type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=lecture' },
  { id: 'damoang-car',     site: '다모앙', name: '굴러간당',   type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=car' },
  { id: 'damoang-apple',   site: '다모앙', name: '애플모앙',   type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=applemoang' },
];
