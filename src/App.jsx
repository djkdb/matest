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
import { STREAK_MIN_SECONDS, daySeconds } from './lib/study.js';

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
  studyLog: {}, // { 'YYYY-MM-DD': seconds } 공부 시간 기록 (계획과 무관하게 누적)
  timerStartedAt: null, // 진행 중 타이머의 시작 시각(epoch ms) — 새로고침에도 복원
};

export default function App() {
  const [state, setState] = useState(() => {
    const saved = loadState();
    return saved ? { ...INITIAL, ...saved } : INITIAL;
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

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
      if (done.has(unitId)) done.delete(unitId);
      else done.add(unitId);
      return { ...s, completed: [...done] };
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
