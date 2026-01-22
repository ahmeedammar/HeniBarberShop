import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      if (isAdmin()) {
        navigate('/admin/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card fade-in">
          <div className="auth-header">
            <h1>{t('login_title')}</h1>
            <p>{t('login_subtitle')}</p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="email" className="input-label">
                {t('login_email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="input"
                placeholder={t('login_email')}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">
                {t('login_password')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="input"
                placeholder={t('login_password')}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '...' : t('login_btn')}
            </button>
          </form>

          <div className="auth-footer">
            <p>{t('login_footer')}</p>
            <Link to="/register" className="auth-link">
              {t('login_register_link')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
