// 큐넷(공공데이터포털) 국가기술자격 시험일정 연동.
//
// API: 한국산업인력공단_국가기술자격 시험일정
//   GET {BASE}/getQualExamSchdList
//   ?serviceKey=...&dataFormat=json&implYy=2026&qualgbCd=T&numOfRows=100&pageNo=1
//   - implYy   : 시행년도 (필수)
//   - qualgbCd : 자격구분코드 ('T' = 국가기술자격)
//   - jmCd     : 종목코드 (선택; 없으면 해당 등급 전 종목 공통 일정 반환)
//
// 응답 item 필드(YYYYMMDD 문자열):
//   description, implYy, implSeq, qualgbNm,
//   docRegStartDt/docRegEndDt   (필기 원서접수),
//   docExamStartDt/docExamEndDt (필기 시험), docPassDt (필기 합격발표),
//   pracRegStartDt/pracRegEndDt (실기 원서접수),
//   pracExamStartDt/pracExamEndDt (실기 시험), pracPassDt (최종 합격발표)
//
// CORS: 브라우저에서 apis.data.go.kr 직접 호출은 CORS로 막히므로,
//   - 개발: vite.config.js 의 '/api/qnet' 프록시 사용 (기본 BASE)
//   - 배포: 동일 경로를 서버리스/리버스 프록시로 연결 (README 참고)
//
// 인증키가 없거나(=미설정) 요청이 실패하면 exam.scheduleFallback 을 반환한다.

const ENV = (typeof import.meta !== 'undefined' && import.meta.env) || {};
const BASE = ENV.VITE_QNET_BASE || '/api/qnet';
const API_KEY = ENV.VITE_QNET_API_KEY || '';

/** 'YYYYMMDD' → 'YYYY-MM-DD' (빈 값/형식 불일치 시 null) */
export function ymdToKey(ymd) {
  if (!ymd) return null;
  const s = String(ymd).trim();
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(s);
  if (!m) return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** 공공데이터포털 JSON 응답에서 item 배열을 방어적으로 추출한다. */
export function extractItems(json) {
  const body = json?.response?.body ?? json?.body ?? json;
  let items = body?.items ?? body?.item ?? [];
  // { items: { item: [...] } } 또는 { items: {...단일...} } 형태 대응
  if (items && !Array.isArray(items) && items.item) items = items.item;
  if (!Array.isArray(items)) items = items ? [items] : [];
  return items;
}

/** 큐넷 응답 item 하나 → 앱 회차(session) 구조로 변환 */
export function itemToSession(item, examId) {
  const yy = item.implYy ?? '';
  const seq = item.implSeq ?? '';
  const stages = [];

  const written = buildStage('필기', 'written', {
    regStart: item.docRegStartDt,
    regEnd: item.docRegEndDt,
    examStart: item.docExamStartDt,
    examEnd: item.docExamEndDt,
    pass: item.docPassDt,
  });
  if (written) stages.push(written);

  const practical = buildStage('실기', 'practical', {
    regStart: item.pracRegStartDt,
    regEnd: item.pracRegEndDt,
    examStart: item.pracExamStartDt,
    examEnd: item.pracExamEndDt,
    pass: item.pracPassDt,
  });
  if (practical) stages.push(practical);

  return {
    id: `${examId}-${yy}-${seq}`,
    round: item.description || `${yy}년 ${seq}회`,
    source: 'qnet',
    stages,
  };
}

function buildStage(label, key, raw) {
  const examStart = ymdToKey(raw.examStart);
  if (!examStart) return null; // 시험일이 없으면 단계로 취급하지 않음
  const regStart = ymdToKey(raw.regStart);
  const regEnd = ymdToKey(raw.regEnd);
  return {
    key,
    label,
    reg: regStart && regEnd ? { start: regStart, end: regEnd } : null,
    exam: { start: examStart, end: ymdToKey(raw.examEnd) || examStart },
    pass: ymdToKey(raw.pass),
  };
}

/** 응답 전체 → 등급 필터 적용된 회차 목록 */
export function sessionsFromResponse(json, exam) {
  const grade = exam.qnet?.grade;
  return extractItems(json)
    .filter((it) => {
      if (!grade) return true;
      const hay = `${it.description ?? ''} ${it.qualgbNm ?? ''}`;
      return hay.includes(grade);
    })
    .map((it) => itemToSession(it, exam.id))
    .filter((s) => s.stages.length > 0);
}

function buildUrl(exam, year) {
  // 기술자격은 getQualExamSchdList, 전문자격 등은 exam.qnet.operation 으로 지정.
  const operation = exam.qnet.operation || 'getQualExamSchdList';
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    dataFormat: 'json',
    implYy: String(year),
    qualgbCd: exam.qnet.qualgbCd,
    numOfRows: '100',
    pageNo: '1',
  });
  if (exam.qnet.jmCd) params.set('jmCd', exam.qnet.jmCd);
  return `${BASE}/${operation}?${params.toString()}`;
}

/**
 * 시험 일정 조회. 큐넷 대상 종목이고 인증키가 있으면 라이브 조회,
 * 아니면(또는 실패 시) scheduleFallback 을 반환한다.
 *
 * @returns { sessions, live }  live=true 면 큐넷 실시간 데이터
 */
export async function fetchSchedule(exam, { year, signal } = {}) {
  const fallback = { sessions: exam.scheduleFallback ?? [], live: false };
  if (!exam.qnet || !API_KEY) return fallback;

  const yr = year ?? new Date().getFullYear();
  try {
    const res = await fetch(buildUrl(exam, yr), { signal });
    if (!res.ok) return fallback;
    const json = await res.json();
    const code = json?.response?.header?.resultCode;
    if (code && code !== '00') return fallback; // 인증키 오류 등
    const sessions = sessionsFromResponse(json, exam);
    return sessions.length ? { sessions, live: true } : fallback;
  } catch {
    return fallback; // 네트워크/CORS/파싱 오류 → 안전하게 예시로
  }
}
