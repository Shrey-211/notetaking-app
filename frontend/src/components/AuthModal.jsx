import React, { useState } from 'react';
import { User, Lock, UserPlus, LogIn, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export const AuthModal = ({ onAuthSuccess, showToast }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in both username and password.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await api.register(username, password, fullName);
        showToast('Registration successful! Welcome to NotePulse.', 'success');
      } else {
        res = await api.login(username, password);
        showToast(`Welcome back, ${res.user.full_name || res.user.username}!`, 'success');
      }

      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Authentication failed.');
      showToast(err.message || 'Authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card glass-panel animate-pop-in">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Sparkles size={24} className="auth-logo-icon" />
          </div>
          <h2>NotePulse Workspace</h2>
          <p className="auth-subtitle">
            {isRegister
              ? 'Create a secure isolated account to get started'
              : 'Sign in to access your persistent personal notes'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
          >
            <LogIn size={16} /> Login
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
          >
            <UserPlus size={16} /> Register
          </button>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label>Full Name (Optional)</label>
              <div className="input-icon-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  className="glass-input with-icon"
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Username *</label>
            <div className="input-icon-wrapper">
              <User size={16} className="input-icon" />
              <input
                type="text"
                required
                className="glass-input with-icon"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password *</label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="glass-input with-icon"
                placeholder="Enter password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary auth-submit-btn"
          >
            {loading ? (
              <span className="spinner"></span>
            ) : isRegister ? (
              <>Create Account <UserPlus size={18} /></>
            ) : (
              <>Sign In <LogIn size={18} /></>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <ShieldCheck size={14} className="security-icon" />
          <span>All notes are encrypted in flight & isolated per user in Docker PostgreSQL</span>
        </div>
      </div>
    </div>
  );
};
