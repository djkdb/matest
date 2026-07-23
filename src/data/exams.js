// 주요 자격증 데이터베이스.
//
// 시험 일정 구조
// ─────────────
// - qnet: 큐넷(공공데이터포털) 국가기술자격 시험일정 API로 실시간 조회가 가능한
//   종목은 { qualgbCd, grade } 를 갖는다. qualgbCd='T'(국가기술자격),
//   grade 는 응답 description 을 필터링할 등급 키워드('기사'|'기능사' 등).
//   qnet 이 null 이면 큐넷 API 대상이 아니므로(어학·상공회의소 등) 항상 아래
//   scheduleFallback 을 사용한다.
// - scheduleFallback: 라이브 조회 실패/미설정 시 사용하는 예시 회차 데이터.
//   실제 서비스에서는 큐넷 API 응답으로 대체된다(src/lib/qnetService.js).
//
// 회차(session) 구조 — 필기/실기 등 단계(stage)별 원서접수·시험·발표 일정:
//   {
//     id, round,                       // 회차 라벨
//     stages: [{
//       key, label,                    // 'written'|'practical'|'sitting', '필기'|'실기'|...
//       reg:  { start, end } | null,   // 원서접수 기간 (null = 상시접수)
//       exam: { start, end },          // 시험 기간 (start 를 D-day 기준으로 사용)
//       pass: 'YYYY-MM-DD' | null,     // 합격(예정)발표일
//     }],
//   }
//
// ⚠️ scheduleFallback 의 날짜는 데모용 예시다. 실제 접수·시험 일정은 반드시
//    시행 기관(큐넷, 대한상공회의소 등) 공식 공고를 확인해야 한다.

export const CATEGORIES = [
  { id: 'it', label: 'IT · 개발' },
  { id: 'office', label: '사무 · OA' },
  { id: 'lang', label: '어학' },
  { id: 'history', label: '역사 · 상식' },
  { id: 'tech', label: '기술 · 산업' },
  { id: 'estate', label: '부동산 · 금융' },
  { id: 'welfare', label: '보건 · 복지' },
];

