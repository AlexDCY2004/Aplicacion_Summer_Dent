import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTratamiento,
  deleteTratamiento,
  fetchTratamientos,
  updateTratamiento
} from '../../services/api/tratamientos';
import TratamientosTable from '../../components/tratamientos/TratamientosTable';
import TratamientoModal from '../../components/tratamientos/TratamientoModal';
import ErrorState from '../../components/feedback/ErrorState';

export default function TratamientosPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTratamiento, setSelectedTratamiento] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: tratamientos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['tratamientos'],
    queryFn: fetchTratamientos
  });

  const filteredTratamientos = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return tratamientos;

    return tratamientos.filter((tratamiento) => {
      const area = (tratamiento.area || '').toLowerCase();
      const nombre = (tratamiento.nombre || '').toLowerCase();
      const descripcion = (tratamiento.descripcion || '').toLowerCase();
      const precio = String(tratamiento.precio || '').toLowerCase();

      return (
        area.includes(normalizedSearch)
        || nombre.includes(normalizedSearch)
        || descripcion.includes(normalizedSearch)
        || precio.includes(normalizedSearch)
      );
    });
  }, [searchTerm, tratamientos]);

  const openCreateModal = () => {
    setSelectedTratamiento(null);
    setIsViewMode(false);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (tratamiento) => {
    setSelectedTratamiento(tratamiento);
    setIsViewMode(false);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleDeleteTratamiento = async (tratamiento) => {
    const confirmDelete = window.confirm(`¿Eliminar el tratamiento ${tratamiento.nombre}?`);
    if (!confirmDelete) return;

    try {
      await deleteTratamiento(tratamiento.id);
      queryClient.invalidateQueries({ queryKey: ['tratamientos'] });
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'No se pudo eliminar el tratamiento.');
    }
  };

  const handleViewTratamiento = (tratamiento) => {
    setSelectedTratamiento(tratamiento);
    setIsViewMode(true);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveTratamiento = async (payload) => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      if (selectedTratamiento?.id) {
        await updateTratamiento(selectedTratamiento.id, payload);
      } else {
        await createTratamiento(payload);
      }

      setIsModalOpen(false);
      setSelectedTratamiento(null);
      queryClient.invalidateQueries({ queryKey: ['tratamientos'] });
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'No se pudo guardar el tratamiento.');
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
          <h1>Gestión de Tratamientos</h1>
          <p>Administra los tratamientos disponibles</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          + Nuevo Tratamiento
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
          placeholder="Buscar por área, nombre, precio o descripción..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <TratamientosTable
        tratamientos={filteredTratamientos}
        isLoading={isLoading}
        onView={handleViewTratamiento}
        onEdit={openEditModal}
        onDelete={handleDeleteTratamiento}
      />

      <TratamientoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTratamiento(null);
          setIsViewMode(false);
        }}
        onSubmit={handleSaveTratamiento}
        initialData={selectedTratamiento}
        isLoading={isSaving}
        readOnly={isViewMode}
      />
    </div>
  );
}
