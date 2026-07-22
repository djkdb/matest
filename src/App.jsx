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

  const handleReset = () => {
    if (!window.confirm('현재 계획을 삭제하고 처음부터 다시 만들까요?')) return;
    clearState();
    setState(INITIAL);
  };

  const dday = state.examDate ? diffDays(todayKey(), state.examDate) : null;

  return (
    <>
      <div className="ambient" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>
      <div className="app">
        <header className="app-header">
        <div className="brand" onClick={() => state.plan && goto('calendar')}>
          <span className="brand-logo">🎯</span>
          <div>
            <h1>시험 마스터</h1>
            <p>커뮤니티 꿀팁 모아보고, 시험일까지 알아서 공부 캘린더</p>
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
          ⚠️ 앱에 표시되는 시험 일정과 커뮤니티 게시글은 데모 데이터입니다. 실제 접수 일정은 큐넷 등
          공식 기관에서 꼭 확인하세요.
        </p>
      </footer>
      </div>
    </>
  );
}
