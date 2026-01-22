import { useState, useEffect } from 'react';
import { appointmentAPI, serviceAPI } from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    totalToday: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await appointmentAPI.getAdminAppointments();
      const allAppts = res.data;
      
      setAppointments(allAppts);
      
      const pendingCount = allAppts.filter(a => a.status === 'pending').length;
      const todayAppts = allAppts.filter(a => a.appointment_date === today);
      const totalRevenue = allAppts
        .filter(a => a.status === 'completed' || a.status === 'accepted')
        .reduce((sum, a) => sum + (a.service_price || 0), 0);

      setStats({
        pending: pendingCount,
        totalToday: todayAppts.length,
        revenue: totalRevenue,
      });
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if (status === 'rejected') {
      const confirmMsg = language === 'ar' 
        ? 'هل أنت متأكد من رفض هذا الموعد؟' 
        : 'Êtes-vous sûr de vouloir refuser ce rendez-vous ?';
      if (!window.confirm(confirmMsg)) return;
    }
    
    try {
      await appointmentAPI.updateStatus(id, { status });
      loadDashboardData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

  return (
    <div className="admin-page">
      <div className="container container-wide">
        <div className="admin-header fade-in">
          <h1>{t('admin_recent')}</h1>
          <div className="header-actions">
            <button className="btn btn-secondary btn-sm" onClick={loadDashboardData}>{t('admin_refresh')}</button>
          </div>
        </div>

        <div className="stats-header-grid slide-in-left">
          <div className="stat-box card">
            <div className="stat-icon">🕒</div>
            <div className="stat-content">
              <span className="stat-label">{t('admin_pending')}</span>
              <span className="stat-value text-accent">{stats.pending}</span>
            </div>
          </div>
          <div className="stat-box card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <span className="stat-label">{t('admin_today')}</span>
              <span className="stat-value">{stats.totalToday}</span>
            </div>
          </div>
          <div className="stat-box card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-label">{t('admin_revenue')}</span>
              <span className="stat-value">${stats.revenue}</span>
            </div>
          </div>
        </div>

        <div className="admin-content-grid mt-xl">
          <div className="admin-main card fade-in">
            <div className="section-header">
              <h2>{t('admin_recent')}</h2>
            </div>
            
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin_table_client')}</th>
                    <th>{t('admin_table_service')}</th>
                    <th>{t('admin_table_date')}</th>
                    <th>{t('admin_table_status')}</th>
                    <th>{t('admin_table_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.slice(0, 10).map(app => (
                    <tr key={app.id}>
                      <td>
                        <div className="client-cell">
                          <span className="client-name">{app.client_name}</span>
                          <span className="client-email">{app.client_email}</span>
                        </div>
                      </td>
                      <td>{t(app.service_name)}</td>
                      <td>
                        <div className="date-cell">
                          <span>{app.appointment_date}</span>
                          <small>{app.appointment_time}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${app.status}`}>{app.status}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {app.status === 'pending' && (
                            <>
                              <button 
                                className="btn-icon btn-accept" 
                                onClick={() => handleStatusUpdate(app.id, 'accepted')}
                              >✓</button>
                              <button 
                                className="btn-icon btn-reject" 
                                onClick={() => handleStatusUpdate(app.id, 'rejected')}
                              >✕</button>
                            </>
                          )}
                          {app.status === 'accepted' && (
                            <button 
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleStatusUpdate(app.id, 'completed')}
                            >{t('admin_complete')}</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
