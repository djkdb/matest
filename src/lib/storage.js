// localStorage 영속화. 스키마가 바뀌면 KEY 버전을 올린다.

const KEY = 'exam-master-v1';

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 저장 실패(사파리 시크릿 모드 등)는 조용히 무시
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
