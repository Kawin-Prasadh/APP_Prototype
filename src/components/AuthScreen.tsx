import React, { useState } from 'react';
import { User } from '../types';
import { MessStore } from '../services/store';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  showToast: (msg: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, showToast }) => {
  const [loginId, setLoginId] = useState('STU1023');
  const [loginPassword, setLoginPassword] = useState('demo123');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedId = loginId.trim().toUpperCase();
    const users = MessStore.getUsers();
    const found = users.find((u) => u.id.toUpperCase() === trimmedId);

    if (!found) {
      setLoginError(
        `College ID "${trimmedId}" is not registered in the mess database. Student accounts are added exclusively by your Hostel Block Warden/Admin.`
      );
      return;
    }

    if (loginPassword !== 'demo123' && loginPassword.length < 4) {
      setLoginError('Please enter your password (default: demo123)');
      return;
    }

    MessStore.setCurrentUser(found);
    showToast(`Welcome back, ${found.name} (${found.block})!`);
    onLoginSuccess(found);
  };

  const fillCredentials = (id: string, pass = 'demo123') => {
    setLoginId(id);
    setLoginPassword(pass);
    setLoginError('');
  };

  return (
    <section id="login" className="screen active auth-screen flex justify-center items-center py-8">
      <form id="loginForm" className="auth-card w-full max-w-lg mx-auto" onSubmit={handleLogin}>
        <div className="flex items-center justify-between pb-2 border-b border-[#eee5d6] mb-4">
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>AUTHORISED SIGN IN</p>
            <h2 style={{ margin: '4px 0 0', fontSize: '24px' }}>Sign in to Night Mess</h2>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#fff2dc] text-[#17253a] border border-[#ebd8bc]">
            10:30 PM – 12:30 AM
          </span>
        </div>

        <p className="auth-description">
          Sign in with your campus College ID or Warden Admin ID. Student accounts are provisioned exclusively by your Block Mess Admin.
        </p>

        <label htmlFor="userId">
          College ID or Admin ID
          <input
            id="userId"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username"
            required
            placeholder="e.g. STU1023 or ADMIN-A"
          />
        </label>

        {/* Quick Demo Selector for Block Testing */}
        <div className="bg-[#fffaf0] border border-[#e9dfce] p-3 rounded-xl my-3">
          <p className="text-[11px] font-bold text-[#13736d] uppercase tracking-wider mb-2">
            Quick Demo Logins (Click to Test Blocks):
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[#69768a] font-semibold w-16">Students:</span>
              <button
                type="button"
                className="quick-fill-btn text-xs"
                onClick={() => fillCredentials('STU1023')}
              >
                STU1023 (Block A)
              </button>
              <button
                type="button"
                className="quick-fill-btn text-xs"
                onClick={() => fillCredentials('STU2045')}
              >
                STU2045 (Block B)
              </button>
              <button
                type="button"
                className="quick-fill-btn text-xs"
                onClick={() => fillCredentials('STU3089')}
              >
                STU3089 (Block C)
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[#69768a] font-semibold w-16">Admins:</span>
              <button
                type="button"
                className="quick-fill-btn text-xs bg-[#f4ebe1]"
                onClick={() => fillCredentials('ADMIN-A')}
              >
                ADMIN-A (Block A)
              </button>
              <button
                type="button"
                className="quick-fill-btn text-xs bg-[#f4ebe1]"
                onClick={() => fillCredentials('ADMIN-B')}
              >
                ADMIN-B (Block B)
              </button>
              <button
                type="button"
                className="quick-fill-btn text-xs bg-[#f4ebe1]"
                onClick={() => fillCredentials('ADMIN-C')}
              >
                ADMIN-C (Block C)
              </button>
            </div>
          </div>
        </div>

        <label htmlFor="password">
          Password
          <input
            id="password"
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <p id="loginHint" className={`field-note ${loginError ? 'text-red-600 font-bold' : ''}`}>
          {loginError || 'Default password for all campus accounts is "demo123".'}
        </p>

        <button className="primary w-full" type="submit">
          Sign in to Mess <b>→</b>
        </button>
      </form>
    </section>
  );
};
