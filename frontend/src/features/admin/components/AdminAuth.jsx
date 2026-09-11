import { apiJson, formatErrorMessage } from '../../../shared/api/client.js';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '../../../shared/context/I18nContext.jsx';
import LanguageSwitcher from '../../../shared/ui/LanguageSwitcher.jsx';

function AdminAuth({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiJson('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      await onLogin();
    } catch (error) {
      setError(error.status === 401 ? t('auth.wrongPassword') : formatErrorMessage(error, t));
      setPassword('');
    } finally { setLoading(false); }

  };

  return (
    <main id="main-content" className="auth-container" tabIndex={-1}>
      <div className="auth-box" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <LanguageSwitcher />
        </div>
        <div className="auth-logo">
          <Shield size={48} style={{ marginBottom: '1rem' }} />
          <div>OpenRoadMap</div>
        </div>
        <p className="auth-subtitle">{t('auth.subtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password-input">
              {t('admin.passwordLabel')}
            </label>
            <div className="auth-password-row">
              <input
                id="admin-password-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                maxLength={1024}
                required
                autoFocus
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={showPassword ? t('adminHidePassword') : t('adminShowPassword')}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ color: 'var(--accent-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            <Lock size={16} />
            {loading ? t('auth.verifying') : t('auth.login')}
          </button>
        </form>

        <Link to="/" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          {t('home')}
        </Link>
      </div>
    </main>
  );
}

export default AdminAuth;
