import React, { useEffect, useMemo, useState } from 'react';
import { getExam } from './data/exams.js';
import { TIPS, GENERIC_TIPS } from './data/tips.js';
import { generatePlan, replanFromToday } from './lib/planner.js';
import { loadState, saveState, clearState } from './lib/storage.js';
import { todayKey, diffDays } from './lib/date.js';
import StepNav from './components/StepNav.jsx';
import ExamPicker from './components/ExamPicker.jsx';
import SchedulePicker from './components/SchedulePicker.jsx';
import TipsBoard from './components/TipsBoard.jsx';
import PlanSetup from './components/PlanSetup.jsx';
import CalendarView from './components/CalendarView.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import { celebrate } from './lib/confetti.js';
import { STREAK_MIN_SECONDS, daySeconds, computeStreak } from './lib/study.js';
import { dueReminders } from './lib/reminders.js';
import { permissionState, showNotification } from './lib/push.js';
import { isReviewable, buildReviews, mergeReviews, removeReviewsForSource } from './lib/review.js';

const STEPS = ['exam', 'date', 'tips', 'setup', 'calendar'];

const INITIAL = {
  step: 'exam',
  examId: null,
  examDate: null,
  examMeta: null, // { roundLabel, stageLabel, regStart, regEnd, examStart, examEnd, passDate, live }
  selectedTipIds: [],
  settings: { dailyMinutes: 120, restDays: [] },
  plan: null,
  completed: [],
  reviews: [], // 간격 반복 복습 아이템 (완료일 기준으로 생성)
  reviewDone: [], // 완료한 복습 id
  studyLog: {}, // { 'YYYY-MM-DD': seconds } 공부 시간 기록 (계획과 무관하게 누적)
  timerStartedAt: null, // 진행 중 타이머의 시작 시각(epoch ms) — 새로고침에도 복원
  notifyPrefs: {
    enabled: false,
    study: true,
    streak: true,
    reg: true,
    remindTime: '20:00',
    lastNotified: {}, // { id: 'YYYY-MM-DD' } 하루 1회 중복 방지
  },
};

