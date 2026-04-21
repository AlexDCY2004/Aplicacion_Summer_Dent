import { useState, useEffect } from 'react';

export default function CitaModal({ isOpen, onClose, onSubmit, initialData, isLoading, pacientes = [], doctores = [], tratamientos = [] }) {
  const [formData, setFormData] = useState(initialData || {
    id_paciente: '',
    id_doctor: '',
    id_tratamiento: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    precio: '0',
    estado: 'pendiente'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        fecha: initialData.fecha ? initialData.fecha.split('T')[0] : ''
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.id_paciente) newErrors.id_paciente = 'Paciente requerido';
    if (!formData.id_doctor) newErrors.id_doctor = 'Odontólogo requerido';
    if (!formData.fecha) newErrors.fecha = 'Fecha requerida';
    if (!formData.hora_inicio) newErrors.hora_inicio = 'Hora inicio requerida';
    if (!formData.hora_fin) newErrors.hora_fin = 'Hora fin requerida';
    
    if (formData.hora_inicio && formData.hora_fin && formData.hora_inicio >= formData.hora_fin) {
      newErrors.hora_fin = 'Hora fin debe ser posterior a hora inicio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData?.id ? 'Editar Cita' : 'Nueva Cita'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="cita-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="id_paciente">Paciente *</label>
              <select
                id="id_paciente"
                name="id_paciente"
                value={formData.id_paciente}
                onChange={handleChange}
                className={errors.id_paciente ? 'input-error' : ''}
              >
                <option value="">Seleccionar paciente</option>
                {pacientes.map(p => (
                  <option key={p.id_cedula} value={p.id_cedula}>
                    {p.nombre} {p.apellido}
                  </option>
                ))}
              </select>
              {errors.id_paciente && <span className="error-text">{errors.id_paciente}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="id_doctor">Odontólogo *</label>
              <select
                id="id_doctor"
                name="id_doctor"
                value={formData.id_doctor}
                onChange={handleChange}
                className={errors.id_doctor ? 'input-error' : ''}
              >
                <option value="">Seleccionar odontólogo</option>
                {doctores.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} {d.apellido}
                  </option>
                ))}
              </select>
              {errors.id_doctor && <span className="error-text">{errors.id_doctor}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fecha">Fecha *</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className={errors.fecha ? 'input-error' : ''}
              />
              {errors.fecha && <span className="error-text">{errors.fecha}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="hora_inicio">Hora Inicio *</label>
              <input
                type="time"
                id="hora_inicio"
                name="hora_inicio"
                value={formData.hora_inicio}
                onChange={handleChange}
                className={errors.hora_inicio ? 'input-error' : ''}
              />
              {errors.hora_inicio && <span className="error-text">{errors.hora_inicio}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="hora_fin">Hora Fin *</label>
              <input
                type="time"
                id="hora_fin"
                name="hora_fin"
                value={formData.hora_fin}
                onChange={handleChange}
                className={errors.hora_fin ? 'input-error' : ''}
              />
              {errors.hora_fin && <span className="error-text">{errors.hora_fin}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="id_tratamiento">Tratamiento</label>
              <select
                id="id_tratamiento"
                name="id_tratamiento"
                value={formData.id_tratamiento}
                onChange={handleChange}
              >
                <option value="">Seleccionar tratamiento</option>
                {tratamientos.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="precio">Monto</label>
              <input
                type="number"
                id="precio"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="Atendida">Atendida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
