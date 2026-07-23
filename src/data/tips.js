// 커뮤니티에서 수집한 합격 꿀팁 데이터.
//
// ⚠️ 현재는 큐레이션된 데모 데이터다. 실서비스에서는 크롤러/수집 백엔드가
// 이 형태의 JSON을 API로 내려주고, src/lib/tipService.js 만 교체하면 된다.
//
// strategy.phaseWeights: 이 팁이 권장하는 공부 단계별 시간 비중
//   concept(개념) / past(기출) / mock(모의고사·실전) / wrap(오답·총정리)
// strategy.recommendedTotalHours: 이 전략이 가정하는 총 공부 시간

export const SOURCES = {
  dcinside: { label: '디시인사이드', short: '디시', color: '#3b4890' },
  naver_cafe: { label: '네이버 카페', short: '카페', color: '#03c75a' },
  instagram: { label: '인스타그램', short: '인스타', color: '#d62976' },
  youtube: { label: '유튜브', short: '유튜브', color: '#ff0000' },
  blog: { label: '블로그', short: '블로그', color: '#f59e0b' },
};

export const TIPS = [
  // ─── 정보처리기사 ───
  {
    id: 'jcg-1',
    examId: 'jeongcheogi',
    source: 'dcinside',
    board: '정보처리기사 갤러리',
    author: 'ㅇㅇ(211.36)',
    title: '비전공자 3주 필기 합격 후기 (기출만 팠다)',
    summary:
      '개념 인강 1.5배속으로 5일 컷내고 나머지는 전부 기출 돌림. 최근 5개년 기출 3회독하면 문제은행식이라 답이 보임. 오답은 노션에 정리해서 시험 전날 훑기.',
    upvotes: 847,
    comments: 132,
    tags: ['비전공자', '3주완성', '기출위주'],
    strategy: {
      name: '기출 몰빵 전략',
      phaseWeights: { concept: 0.2, past: 0.55, mock: 0.1, wrap: 0.15 },
      recommendedTotalHours: 60,
    },
  },
  {
    id: 'jcg-2',
    examId: 'jeongcheogi',
    source: 'naver_cafe',
    board: '자격증 따기 카페',
    author: '합격기원맘',
    title: '전공자 기준 실기까지 한번에 — 개념 정리 노트 공유',
    summary:
      '필기는 기출로 되지만 실기는 개념 빵꾸나면 바로 탈락. 과목별 핵심 키워드 정리하고 매일 아침 30분 암기. 프로그래밍 문제는 파이썬 기준으로 손코딩 연습 필수.',
    upvotes: 512,
    comments: 88,
    tags: ['전공자', '실기대비', '개념정리'],
    strategy: {
      name: '개념 탄탄 전략',
      phaseWeights: { concept: 0.4, past: 0.3, mock: 0.15, wrap: 0.15 },
      recommendedTotalHours: 90,
    },
  },
  {
    id: 'jcg-3',
    examId: 'jeongcheogi',
    source: 'youtube',
    board: '흥달쌤 채널 댓글 모음',
    author: '구독자 후기',
    title: '무료 인강 커리큘럼만 따라가도 필기 합격선',
    summary:
      '유튜브 무료 강의 정주행 → 강의별 확인문제 → 주말마다 기출 1회분 모의시험. 직장인이라 평일 1.5시간밖에 못했는데 8주 걸림. 꾸준함이 답.',
    upvotes: 1204,
    comments: 201,
    tags: ['직장인', '무료인강', '8주플랜'],
    strategy: {
      name: '직장인 롱런 전략',
      phaseWeights: { concept: 0.35, past: 0.35, mock: 0.2, wrap: 0.1 },
      recommendedTotalHours: 84,
    },
  },
  {
    id: 'jcg-4',
    examId: 'jeongcheogi',
    source: 'instagram',
    board: '#정보처리기사 #공스타그램',
    author: '@study.daily__',
    title: 'D-30 스터디플래너 인증 릴레이',
    summary:
      '하루 3시간 고정: 1시간 개념, 1.5시간 기출, 30분 오답노트. 인스타 스터디 그룹이랑 매일 인증하니까 안 빼먹게 됨. 마지막 주는 모의고사 체제로 전환.',
    upvotes: 3892,
    comments: 156,
    tags: ['한달완성', '스터디인증', '루틴'],
    strategy: {
      name: '밸런스 루틴 전략',
      phaseWeights: { concept: 0.3, past: 0.4, mock: 0.15, wrap: 0.15 },
      recommendedTotalHours: 90,
    },
  },

  // ─── 컴퓨터활용능력 1급 ───
  {
    id: 'ch-1',
    examId: 'comhwal1',
    source: 'dcinside',
    board: '컴활 갤러리',
    author: 'ㅇㅇ(118.235)',
    title: '컴활 1급 실기, 상시라고 만만하게 보면 3연속 떨어짐 (내 얘기)',
    summary:
      '필기는 기출 일주일이면 되는데 실기가 진짜임. 엑셀 함수·매크로, 액세스 쿼리 유형별로 손에 익을 때까지 반복. 유형 정리본 20개 유형 × 3회독 추천.',
    upvotes: 663,
    comments: 97,
    tags: ['실기중심', '유형반복', '엑셀'],
    strategy: {
      name: '실기 유형 반복 전략',
      phaseWeights: { concept: 0.15, past: 0.45, mock: 0.3, wrap: 0.1 },
      recommendedTotalHours: 50,
    },
  },
  {
    id: 'ch-2',
    examId: 'comhwal1',
    source: 'naver_cafe',
    board: '상공회의소 자격증 준비방',
    author: '엑셀왕꿈나무',
    title: '2주 단기 합격 — 상시시험 여러 번 접수하는 꼼수',
    summary:
      '상시라서 일주일 간격으로 2번 접수해두고 첫 시험을 실전 모의고사처럼 활용. 첫 시험에서 부족한 유형 파악하고 남은 기간 그 유형만 조지면 됨.',
    upvotes: 1077,
    comments: 143,
    tags: ['2주완성', '상시활용', '단기'],
    strategy: {
      name: '단기 속성 전략',
      phaseWeights: { concept: 0.15, past: 0.4, mock: 0.35, wrap: 0.1 },
      recommendedTotalHours: 35,
    },
  },
  {
    id: 'ch-3',
    examId: 'comhwal1',
    source: 'youtube',
    board: '컴활 강의 채널',
    author: '수강생 베스트 댓글',
    title: '함수 암기 말고 이해 — 중첩함수 원리 잡는 법',
    summary:
      'IF·VLOOKUP·INDEX/MATCH를 따로 외우지 말고 "무엇을 찾아서 어디에 쓰는가"로 이해하면 응용문제가 풀림. 하루 함수 3개씩 직접 표 만들며 연습.',
    upvotes: 2450,
    comments: 310,
    tags: ['함수', '원리이해', '기초부터'],
    strategy: {
      name: '기초 다지기 전략',
      phaseWeights: { concept: 0.35, past: 0.35, mock: 0.2, wrap: 0.1 },
      recommendedTotalHours: 60,
    },
  },

  // ─── 한국사능력검정 ───
  {
    id: 'hk-1',
    examId: 'hanguksa',
    source: 'instagram',
    board: '#한능검 #심화1급',
    author: '@history_in_10days',
    title: '열흘 만에 1급 — 흐름 암기법 카드뉴스',
    summary:
      '연표를 왕 중심이 아니라 "사건의 인과"로 묶어서 암기. 하루 2시간씩 시대 하나 끝내고, 마지막 3일은 기출 회독. 자주 나오는 문화재 사진은 폰 배경화면으로.',
    upvotes: 5120,
    comments: 89,
    tags: ['10일완성', '암기법', '1급'],
    strategy: {
      name: '단기 흐름 암기 전략',
      phaseWeights: { concept: 0.45, past: 0.35, mock: 0.1, wrap: 0.1 },
      recommendedTotalHours: 25,
    },
  },
  {
    id: 'hk-2',
    examId: 'hanguksa',
    source: 'youtube',
    board: '최태성 별별한국사 댓글',
    author: '수험생 후기',
    title: '무료 강의 정주행 + 기출 2회독이면 심화 1급 충분',
    summary:
      '강의가 스토리텔링이라 안 지루함. 강의 들으면서 판서 노트 따라 적고, 끝나면 해당 시대 기출 바로 풀기. 시험 전 주말에 실전처럼 기출 2회분 타이머 풀이.',
    upvotes: 8730,
    comments: 542,
    tags: ['무료인강', '스토리암기', '2주플랜'],
    strategy: {
      name: '인강 정주행 전략',
      phaseWeights: { concept: 0.5, past: 0.3, mock: 0.1, wrap: 0.1 },
      recommendedTotalHours: 30,
    },
  },
  {
    id: 'hk-3',
    examId: 'hanguksa',
    source: 'dcinside',
    board: '수능 갤러리',
    author: 'ㅇㅇ(175.223)',
    title: '한능검은 기출이 답이다. 개념책 사지 마라',
    summary:
      '어차피 나오는 문제만 나옴. 기출 5회분 풀고 틀린 것만 해설 정독하면 끝. 다만 노베이스면 유튜브 요약 강의 하루는 듣고 시작해라.',
    upvotes: 421,
    comments: 76,
    tags: ['기출위주', '가성비', '벼락치기'],
    strategy: {
      name: '기출 스피드런',
      phaseWeights: { concept: 0.2, past: 0.55, mock: 0.1, wrap: 0.15 },
      recommendedTotalHours: 18,
    },
  },

  // ─── TOEIC ───
  {
    id: 'tc-1',
    examId: 'toeic',
    source: 'naver_cafe',
    board: '토익 스터디 카페',
    author: '900클럽',
    title: '독학 700→905 두 달 기록 — LC는 쉐도잉이 전부',
    summary:
      'LC는 매일 30분 쉐도잉(받아쓰기 X, 따라 말하기 O). RC는 파트5 문법 유형 정리 후 매일 20문제. 주말마다 모의고사 1회 풀고 오답 분석에 반나절 투자.',
    upvotes: 1893,
    comments: 264,
    tags: ['독학', '900목표', '쉐도잉'],
    strategy: {
      name: '실전+쉐도잉 전략',
      phaseWeights: { concept: 0.25, past: 0.3, mock: 0.3, wrap: 0.15 },
      recommendedTotalHours: 120,
    },
  },
  {
    id: 'tc-2',
    examId: 'toeic',
    source: 'instagram',
    board: '#토익공부 #직장인영어',
    author: '@toeic.one.month',
    title: '출퇴근 지하철 30분씩만 — 한 달에 100점 올리기',
    summary:
      '아침 지하철엔 단어앱, 저녁 지하철엔 파트5 10문제. 주말 아침에만 책상 공부 2시간(모의고사 반 회분). 짬시간 누적이 생각보다 큼.',
    upvotes: 6204,
    comments: 187,
    tags: ['직장인', '짬공부', '단어'],
    strategy: {
      name: '짬시간 누적 전략',
      phaseWeights: { concept: 0.3, past: 0.35, mock: 0.25, wrap: 0.1 },
      recommendedTotalHours: 45,
    },
  },
  {
    id: 'tc-3',
    examId: 'toeic',
    source: 'youtube',
    board: '토익 강사 채널',
    author: '수강생 합격 후기',
    title: 'RC 시간 부족은 실력이 아니라 전략 문제',
    summary:
      '파트7부터 거꾸로 푸는 역순 풀이로 시간 압박 해소. 파트5·6은 한 문제 20초 컷 훈련. 모의고사를 "풀기"보다 "시간 배분 리허설"로 생각해야 함.',
    upvotes: 3311,
    comments: 428,
    tags: ['시간관리', 'RC', '실전전략'],
    strategy: {
      name: '실전 리허설 전략',
      phaseWeights: { concept: 0.15, past: 0.25, mock: 0.45, wrap: 0.15 },
      recommendedTotalHours: 80,
    },
  },

  // ─── SQLD ───
  {
    id: 'sq-1',
    examId: 'sqld',
    source: 'dcinside',
    board: '정보보안 갤러리',
    author: 'ㅇㅇ(223.38)',
    title: 'SQLD 노랭이(기출문제집) 2회독이면 끝나는 시험',
    summary:
      '개념서 정독은 시간낭비. 노랭이 풀면서 모르는 개념만 찾아보는 방식이 최고효율. 조인·서브쿼리·그룹함수만 확실히 잡으면 합격선 넘음.',
    upvotes: 934,
    comments: 121,
    tags: ['기출위주', '2주완성', '노랭이'],
    strategy: {
      name: '문제집 역주행 전략',
      phaseWeights: { concept: 0.2, past: 0.6, mock: 0.1, wrap: 0.1 },
      recommendedTotalHours: 24,
    },
  },
  {
    id: 'sq-2',
    examId: 'sqld',
    source: 'blog',
    board: '개발자 기술 블로그',
    author: '주니어 백엔드',
    title: '실무자 기준 SQLD — 이론 파트만 조심하면 됨',
    summary:
      'SQL 짤 줄 알면 2과목은 거저인데 1과목(모델링) 용어 문제에서 은근 털림. 엔터티·속성·식별자 용어 정리에 이틀은 투자할 것.',
    upvotes: 287,
    comments: 34,
    tags: ['실무자', '모델링', '용어정리'],
    strategy: {
      name: '약점 보완 전략',
      phaseWeights: { concept: 0.4, past: 0.4, mock: 0.1, wrap: 0.1 },
      recommendedTotalHours: 16,
    },
  },

  // ─── 전기기사 ───
  {
    id: 'jg-1',
    examId: 'jeongi',
    source: 'naver_cafe',
    board: '전기기사 한번에 붙기',
    author: '전기고시생',
    title: '수학 노베이스 전기기사 — 회로이론부터 잡아야 하는 이유',
    summary:
      '회로이론이 모든 과목의 기초라 순서가 중요함. 회로→자기학→기기→전력→법규 순서로. 과락(40점) 피하는 게 목표면 법규는 막판 암기로 충분.',
    upvotes: 1502,
    comments: 233,
    tags: ['노베이스', '과목순서', '과락방지'],
    strategy: {
      name: '기초부터 순서대로 전략',
      phaseWeights: { concept: 0.45, past: 0.35, mock: 0.1, wrap: 0.1 },
      recommendedTotalHours: 240,
    },
  },
  {
    id: 'jg-2',
    examId: 'jeongi',
    source: 'youtube',
    board: '전기기사 강의 채널',
    author: '합격자 인터뷰',
    title: '직장 다니며 6개월 — 평일 2시간 루틴 공개',
    summary:
      '평일엔 인강 1개+복습, 주말엔 기출 하루 3시간. 암기과목(법규)은 출퇴근에 음성으로. 슬럼프 왔을 때 스터디 카페 결제한 게 신의 한 수.',
    upvotes: 2789,
    comments: 356,
    tags: ['직장인', '6개월', '루틴'],
    strategy: {
      name: '장기 루틴 전략',
      phaseWeights: { concept: 0.4, past: 0.4, mock: 0.1, wrap: 0.1 },
      recommendedTotalHours: 260,
    },
  },

  // ─── 산업안전기사 ───
  {
    id: 'sa-1',
    examId: 'sananjeon',
    source: 'dcinside',
    board: '기사 자격증 갤러리',
    author: 'ㅇㅇ(106.101)',
    title: '산안기 필기는 암기게임 — 과목별 별표 정리법',
    summary:
      '이해할 거 별로 없음. 기출 돌리면서 반복 출제 지문에 별표 치고 별 3개짜리만 모아서 막판 일주일 암기. 계산문제는 공식 15개만 외우면 됨.',
    upvotes: 1120,
    comments: 178,
    tags: ['암기위주', '기출반복', '4주완성'],
    strategy: {
      name: '반복 암기 전략',
      phaseWeights: { concept: 0.25, past: 0.5, mock: 0.1, wrap: 0.15 },
      recommendedTotalHours: 70,
    },
  },
  {
    id: 'sa-2',
    examId: 'sananjeon',
    source: 'instagram',
    board: '#산업안전기사 #안전보건',
    author: '@safety_pass',
    title: '실기 필답형 — 키워드 채점 기준 알고 쓰기',
    summary:
      '필답형은 문장 통암기가 아니라 채점 키워드 중심으로. 하루 10문제씩 손으로 쓰면서 암기하면 4주면 충분. 작업형 동영상 문제는 주말에 몰아서.',
    upvotes: 2914,
    comments: 95,
    tags: ['실기대비', '필답형', '키워드암기'],
    strategy: {
      name: '키워드 암기 전략',
      phaseWeights: { concept: 0.3, past: 0.45, mock: 0.1, wrap: 0.15 },
      recommendedTotalHours: 80,
    },
  },

  // ─── 공인중개사 ───
  {
    id: 'gi-1',
    examId: 'gongin',
    source: 'naver_cafe',
    board: '공인중개사 합격 카페',
    author: '동차합격러',
    title: '1·2차 동차 합격 커리큘럼 (10개월 플랜)',
    summary:
      '민법에서 승부 남. 상반기엔 민법·학개론 기본기, 여름부터 2차 과목 병행. 매주 일요일은 그 주 배운 범위 복습+문제풀이 데이로 고정.',
    upvotes: 3405,
    comments: 512,
    tags: ['동차합격', '장기플랜', '민법중심'],
    strategy: {
      name: '동차 장기 전략',
      phaseWeights: { concept: 0.45, past: 0.3, mock: 0.15, wrap: 0.1 },
      recommendedTotalHours: 600,
    },
  },
  {
    id: 'gi-2',
    examId: 'gongin',
    source: 'youtube',
    board: '공인중개사 강의 채널',
    author: '합격 수기 낭독',
    title: '50대 늦깎이 합격 — 암기력 대신 반복 횟수로 승부',
    summary:
      '젊은 사람들보다 외우는 게 느려서 회독수를 늘림. 기본서 3회독, 기출 5회독. 대신 하루도 안 쉬고 매일 4시간씩. 나이 걱정보다 엉덩이 싸움.',
    upvotes: 4102,
    comments: 687,
    tags: ['늦깎이', '다회독', '꾸준함'],
    strategy: {
      name: '다회독 전략',
      phaseWeights: { concept: 0.35, past: 0.45, mock: 0.1, wrap: 0.1 },
      recommendedTotalHours: 700,
    },
  },

  // ─── 사회복지사 ───
  {
    id: 'sb-1',
    examId: 'sahoebokji',
    source: 'naver_cafe',
    board: '사회복지사 1급 준비방',
    author: '복지현장러',
    title: '현직자 기준 — 법제론 개정사항만 조심',
    summary:
      '실천론·기술론은 현장 경험 있으면 상식으로 풀림. 문제는 법제론 개정 법령. 최신 개정 반영된 요약집으로 막판 2주 암기하고, 조사론 통계 파트는 버리지 말고 기출 유형만.',
    upvotes: 876,
    comments: 143,
    tags: ['현직자', '법제론', '개정법령'],
    strategy: {
      name: '선택과 집중 전략',
      phaseWeights: { concept: 0.35, past: 0.4, mock: 0.1, wrap: 0.15 },
      recommendedTotalHours: 100,
    },
  },

  // ─── 지게차 ───
  {
    id: 'jgc-1',
    examId: 'jigyecha',
    source: 'dcinside',
    board: '중장비 갤러리',
    author: 'ㅇㅇ(39.7)',
    title: '지게차 필기 하루 컷 가능 (기출앱 추천)',
    summary:
      '기출 문제 앱 깔고 출퇴근+점심시간에 800문제 돌리면 하루~이틀 컷. 실기는 학원 6시간 연수가 국룰. 코스 감각은 유튜브 시점 영상으로 예습.',
    upvotes: 556,
    comments: 89,
    tags: ['하루컷', '기출앱', '실기학원'],
    strategy: {
      name: '초단기 전략',
      phaseWeights: { concept: 0.1, past: 0.6, mock: 0.2, wrap: 0.1 },
      recommendedTotalHours: 10,
    },
  },
];

// 시험별 팁이 없을 때 보여줄 범용 꿀팁
export const GENERIC_TIPS = [
  {
    id: 'gen-1',
    examId: '*',
    source: 'blog',
    board: '공부법 블로그',
    author: '메타인지연구소',
    title: '어떤 시험이든 통하는 3단계: 개념 훑기 → 기출 회독 → 실전 리허설',
    summary:
      '개념은 완벽히 이해하려 하지 말고 전체 지도를 그린다는 느낌으로 빠르게. 기출로 출제 포인트를 역산하고, 마지막엔 실제 시험 시간에 맞춰 리허설.',
    upvotes: 1500,
    comments: 120,
    tags: ['공부법', '범용'],
    strategy: {
      name: '표준 3단계 전략',
      phaseWeights: { concept: 0.3, past: 0.4, mock: 0.2, wrap: 0.1 },
      recommendedTotalHours: 60,
    },
  },
];
