import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentAPI, notificationAPI } from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import './ClientDashboard.css';

const ClientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [appointmentsRes, notificationsRes] = await Promise.all([
        appointmentAPI.getClientAppointments(),
        notificationAPI.getNotifications(),
      ]);
      setAppointments(appointmentsRes.data);
      setNotifications(notificationsRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingAppointments = appointments.filter(
    app => ['pending', 'accepted'].includes(app.status)
  ).slice(0, 3);

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-pending',
      accepted: 'badge-accepted',
      rejected: 'badge-rejected',
      completed: 'badge-completed',
      cancelled: 'badge-rejected',
    };
    return <span className={`badge ${statusClasses[status] || ''}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header fade-in">
          <div>
            <h1>{t('nav_dashboard')}</h1>
            <p className="text-muted">{t('dash_welcome')} {t('dash_client_msg')}</p>
          </div>
          <Link to="/client/book" className="btn btn-primary">
            {t('nav_book')}
          </Link>
        </div>

        <div className="dashboard-grid">
          {/* Upcoming Section */}
          <div className="dashboard-main slide-in-left">
            <section className="dashboard-section card">
              <div className="section-header">
                <h2>{t('dash_upcoming')}</h2>
                <Link to="/client/appointments" className="btn btn-ghost btn-sm">{t('dash_view_all')}</Link>
              </div>
              
              {upcomingAppointments.length > 0 ? (
                <div className="appointment-list">
                  {upcomingAppointments.map(app => (
                    <div key={app.id} className="appointment-item-card">
                      <div className="app-date-box">
                        <span className="app-month">
                          {new Date(app.appointment_date).toLocaleString(language === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'short' })}
                        </span>
                        <span className="app-day">
                          {new Date(app.appointment_date).getDate()}
                        </span>
                      </div>
                      <div className="app-details">
                        <h4>{t(app.service_name)}</h4>
                        <p>{app.appointment_time} • {app.barber_name || t('book_any_barber')}</p>
                      </div>
                      <div className="app-status">
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>{t('dash_no_upcoming')}</p>
                  <Link to="/client/book" className="text-accent">{t('dash_book_today')}</Link>
                </div>
              )}
            </section>
          </div>

          {/* Notifications Section */}
          <div className="dashboard-sidebar slide-in-right">
            <section className="dashboard-section card">
              <div className="section-header">
                <h2>{t('dash_notifications')}</h2>
              </div>
              
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map(note => (
                    <div key={note.id} className={`notification-item ${!note.is_read ? 'unread' : ''}`}>
                      <div className="notification-dot"></div>
                      <div className="notification-content">
                        <h5>{note.title}</h5>
                        <p>{note.message}</p>
                        <span className="notification-time">
                          {new Date(note.created_at).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center p-md">---</p>
                )}
              </div>
            </section>

            {/* Quick Stats */}
            <div className="quick-stats mt-md">
              <div className="stat-card card">
                <span className="stat-label">{t('dash_total_visits')}</span>
                <span className="stat-value">{appointments.filter(a => a.status === 'completed').length}</span>
              </div>
              <div className="stat-card card">
                <span className="stat-label">{t('dash_pref_service')}</span>
                <span className="stat-value">
                  {appointments.length > 0 
                    ? appointments[0].service_name 
                    : '---'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
