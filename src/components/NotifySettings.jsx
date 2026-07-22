import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import {
  notificationsSupported,
  permissionState,
  requestPermission,
  showNotification,
  subscribeToPush,
} from '../lib/push.js';

const TOGGLES = [
  { key: 'study', label: '매일 공부 리마인더', desc: '기준 시각까지 공부 기록이 없으면 알려드려요' },
  { key: 'streak', label: '연속 학습(스트릭) 경고', desc: '스트릭이 끊길 위험일 때 알림' },
  { key: 'reg', label: '원서접수 알림', desc: '접수 D-3 · 시작일 · 마감일' },
];

export default function NotifySettings({ prefs, onChange }) {
  const [perm, setPerm] = useState(() => permissionState());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPerm(permissionState());
  }, []);

  if (!notificationsSupported()) return null;

  const enabled = prefs.enabled && perm === 'granted';

  const enable = async () => {
    const result = await requestPermission();
    setPerm(result);
    if (result === 'granted') {
      onChange({ ...prefs, enabled: true });
      subscribeToPush(); // 서버가 있으면 구독 생성(없으면 no-op)
      setOpen(true);
      showNotification('알림이 켜졌어요', { body: '원서접수·공부 리마인더를 보내드릴게요' });
    }
  };

  const disable = () => onChange({ ...prefs, enabled: false });
  const setToggle = (key, val) => onChange({ ...prefs, [key]: val });

  return (
    <section className="panel notify-card" aria-label="알림 설정">
      <div className="notify-head">
        <span className="notify-title">
          <Icon name="bell" size={18} /> 알림
        </span>
        {enabled ? (
          <button className="btn small" onClick={disable}>
            끄기
          </button>
        ) : perm === 'denied' ? (
          <span className="notify-denied">브라우저에서 차단됨</span>
        ) : (
          <button className="btn small primary" onClick={enable}>
            켜기
          </button>
        )}
      </div>

      {perm === 'denied' && (
        <p className="notify-hint">
          브라우저·기기 설정에서 이 사이트의 알림을 허용하면 원서접수·공부 리마인더를 받을 수 있어요.
        </p>
      )}

      {enabled && (
        <>
          <button
            className="notify-collapse"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {open ? '설정 접기' : '알림 설정 열기'}
          </button>

          {open && (
            <div className="notify-body">
              {TOGGLES.map((t) => (
                <label key={t.key} className="notify-row">
                  <span>
                    <b>{t.label}</b>
                    <em>{t.desc}</em>
                  </span>
                  <input
                    type="checkbox"
                    checked={prefs[t.key] !== false}
                    onChange={(e) => setToggle(t.key, e.target.checked)}
                  />
                </label>
              ))}

              <label className="notify-row">
                <span>
                  <b>리마인더 시각</b>
                  <em>이 시각 이후 미완이면 알림</em>
                </span>
                <input
                  type="time"
                  value={prefs.remindTime || '20:00'}
                  onChange={(e) => onChange({ ...prefs, remindTime: e.target.value })}
                />
              </label>

              <button
                className="btn small"
                onClick={() => showNotification('테스트 알림', { body: '이렇게 알림이 도착해요' })}
              >
                테스트 알림 보내기
              </button>

              <p className="notify-note">
                앱을 열 때 조건에 맞는 리마인더가 표시돼요. 앱을 완전히 닫은 상태의 실시간 푸시는
                푸시 서버 연동 시 활성화됩니다.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
