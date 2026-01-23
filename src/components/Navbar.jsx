import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/ba7.png';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <div className="brand-logo-container">
              <img src={logo} alt="BA7 Logo" className="brand-logo-img animated-logo" />
            </div>
            <span className="brand-text">HENI BARBERSHOP</span>
          </Link>

          <div className="navbar-menu">
            {!isAuthenticated ? (
              <>
                <Link to="/" className="nav-link">{t('nav_home')}</Link>
                <Link to="/#services" className="nav-link">{t('nav_services')}</Link>
                <Link to="/#team" className="nav-link">{t('nav_team')}</Link>
                <Link to="/#contact" className="nav-link">{t('nav_contact')}</Link>
                
                {/* Language Switcher */}
                <div className="lang-switcher">
                  <button 
                    className={`lang-btn ${language === 'fr' ? 'active' : ''}`} 
                    onClick={() => toggleLanguage('fr')}
                  >FR</button>
                  <span className="lang-divider">|</span>
                  <button 
                    className={`lang-btn ${language === 'ar' ? 'active' : ''}`} 
                    onClick={() => toggleLanguage('ar')}
                  >AR</button>
                </div>

                <Link to="/login" className="btn btn-secondary btn-sm">{t('nav_login')}</Link>
                <Link to="/register" className="btn btn-primary btn-sm">{t('nav_book')}</Link>
              </>
            ) : (
              <>
                {user.role === 'admin' ? (
                  <>
                    <Link to="/admin/dashboard" className="nav-link">{t('nav_dashboard')}</Link>
                    <Link to="/admin/appointments" className="nav-link">{t('nav_appointments')}</Link>
                    <Link to="/admin/services" className="nav-link">{t('nav_services')}</Link>
                  </>
                ) : (
                  <>
                    <Link to="/client/dashboard" className="nav-link">{t('nav_dashboard')}</Link>
                    <Link to="/client/book" className="nav-link">{t('nav_book')}</Link>
                    <Link to="/client/appointments" className="nav-link">{t('nav_appointments')}</Link>
                  </>
                )}

                <div className="lang-switcher">
                  <button 
                    className={`lang-btn ${language === 'fr' ? 'active' : ''}`} 
                    onClick={() => toggleLanguage('fr')}
                  >FR</button>
                  <span className="lang-divider">|</span>
                  <button 
                    className={`lang-btn ${language === 'ar' ? 'active' : ''}`} 
                    onClick={() => toggleLanguage('ar')}
                  >AR</button>
                </div>

                <div className="navbar-user">
                  <span className="user-name">{user.fullName}</span>
                  <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                    {t('nav_logout')}
                  </button>
                </div>
              </>
            )}
          </div>

          <button className="navbar-toggle">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
