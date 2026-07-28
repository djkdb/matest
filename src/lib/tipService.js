// 커뮤니티 꿀팁 수집 서비스.
//
// 지금은 번들에 포함된 큐레이션 데이터를 반환하지만, 실서비스에서는 이 함수만
// 크롤러 백엔드 API 호출(fetch(`/api/tips?exam=${examId}`))로 교체하면 된다.
// UI는 이 모듈의 반환 형태에만 의존한다.

import { TIPS } from '../data/tips.js';

export async function fetchTips(examId) {
  // 실제 수집 API를 흉내 내는 약간의 지연
  await new Promise((r) => setTimeout(r, 350));
  // 해당 시험의 팁만 반환한다. 시험과 무관한 범용 공부법 글은 노이즈라 넣지 않는다.
  return TIPS.filter((t) => t.examId === examId).sort((a, b) => b.upvotes - a.upvotes);
}