export default function App() {
  const [state, setState] = useState(() => {
    const saved = loadState();
    return saved ? { ...INITIAL, ...saved } : INITIAL;
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  // 앱을 열어 캘린더로 들어올 때, 조건에 맞는 로컬 리마인더를 표시 (백엔드 불필요)
  useEffect(() => {
    if (state.step !== 'calendar' || !state.plan) return;
    const prefs = state.notifyPrefs;
    if (!prefs || !prefs.enabled || permissionState() !== 'granted') return;
    const today = todayKey();
    const streak = computeStreak(state.studyLog, today);
    const due = dueReminders(prefs, {
      examMeta: state.examMeta,
      streakCount: streak.count,
      todayStudied: streak.todayStudied,
      today,
      hour: new Date().getHours(),
    });
    if (!due.length) return;
    const marked = { ...(prefs.lastNotified || {}) };
    due.forEach((n) => {
      showNotification(n.title, { body: n.body });
      marked[n.id] = today;
    });
    setState((s) => ({ ...s, notifyPrefs: { ...s.notifyPrefs, lastNotified: marked } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);

  const handleNotifyChange = (notifyPrefs) => setState((s) => ({ ...s, notifyPrefs }));

  const exam = useMemo(() => (state.examId ? getExam(state.examId) : null), [state.examId]);

  const selectedTips = useMemo(
    () => [...TIPS, ...GENERIC_TIPS].filter((t) => state.selectedTipIds.includes(t.id)),
    [state.selectedTipIds]
  );

  const patch = (p) => setState((s) => ({ ...s, ...p }));
  const goto = (step) => patch({ step });

  const handleGenerate = (settings) => {
    const plan = generatePlan({
      exam,
      tips: selectedTips,
      startKey: todayKey(),
      examKey: state.examDate,
      dailyMinutes: settings.dailyMinutes,
      restDays: settings.restDays,
    });
    setState((s) => ({ ...s, settings, plan, completed: [], step: 'calendar' }));
    // 계획 생성 축하
    setTimeout(() => celebrate({ count: 140 }), 250);
  };

  const handleToggleUnit = (unitId) => {
    setState((s) => {
      const done = new Set(s.completed);
      const unit = s.plan?.units.find((u) => u.id === unitId);
      let { reviews, reviewDone } = s;

      if (done.has(unitId)) {
        done.delete(unitId);
        // 완료 취소 → 해당 유닛의 복습 제거
        if (isReviewable(unit)) {
          const removed = new Set(
            reviews.filter((r) => r.sourceUnitId === unitId).map((r) => r.id)
          );
          reviews = removeReviewsForSource(reviews, unitId);
          reviewDone = reviewDone.filter((id) => !removed.has(id));
        }
      } else {
        done.add(unitId);
        // 완료 → 오늘 기준 간격 반복 복습 생성 (개념/기출만)
        if (isReviewable(unit)) {
          reviews = mergeReviews(reviews, buildReviews(unit, todayKey(), s.examDate));
        }
      }
      return { ...s, completed: [...done], reviews, reviewDone };
    });
  };

  const handleToggleReview = (reviewId) => {
    setState((s) => {
      const done = new Set(s.reviewDone);
      if (done.has(reviewId)) done.delete(reviewId);
      else done.add(reviewId);
      return { ...s, reviewDone: [...done] };
    });
  };

  const handleReplan = () => {
    setState((s) => ({
      ...s,
      plan: replanFromToday(s.plan, {
        todayKey: todayKey(),
        examKey: s.examDate,
        dailyMinutes: s.settings.dailyMinutes,
        restDays: s.settings.restDays,
        completed: s.completed,
      }),
    }));
  };

  const handleTimerStart = () => {
    setState((s) => (s.timerStartedAt ? s : { ...s, timerStartedAt: Date.now() }));
  };

  const handleTimerStop = (elapsedSeconds) => {
    setState((s) => {
      const key = todayKey();
      const prev = daySeconds(s.studyLog, key);
      const next = prev + Math.max(0, Math.round(elapsedSeconds));
      // 오늘 '처음' 공부 인정선을 넘겼으면 스트릭 이어짐 축하
      if (prev < STREAK_MIN_SECONDS && next >= STREAK_MIN_SECONDS) {
        setTimeout(() => celebrate({ count: 90, spread: 0.9 }), 60);
      }
      return { ...s, studyLog: { ...s.studyLog, [key]: next }, timerStartedAt: null };
    });
  };

  const handleReset = () => {
    if (!window.confirm('현재 계획을 삭제하고 처음부터 다시 만들까요? (공부 기록·연속일은 유지돼요)')) return;
    // 공부 기록/스트릭은 학습 이력이라 계획 초기화와 무관하게 보존
    setState((s) => {
      const preserved = { ...INITIAL, studyLog: s.studyLog, timerStartedAt: s.timerStartedAt };
      saveState(preserved);
      return preserved;
    });
  };

  const dday = state.examDate ? diffDays(todayKey(), state.examDate) : null;

  return (
      <div className="app">
        <header className="app-header">
        <div className="brand" onClick={() => state.plan && goto('calendar')}>
          <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
            <rect width="40" height="40" rx="11" fill="var(--primary)" />
            <circle cx="20" cy="18" r="9" fill="none" stroke="#fff" strokeWidth="3" opacity="0.9" />
            <circle cx="20" cy="18" r="3" fill="#fff" />
            <path
              d="M14 26l4 4 8-9"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <h1>시험 마스터</h1>
            <p>커뮤니티 꿀팁 모아보고, 시험일까지 공부 캘린더</p>
          </div>
        </div>
        {exam && state.examDate && (
          <div className="header-dday">
            <strong>{exam.name}</strong>
            <span className={`dday-badge ${dday <= 7 ? 'urgent' : ''}`}>
              {dday === 0 ? 'D-DAY' : dday > 0 ? `D-${dday}` : `종료 +${-dday}`}
            </span>
          </div>
        )}
      </header>

      <InstallPrompt />

      {state.step !== 'calendar' && (
        <StepNav
          steps={STEPS}
          current={state.step}
          onJump={(step) => {
            // 이미 지난 단계로만 이동 허용
            if (STEPS.indexOf(step) < STEPS.indexOf(state.step)) goto(step);
          }}
        />
      )}

      <main className="app-main">
        {state.step === 'exam' && (
          <ExamPicker
            selectedId={state.examId}
            onSelect={(examId) => {
              // 시험을 바꾸면 이후 단계 선택 초기화
              const changed = examId !== state.examId;
              patch({
                examId,
                step: 'date',
                ...(changed
                  ? { examDate: null, examMeta: null, selectedTipIds: [], plan: null, completed: [] }
                  : {}),
              });
            }}
          />
        )}

        {state.step === 'date' && exam && (
          <SchedulePicker
            exam={exam}
            value={state.examDate}
            onBack={() => goto('exam')}
            onNext={(examDate, examMeta) => patch({ examDate, examMeta, step: 'tips' })}
          />
        )}

        {state.step === 'tips' && exam && (
          <TipsBoard
            exam={exam}
            selectedIds={state.selectedTipIds}
            onChange={(selectedTipIds) => patch({ selectedTipIds })}
            onBack={() => goto('date')}
            onNext={() => goto('setup')}
          />
        )}

        {state.step === 'setup' && exam && (
          <PlanSetup
            exam={exam}
            examDate={state.examDate}
            tips={selectedTips}
            initial={state.settings}
            onBack={() => goto('tips')}
            onGenerate={handleGenerate}
          />
        )}

        {state.step === 'calendar' && exam && state.plan && (
          <CalendarView
            exam={exam}
            examDate={state.examDate}
            examMeta={state.examMeta}
            plan={state.plan}
            completed={state.completed}
            tips={selectedTips}
            studyLog={state.studyLog}
            timerStartedAt={state.timerStartedAt}
            onTimerStart={handleTimerStart}
            onTimerStop={handleTimerStop}
            notifyPrefs={state.notifyPrefs}
            onNotifyChange={handleNotifyChange}
            reviews={state.reviews}
            reviewDone={state.reviewDone}
            onToggleReview={handleToggleReview}
            onToggleUnit={handleToggleUnit}
            onReplan={handleReplan}
            onReset={handleReset}
          />
        )}

        {state.step === 'calendar' && (!exam || !state.plan) && (
          <div className="empty-state">
            <p>아직 만들어진 계획이 없어요.</p>
            <button className="btn primary" onClick={() => goto('exam')}>
              계획 만들기 시작
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          앱에 표시되는 시험 일정과 커뮤니티 게시글은 데모 데이터입니다. 실제 접수 일정은 큐넷 등
          공식 기관에서 꼭 확인하세요.
        </p>
      </footer>
      </div>
  );
}
