import { useState, useEffect } from 'react';
import { appointmentAPI } from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import './ClientAppointments.css';

const ClientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await appointmentAPI.getClientAppointments();
      setAppointments(res.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

  return (
    <div className="appointments-page container">
      <div className="section-header fade-in">
        <h1>{t('nav_appointments')}</h1>
        <p className="text-muted">{t('dash_client_msg')}</p>
      </div>

      <div className="appointments-list slide-in-bottom">
        {appointments.length > 0 ? (
          <div className="card app-table-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin_table_service')}</th>
                    <th>{t('nav_team')}</th>
                    <th>{t('admin_table_date')}</th>
                    <th>{t('admin_revenue')}</th>
                    <th>{t('admin_table_status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(app => (
                    <tr key={app.id}>
                      <td>
                        <span className="font-600">{t(app.service_name)}</span>
                      </td>
                      <td>{app.barber_name || t('book_any_barber')}</td>
                      <td>
                        <div className="date-cell">
                          <span>{app.appointment_date}</span>
                          <small>{app.appointment_time}</small>
                        </div>
                      </td>
                      <td>${app.service_price}</td>
                      <td>{getStatusBadge(app.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state card">
            <p>{t('dash_no_upcoming')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientAppointments;
