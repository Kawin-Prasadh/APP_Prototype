import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { User, ActiveScreen } from '../types';

interface HeaderProps {
  currentUser: User | null;
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  hasActiveOrder: boolean;
  onSwitchRole: (role: 'student' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeScreen,
  onNavigate,
  onLogout,
  hasActiveOrder,
  onSwitchRole,
}) => {
  const [currentTime, setCurrentTime] = useState(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="topbar">
      <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap">
        <button
          className="brand"
          onClick={() => {
            if (!currentUser) onNavigate('login');
            else if (currentUser.role === 'admin') onNavigate('admin');
            else onNavigate('student');
          }}
          aria-label="Night Mess Home"
        >
          <span>✦</span> NIGHT MESS
        </button>

        {/* Time display placed directly near Night Mess */}
        <div
          id="nightMessTime"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fff2dc] text-[#17253a] border border-[#ebd8bc] shadow-xs"
          title="Campus Night Mess dinner hours (10:30 PM – 12:30 AM) and live clock"
        >
          <Clock className="w-3.5 h-3.5 text-[#ff7759]" />
          <span className="font-mono font-bold text-[#17253a]">{currentTime}</span>
          <span className="text-[#c0b39f]">•</span>
          <span className="text-[#13736d] font-bold">10:30 PM – 12:30 AM</span>
        </div>
      </div>

      <div id="topActions" className="flex items-center gap-2 sm:gap-3">
        {currentUser ? (
          <>
            {currentUser.role === 'student' && (
              <>
                <span className="hidden sm:inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-[#e8f1f5] text-[#17253a] border border-[#d2dfeb]">
                  🏠 {currentUser.block} Mess
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('student')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${
                    activeScreen === 'student'
                      ? 'bg-[#17253a] text-white'
                      : 'text-[#17253a] hover:bg-[#fff2dc]'
                  }`}
                >
                  Menu
                </button>
                {hasActiveOrder && (
                  <button
                    type="button"
                    onClick={() => onNavigate('pass')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
                      activeScreen === 'pass'
                        ? 'bg-[#13736d] text-white'
                        : 'bg-[#dff3e5] text-[#0a7054] hover:bg-[#c8efd9]'
                    }`}
                  >
                    <span>🎟️</span> Code
                  </button>
                )}
              </>
            )}

            {currentUser.role === 'admin' && (
              <span className="demo-badge hidden sm:inline-flex bg-[#17253a] text-white font-bold">
                {currentUser.block} WARDEN CONSOLE
              </span>
            )}

            <button
              type="button"
              className="profile-chip text-xs sm:text-sm"
              onClick={onLogout}
              title={`Logged in as ${currentUser.name} (${currentUser.id} - ${currentUser.block})`}
            >
              {currentUser.id} ({currentUser.block}) • Logout
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="demo-badge">CAMPUS DINING</span>
            <button
              type="button"
              onClick={() => onSwitchRole('student')}
              className="quick-fill-btn"
              title="Sign in as Block A student (STU1023)"
            >
              Student (Block A)
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole('admin')}
              className="quick-fill-btn"
              title="Sign in as Block A warden (ADMIN-A)"
            >
              Admin (Block A)
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
