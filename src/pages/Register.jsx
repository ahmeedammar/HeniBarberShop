import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
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

    if (formData.password !== formData.confirmPassword) {
      setError(t('register_password_mismatch'));
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError(t('register_password_short'));
      setLoading(false);
      return;
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      phone: formData.phone,
    });

    if (result.success) {
      navigate('/client/dashboard');
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
            <h1>{t('register_title')}</h1>
            <p>{t('register_subtitle')}</p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="fullName" className="input-label">
                {t('register_name')} *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="input"
                placeholder={t('register_name')}
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="email" className="input-label">
                {t('login_email')} *
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
              <label htmlFor="phone" className="input-label">
                {t('register_phone')}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="input"
                placeholder={t('register_phone')}
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">
                {t('login_password')} *
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

            <div className="input-group">
              <label htmlFor="confirmPassword" className="input-label">
                {t('register_confirm_password')} *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="input"
                placeholder={t('register_confirm_password')}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '...' : t('register_btn')}
            </button>
          </form>

          <div className="auth-footer">
            <p>{t('register_footer')}</p>
            <Link to="/login" className="auth-link">
              {t('register_login_link')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
