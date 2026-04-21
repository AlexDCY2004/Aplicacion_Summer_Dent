import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createDoctor, deleteDoctor, fetchDoctores, updateDoctor } from '../../services/api/doctores';
import DoctoresTable from '../../components/doctores/DoctoresTable';
import DoctorModal from '../../components/doctores/DoctorModal';
import ErrorState from '../../components/feedback/ErrorState';

export default function DoctoresPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: doctores = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['doctores'],
    queryFn: fetchDoctores
  });

  const filteredDoctores = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return doctores;

    return doctores.filter((doctor) => {
      const nombre = (doctor.nombre || '').toLowerCase();
      const especialidad = (doctor.especialidad || '').toLowerCase();
      const correo = (doctor.correo || '').toLowerCase();
      const telefono = String(doctor.telefono || '').toLowerCase();

      return (
        nombre.includes(normalizedSearch)
        || especialidad.includes(normalizedSearch)
        || correo.includes(normalizedSearch)
        || telefono.includes(normalizedSearch)
      );
    });
  }, [doctores, searchTerm]);

  const openCreateModal = () => {
    setSelectedDoctor(null);
    setIsViewMode(false);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (doctor) => {
    setSelectedDoctor(doctor);
    setIsViewMode(false);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleDeleteDoctor = async (doctor) => {
    const confirmDelete = window.confirm(`¿Eliminar al odontólogo ${doctor.nombre}?`);
    if (!confirmDelete) return;

    try {
      await deleteDoctor(doctor.id);
      queryClient.invalidateQueries({ queryKey: ['doctores'] });
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'No se pudo eliminar el odontólogo.');
    }
  };

  const handleViewDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setIsViewMode(true);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveDoctor = async (payload) => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      if (selectedDoctor?.id) {
        await updateDoctor(selectedDoctor.id, payload);
      } else {
        await createDoctor(payload);
      }

      setIsModalOpen(false);
      setSelectedDoctor(null);
      queryClient.invalidateQueries({ queryKey: ['doctores'] });
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'No se pudo guardar el odontólogo.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Gestión de Odontólogos</h1>
          <p>Administra los odontólogos del consultorio</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          + Nuevo Odontólogo
        </button>
      </div>

      {errorMessage && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {errorMessage}
        </div>
      )}

      <div className="search-container">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nombre, teléfono, correo o especialidad..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <DoctoresTable
        doctores={filteredDoctores}
        isLoading={isLoading}
        onView={handleViewDoctor}
        onEdit={openEditModal}
        onDelete={handleDeleteDoctor}
      />

      <DoctorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDoctor(null);
          setIsViewMode(false);
        }}
        onSubmit={handleSaveDoctor}
        initialData={selectedDoctor}
        isLoading={isSaving}
        readOnly={isViewMode}
      />
    </div>
  );
}