export const EXAMS = [
  {
    id: 'jeongcheogi',
    name: '정보처리기사',
    category: 'it',
    organizer: '한국산업인력공단 (큐넷)',
    popular: true,
    difficulty: '중',
    avgPrepWeeks: 6,
    subjects: [
      '소프트웨어 설계',
      '소프트웨어 개발',
      '데이터베이스 구축',
      '프로그래밍 언어 활용',
      '정보시스템 구축 관리',
    ],
    pastExamRounds: 8,
    mockRounds: 3,
    qnet: { qualgbCd: 'T', grade: '기사' },
    scheduleFallback: [
      {
        id: 'jeongcheogi-2026-3',
        round: '2026년 정기 기사 3회',
        stages: [
          {
            key: 'written',
            label: '필기',
            reg: { start: '2026-06-16', end: '2026-06-19' },
            exam: { start: '2026-08-09', end: '2026-08-27' },
            pass: '2026-09-10',
          },
          {
            key: 'practical',
            label: '실기',
            reg: { start: '2026-09-22', end: '2026-09-25' },
            exam: { start: '2026-11-01', end: '2026-11-16' },
            pass: '2026-12-24',
          },
        ],
      },
    ],
  },
  {
    id: 'comhwal1',
    name: '컴퓨터활용능력 1급',
    category: 'office',
    organizer: '대한상공회의소',
    popular: true,
    difficulty: '중',
    avgPrepWeeks: 4,
    subjects: ['컴퓨터 일반', '스프레드시트', '데이터베이스'],
    pastExamRounds: 10,
    mockRounds: 4,
    qnet: null,
    scheduleFallback: [
      {
        id: 'comhwal1-2026-sangsi-a',
        round: '2026 상시검정 (필기)',
        stages: [
          {
            key: 'sitting',
            label: '필기',
            reg: null, // 상시 접수 (시험일 기준 보통 시험 4일 전까지 접수)
            exam: { start: '2026-08-01', end: '2026-08-01' },
            pass: '2026-08-01', // 필기 상시검정은 시험 직후 합격 확인
          },
        ],
      },
      {
        id: 'comhwal1-2026-sangsi-b',
        round: '2026 상시검정 (실기)',
        stages: [
          {
            key: 'sitting',
            label: '실기',
            reg: null,
            exam: { start: '2026-08-16', end: '2026-08-16' },
            pass: '2026-08-28',
          },
        ],
      },
    ],
  },
  {
    id: 'hanguksa',
    name: '한국사능력검정시험 (심화)',
    category: 'history',
    organizer: '국사편찬위원회',
    popular: true,
    difficulty: '하',
    avgPrepWeeks: 3,
    subjects: ['전근대사 (선사~조선)', '근대사 (개항기~일제강점기)', '현대사'],
    pastExamRounds: 6,
    mockRounds: 2,
    qnet: null,
    scheduleFallback: [
      {
        id: 'hanguksa-78',
        round: '제78회',
        stages: [
          {
            key: 'sitting',
            label: '시험',
            reg: { start: '2026-07-06', end: '2026-07-13' },
            exam: { start: '2026-08-08', end: '2026-08-08' },
            pass: '2026-08-21',
          },
        ],
      },
      {
        id: 'hanguksa-79',
        round: '제79회',
        stages: [
          {
            key: 'sitting',
            label: '시험',
            reg: { start: '2026-09-21', end: '2026-09-28' },
            exam: { start: '2026-10-24', end: '2026-10-24' },
            pass: '2026-11-06',
          },
        ],
      },
    ],
  },
  {
    id: 'toeic',
    name: 'TOEIC',
    category: 'lang',
    organizer: 'YBM',
    popular: true,
    difficulty: '중',
    avgPrepWeeks: 8,
    subjects: ['LC Part 1-2', 'LC Part 3-4', 'RC Part 5-6 (문법·어휘)', 'RC Part 7 (독해)'],
    pastExamRounds: 10,
    mockRounds: 5,
    qnet: null,
    scheduleFallback: [
      {
        id: 'toeic-531',
        round: '제531회',
        stages: [
          {
            key: 'sitting',
            label: '정기시험',
            reg: { start: '2026-07-13', end: '2026-08-04' },
            exam: { start: '2026-08-16', end: '2026-08-16' },
            pass: '2026-08-28',
          },
        ],
      },
      {
        id: 'toeic-532',
        round: '제532회',
        stages: [
          {
            key: 'sitting',
            label: '정기시험',
            reg: { start: '2026-07-27', end: '2026-08-18' },
            exam: { start: '2026-08-30', end: '2026-08-30' },
            pass: '2026-09-11',
          },
        ],
      },
    ],
  },
  {
    id: 'sqld',
    name: 'SQLD (SQL 개발자)',
    category: 'it',
    organizer: '한국데이터산업진흥원',
    popular: true,
    difficulty: '하',
    avgPrepWeeks: 2,
    subjects: ['데이터 모델링의 이해', 'SQL 기본', 'SQL 활용'],
    pastExamRounds: 5,
    mockRounds: 2,
    qnet: null,
    scheduleFallback: [
      {
        id: 'sqld-62',
        round: '제62회',
        stages: [
          {
            key: 'sitting',
            label: '시험',
            reg: { start: '2026-08-04', end: '2026-08-08' },
            exam: { start: '2026-09-06', end: '2026-09-06' },
            pass: '2026-09-26',
          },
        ],
      },
    ],
  },
  {
    id: 'jeongi',
    name: '전기기사',
    category: 'tech',
    organizer: '한국산업인력공단 (큐넷)',
    popular: false,
    difficulty: '상',
    avgPrepWeeks: 12,
    subjects: ['전기자기학', '전력공학', '전기기기', '회로이론 및 제어공학', '전기설비기술기준'],
    pastExamRounds: 8,
    mockRounds: 3,
    qnet: { qualgbCd: 'T', grade: '기사' },
    scheduleFallback: [
      {
        id: 'jeongi-2026-3',
        round: '2026년 정기 기사 3회',
        stages: [
          {
            key: 'written',
            label: '필기',
            reg: { start: '2026-06-16', end: '2026-06-19' },
            exam: { start: '2026-08-09', end: '2026-08-27' },
            pass: '2026-09-10',
          },
          {
            key: 'practical',
            label: '실기',
            reg: { start: '2026-09-22', end: '2026-09-25' },
            exam: { start: '2026-11-01', end: '2026-11-16' },
            pass: '2026-12-24',
          },
        ],
      },
    ],
  },
  {
    id: 'sananjeon',
    name: '산업안전기사',
    category: 'tech',
    organizer: '한국산업인력공단 (큐넷)',
    popular: true,
    difficulty: '중',
    avgPrepWeeks: 6,
    subjects: [
      '산업재해 예방 및 안전보건교육',
      '인간공학 및 위험성 평가·관리',
      '기계·기구 및 설비 안전관리',
      '전기설비 안전관리',
      '화학설비 안전관리',
      '건설공사 안전관리',
    ],
    pastExamRounds: 8,
    mockRounds: 3,
    qnet: { qualgbCd: 'T', grade: '기사' },
    scheduleFallback: [
      {
        id: 'sananjeon-2026-3',
        round: '2026년 정기 기사 3회',
        stages: [
          {
            key: 'written',
            label: '필기',
            reg: { start: '2026-06-16', end: '2026-06-19' },
            exam: { start: '2026-08-09', end: '2026-08-27' },
            pass: '2026-09-10',
          },
          {
            key: 'practical',
            label: '실기',
            reg: { start: '2026-09-22', end: '2026-09-25' },
            exam: { start: '2026-11-01', end: '2026-11-16' },
            pass: '2026-12-24',
          },
        ],
      },
    ],
  },
  {
    id: 'gongin',
    name: '공인중개사',
    category: 'estate',
    organizer: '한국산업인력공단 (큐넷)',
    popular: true,
    difficulty: '상',
    avgPrepWeeks: 20,
    subjects: [
      '부동산학개론',
      '민법 및 민사특별법',
      '공인중개사법령 및 실무',
      '부동산공법',
      '부동산공시법 및 세법',
    ],
    pastExamRounds: 6,
    mockRounds: 4,
    qnet: null, // 국가전문자격 — 별도 자격구분코드 필요(로드맵)
    scheduleFallback: [
      {
        id: 'gongin-37',
        round: '제37회 (1·2차 동시)',
        stages: [
          {
            key: 'sitting',
            label: '1·2차',
            reg: { start: '2026-08-10', end: '2026-08-14' },
            exam: { start: '2026-10-31', end: '2026-10-31' },
            pass: '2026-11-25',
          },
        ],
      },
    ],
  },
  {
    id: 'sahoebokji',
    name: '사회복지사 1급',
    category: 'welfare',
    organizer: '한국산업인력공단',
    popular: false,
    difficulty: '중',
    avgPrepWeeks: 10,
    subjects: ['인간행동과 사회환경', '사회복지조사론', '사회복지실천론', '사회복지정책론', '사회복지법제론'],
    pastExamRounds: 6,
    mockRounds: 3,
    qnet: null, // 국가전문자격 — 로드맵
    scheduleFallback: [
      {
        id: 'sahoebokji-25',
        round: '제25회',
        stages: [
          {
            key: 'sitting',
            label: '필기',
            reg: { start: '2026-11-24', end: '2026-12-01' },
            exam: { start: '2027-01-16', end: '2027-01-16' },
            pass: '2027-02-13',
          },
        ],
      },
    ],
  },
  {
    id: 'jigyecha',
    name: '지게차운전기능사',
    category: 'tech',
    organizer: '한국산업인력공단 (큐넷)',
    popular: false,
    difficulty: '하',
    avgPrepWeeks: 2,
    subjects: ['지게차 주행·화물 적재', '안전관리', '장비구조 및 점검'],
    pastExamRounds: 5,
    mockRounds: 2,
    qnet: { qualgbCd: 'T', grade: '기능사' },
    scheduleFallback: [
      {
        id: 'jigyecha-2026-sangsi',
        round: '2026 상시 기능사',
        stages: [
          {
            key: 'written',
            label: '필기',
            reg: null, // 상시 접수
            exam: { start: '2026-08-05', end: '2026-08-05' },
            pass: '2026-08-05',
          },
          {
            key: 'practical',
            label: '실기',
            reg: null,
            exam: { start: '2026-09-12', end: '2026-09-12' },
            pass: '2026-09-25',
          },
        ],
      },
    ],
  },
];

export function getExam(id) {
  return EXAMS.find((e) => e.id === id) ?? null;
}
