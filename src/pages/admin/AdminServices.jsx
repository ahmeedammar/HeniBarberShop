import { useState, useEffect } from 'react';
import { serviceAPI } from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import './AdminServices.css';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', duration: '', description: '' });
  const { t } = useLanguage();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const res = await serviceAPI.getServices();
      setServices(res.data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service) => {
    setIsEditing(service.id);
    setFormData({ 
      name: service.name, 
      price: service.price, 
      duration: service.duration, 
      description: service.description 
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing === 'new') {
        await serviceAPI.createService(formData);
      } else {
        await serviceAPI.updateService(isEditing, formData);
      }
      setIsEditing(null);
      loadServices();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="admin-services-page container">
      <div className="section-header">
        <h1>{t('nav_services')}</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setIsEditing('new'); setFormData({ name: '', price: '', duration: '', description: '' }); }}>
          + {t('register_btn')}
        </button>
      </div>

      <div className="services-list-admin card">
        {services.map(service => (
          <div key={service.id} className="service-admin-item">
            <div className="info">
              <h3>{t(service.name)}</h3>
              <p>{t(service.description)}</p>
              <div className="meta">
                <span>💰 ${service.price}</span>
                <span>⏱ {service.duration} {t('service_duration')}</span>
              </div>
            </div>
            <div className="actions">
              <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(service)}>{t('admin_table_actions')}</button>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h2>{isEditing === 'new' ? t('nav_services') : t('admin_table_actions')}</h2>
            <form onSubmit={handleSave} className="admin-form">
              <div className="input-group">
                <label className="input-label">{t('admin_table_service')}</label>
                <input 
                  className="input" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">{t('admin_revenue')} ($)</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    required 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('service_duration')} (min)</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={formData.duration} 
                    onChange={e => setFormData({...formData, duration: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">{t('admin_table_service')}</label>
                <textarea 
                  className="input" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(null)}>{t('admin_refresh')}</button>
                <button type="submit" className="btn btn-primary">{t('admin_complete')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
