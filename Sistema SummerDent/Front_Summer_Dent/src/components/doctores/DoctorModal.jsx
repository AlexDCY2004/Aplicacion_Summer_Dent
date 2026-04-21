import { useEffect, useState } from 'react';

const initialFormState = {
  nombre: '',
  telefono: '',
  correo: '',
  especialidad: '',
  estado: 'disponible'
};

export default function DoctorModal({ isOpen, onClose, onSubmit, initialData, isLoading }) {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        telefono: initialData.telefono || '',
        correo: initialData.correo || '',
        especialidad: initialData.especialidad || '',
        estado: initialData.estado || 'disponible'
      });
      setErrors({});
      return;
    }

    setFormData(initialFormState);
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.nombre.trim()) {
      nextErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.telefono.trim()) {
      nextErrors.telefono = 'El teléfono es obligatorio';
    } else if (!/^\d{10}$/.test(formData.telefono.trim())) {
      nextErrors.telefono = 'El teléfono debe tener 10 dígitos';
    }

    if (!formData.correo.trim()) {
      nextErrors.correo = 'El correo es obligatorio';
    }

    if (!formData.especialidad.trim()) {
      nextErrors.especialidad = 'La especialidad es obligatoria';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      nombre: formData.nombre.trim(),
      telefono: formData.telefono.trim(),
      correo: formData.correo.trim(),
      especialidad: formData.especialidad.trim(),
      estado: formData.estado
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData?.id ? 'Editar Odontólogo' : 'Nuevo Odontólogo'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="doctor-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre completo *</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Dr. Juan Pérez"
              className={errors.nombre ? 'input-error' : ''}
            />
            {errors.nombre && <span className="error-text">{errors.nombre}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telefono">Teléfono *</label>
              <input
                id="telefono"
                name="telefono"
                type="text"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="0991234567"
                className={errors.telefono ? 'input-error' : ''}
              />
              {errors.telefono && <span className="error-text">{errors.telefono}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="correo">Correo *</label>
              <input
                id="correo"
                name="correo"
                type="email"
                value={formData.correo}
                onChange={handleChange}
                placeholder="doctor@summerdent.com"
                className={errors.correo ? 'input-error' : ''}
              />
              {errors.correo && <span className="error-text">{errors.correo}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="especialidad">Especialidad *</label>
              <input
                id="especialidad"
                name="especialidad"
                type="text"
                value={formData.especialidad}
                onChange={handleChange}
                placeholder="Ortodoncia"
                className={errors.especialidad ? 'input-error' : ''}
              />
              {errors.especialidad && <span className="error-text">{errors.especialidad}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select id="estado" name="estado" value={formData.estado} onChange={handleChange}>
                <option value="disponible">Disponible</option>
                <option value="no disponible">No disponible</option>
                <option value="eventual">Eventual</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
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
