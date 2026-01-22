import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceAPI, barberAPI, appointmentAPI } from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import './BookAppointment.css';

const BookAppointment = () => {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t, language } = useLanguage();
  
  const [formData, setFormData] = useState({
    serviceId: '',
    barberId: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.appointmentDate) {
      loadAvailableSlots();
    }
  }, [formData.appointmentDate, formData.barberId]);

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
      setError('Failed to load services and barbers');
    }
  };

  const loadAvailableSlots = async () => {
    try {
      const params = { date: formData.appointmentDate };
      if (formData.barberId) {
        params.barberId = formData.barberId;
      }
      
      const response = await appointmentAPI.getAvailableSlots(params);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await appointmentAPI.createAppointment({
        serviceId: parseInt(formData.serviceId),
        barberId: formData.barberId ? parseInt(formData.barberId) : null,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        notes: formData.notes,
      });

      setSuccess(t('book_success'));
      setTimeout(() => {
        navigate('/client/appointments');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find(s => s.id === parseInt(formData.serviceId));
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="book-page">
      <div className="container container-narrow">
        <div className="book-header fade-in">
          <h1>{t('book_title')}</h1>
          <p>{t('book_subtitle')}</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="book-form">
          {/* Service Selection */}
          <div className="form-section slide-in-left">
            <h3 className="section-title">
              <span className="step-number">1</span>
              {t('book_step_1')}
            </h3>
            <div className="services-selection">
              {services.map((service) => (
                <label
                  key={service.id}
                  className={`service-option ${formData.serviceId == service.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="serviceId"
                    value={service.id}
                    checked={formData.serviceId == service.id}
                    onChange={handleChange}
                    required
                  />
                  <div className="service-option-content">
                    <div className="service-option-header">
                      <h4>{t(service.name)}</h4>
                      <span className="service-option-price">${service.price}</span>
                    </div>
                    <p className="service-option-description">{t(service.description)}</p>
                    <span className="service-option-duration">⏱ {service.duration} {t('service_duration')}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Barber Selection */}
          <div className="form-section fade-in">
            <h3 className="section-title">
              <span className="step-number">2</span>
              {t('book_step_2')}
            </h3>
            <div className="barbers-selection">
              <label className={`barber-option ${!formData.barberId ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="barberId"
                  value=""
                  checked={!formData.barberId}
                  onChange={handleChange}
                />
                <div className="barber-option-content">
                  <div className="barber-option-avatar">
                    <span>?</span>
                  </div>
                  <div className="barber-option-info">
                    <h4>{t('book_any_barber')}</h4>
                    <p>{t('book_any_barber_desc')}</p>
                  </div>
                </div>
              </label>
              
              {barbers.map((barber) => (
                <label
                  key={barber.id}
                  className={`barber-option ${formData.barberId == barber.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="barberId"
                    value={barber.id}
                    checked={formData.barberId == barber.id}
                    onChange={handleChange}
                  />
                  <div className="barber-option-content">
                    <div className="barber-option-image">
                      {barber.image_url ? (
                        <img src={barber.image_url} alt={barber.name} className="barber-avatar-sm" />
                      ) : (
                        <div className="barber-avatar">
                          {barber.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="barber-option-info">
                      <h4>{barber.name}</h4>
                      <p>{t(barber.specialty)}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="form-section slide-in-right">
            <h3 className="section-title">
              <span className="step-number">3</span>
              {t('book_step_3')}
            </h3>
            
            <div className="input-group">
              <label htmlFor="appointmentDate" className="input-label">
                {t('admin_table_date')}
              </label>
              <input
                type="date"
                id="appointmentDate"
                name="appointmentDate"
                className="input"
                min={today}
                value={formData.appointmentDate}
                onChange={handleChange}
                required
              />
            </div>

            {formData.appointmentDate && (
              <div className="input-group">
                <label className="input-label">
                  {t('book_time_slots')}
                </label>
                {availableSlots.length > 0 ? (
                  <div className="time-slots">
                    {availableSlots.map((slot) => (
                      <label
                        key={slot}
                        className={`time-slot ${formData.appointmentTime === slot ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="appointmentTime"
                          value={slot}
                          checked={formData.appointmentTime === slot}
                          onChange={handleChange}
                          required
                        />
                        <span>{slot}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">{t('book_no_slots')}</p>
                )}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="form-section fade-in">
            <h3 className="section-title">
              <span className="step-number">4</span>
              {t('book_step_4')}
            </h3>
            <textarea
              name="notes"
              className="input"
              placeholder="..."
              value={formData.notes}
              onChange={handleChange}
              rows="4"
            />
          </div>

          {/* Summary & Submit */}
          {selectedService && formData.appointmentTime && (
            <div className="booking-summary">
              <h3>{t('book_summary')}</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">{t('admin_table_service')}:</span>
                  <span className="summary-value">{t(selectedService.name)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">{t('admin_revenue')}:</span>
                  <span className="summary-value">${selectedService.price}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Duration:</span>
                  <span className="summary-value">{selectedService.duration} {t('service_duration')}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">{t('admin_table_date')}:</span>
                  <span className="summary-value">
                    {new Date(formData.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Time:</span>
                  <span className="summary-value">{formData.appointmentTime}</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading || !formData.serviceId || !formData.appointmentDate || !formData.appointmentTime}
          >
            {loading ? '...' : t('book_confirm')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
