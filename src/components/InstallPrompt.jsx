import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

const DISMISS_KEY = 'exam-master-install-dismissed';

// 이미 설치(스탠드얼론)된 상태인지
function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
}

/**
 * 홈 화면에 앱 추가 안내.
 * - 안드로이드/크롬: beforeinstallprompt 를 잡아 "설치" 버튼 제공
 * - iOS 사파리: 이벤트가 없으므로 공유→홈 화면에 추가 안내 표시
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === 'accepted') setInstalled(true);
    else close();
  };

  if (installed || dismissed) return null;

  // 안드로이드/크롬: 네이티브 설치 프롬프트 가능
  if (deferred) {
    return (
      <div className="install-banner" role="dialog" aria-label="앱 설치 안내">
        <span className="ib-icon"><Icon name="phone" size={22} /></span>
        <div className="ib-body">
          <div className="ib-title">시험 마스터를 앱으로 설치하세요</div>
          <div className="ib-desc">홈 화면에서 바로 열고, 오프라인에서도 사용할 수 있어요</div>
        </div>
        <button className="btn ib-cta" onClick={install}>
          홈 화면에 추가
        </button>
        <button className="ib-close" onClick={close} aria-label="닫기">
          ×
        </button>
      </div>
    );
  }

  // iOS 사파리: 수동 안내
  if (isIOS()) {
    return (
      <div className="ios-guide">
        <button className="ib-close" onClick={close} aria-label="닫기">
          ×
        </button>
        <strong>앱처럼 쓰기</strong> — 사파리 하단 <strong>공유 버튼</strong>을 누르고{' '}
        <strong>‘홈 화면에 추가’</strong>를 선택하면 홈 화면에서 바로 열려요.
      </div>
    );
  }

  return null;
}
