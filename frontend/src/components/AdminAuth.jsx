import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Shield, ArrowLeft } from 'lucide-react';

function AdminAuth({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const storedPassword = localStorage.getItem('adminPassword') || 'CHANGE_ME_NOW';

    if (password === storedPassword) {
      onLogin();
    } else {
      setError('Неверный пароль доступа');
      setPassword('');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <Shield size={48} style={{ marginBottom: '1rem' }} />
          <div>OpenRoadMap</div>
        </div>
        <p className="auth-subtitle">Введите пароль администратора</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              className="form-input"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          
          {error && (
            <p style={{ color: 'var(--accent-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </p>
          )}
          
          <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            <Lock size={16} />
            {loading ? 'Проверка...' : 'Войти'}
          </button>
        </form>

        <Link to="/" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          На главную
        </Link>
      </div>
    </div>
  );
}

export default AdminAuth;
