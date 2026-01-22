import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { serviceAPI, barberAPI } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import './Home.css';

const Home = () => {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const { t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  const loadData = async () => {
    try {
      const [servicesRes, barbersRes] = await Promise.all([
        serviceAPI.getServices(),
        barberAPI.getBarbers(),
      ]);
      setServices(servicesRes.data);
      setBarbers(barbersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-logo-reveal">
              <img src="/src/assets/ba7.png" alt="Logo Reveal" className="hero-logo-big" />
            </div>
            <h1 className="hero-title fade-in">
              {t('hero_title_1')}<br />
              <span className="text-accent">{t('hero_title_2')}</span>
            </h1>
            <p className="hero-subtitle">
              {t('hero_subtitle')}
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                {t('hero_btn_book')}
              </Link>
              <Link to="#services" className="btn btn-secondary btn-lg">
                {t('hero_btn_services')}
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-scroll">
          <span>{t('hero_scroll')}</span>
          <div className="scroll-indicator"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card slide-in-left">
              <div className="feature-icon">✂️</div>
              <h3>{t('features_barbers_title')}</h3>
              <p>{t('features_barbers_desc')}</p>
            </div>
            <div className="feature-card fade-in">
              <div className="feature-icon">⭐</div>
              <h3>{t('features_premium_title')}</h3>
              <p>{t('features_premium_desc')}</p>
            </div>
            <div className="feature-card slide-in-right">
              <div className="feature-icon">📅</div>
              <h3>{t('features_booking_title')}</h3>
              <p>{t('features_booking_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('section_services_title')}</h2>
            <p className="section-subtitle">
              {t('section_services_subtitle')}
            </p>
          </div>

          <div className="services-grid">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="service-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="service-header">
                  <h3>{t(service.name)}</h3>
                  <span className="service-price">${service.price}</span>
                </div>
                <p className="service-description">{t(service.description)}</p>
                <div className="service-footer">
                  <span className="service-duration">⏱ {service.duration} {t('service_duration')}</span>
                  <Link to="/register" className="btn btn-ghost btn-sm">
                    {t('service_book_now')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="team">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('section_team_title')}</h2>
            <p className="section-subtitle">
              {t('section_team_subtitle')}
            </p>
          </div>

          <div className="team-grid">
            {barbers.map((barber, index) => (
              <div
                key={barber.id}
                className="barber-card"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="barber-image">
                  {barber.image_url ? (
                    <img src={barber.image_url} alt={barber.name} className="barber-img" />
                  ) : (
                    <div className="barber-avatar">
                      {barber.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="barber-info">
                  <h3 className="barber-name">{barber.name}</h3>
                  <p className="barber-specialty">{t(barber.specialty)}</p>
                  <p className="barber-bio">{t(barber.bio)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <div className="contact-content">
            <div className="contact-info">
              <h2>{t('section_contact_title')}</h2>
              <div className="info-item">
                <strong>📍 {t('contact_location')}</strong>
                <p>Rte Lafrane Km 0.5 , Sfax , Tunisie</p>
                <a 
                  href="https://maps.app.goo.gl/atmyQ1euwjH1kRSy6" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  {t('nav_contact')} →
                </a>
              </div>
              <div className="info-item">
                <strong>⏰ {t('contact_hours')}</strong>
                <p>Lundi - Samedi<br />9:00 AM - 7:00 PM</p>
              </div>
              <div className="info-item">
                <strong>📞 {t('contact_phone')}</strong>
                <p>Tél: (+216) 23 063 649<br />Email: heninjeh@gmail.com</p>
              </div>

              <div className="google-maps-embed">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1957.2655926228365!2d10.751089400000001!3d34.743670200000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1301d31a46874a2f%3A0x63a2be821385af29!2sHeni%20Barber%20Shop!5e1!3m2!1sen!2stn!4v1769118554822!5m2!1sen!2stn" 
                  width="100%" 
                  height="250" 
                  style={{ border: 0, borderRadius: '12px' }} 
                  allowFullScreen={true}
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            <div className="contact-cta">
              <h3>{t('contact_cta_title')}</h3>
              <p>{t('contact_cta_desc')}</p>
              <Link to="/register" className="btn btn-primary btn-lg">
                {t('hero_btn_book')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo-container">
                <img src="/src/assets/ba7.png" alt="BA7 Logo" className="footer-logo-img" />
              </div>
              <span className="brand-text">HENI BARBERSHOP</span>
            </div>
            <p className="footer-text">
              {t('footer_copy')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
