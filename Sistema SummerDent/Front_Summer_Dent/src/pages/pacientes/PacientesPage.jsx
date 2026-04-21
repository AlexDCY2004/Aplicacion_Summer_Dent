import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPacientes, createPaciente, updatePaciente, deletePaciente } from '../../services/api/pacientes';
import PacientesTable from '../../components/pacientes/PacientesTable';
import PacienteModal from '../../components/pacientes/PacienteModal';
import ErrorState from '../../components/feedback/ErrorState';
import LoadingState from '../../components/feedback/LoadingState';

export default function PacientesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const { data: pacientes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['pacientes'],
    queryFn: fetchPacientes
  });

  const filteredPacientes = pacientes.filter(p => {
    const fullName = `${p.nombre} ${p.apellido}`.toLowerCase();
    const cedula = (p.id_cedula || '').toString();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || cedula.includes(search);
  });

  const handleNewPaciente = () => {
    setSelectedPaciente(null);
    setIsModalOpen(true);
  };

  const handleEditPaciente = (paciente) => {
    setSelectedPaciente({
      ...paciente,
      fecha_nacimiento: paciente.fecha_nacimiento ? 
        new Date(paciente.fecha_nacimiento).toISOString().split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleDeletePaciente = async (paciente) => {
    if (confirm(`¿Eliminar a ${paciente.nombre} ${paciente.apellido}?`)) {
      try {
        await deletePaciente(paciente.id_cedula);
        queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      } catch (err) {
        setError('Error al eliminar el paciente');
        console.error(err);
      }
    }
  };

  const handleViewPaciente = (paciente) => {
    alert(`Paciente: ${paciente.nombre} ${paciente.apellido}\nCédula: ${paciente.id_cedula}\nTeléfono: ${paciente.telefono || 'N/A'}\nDirección: ${paciente.direccion || 'N/A'}`);
  };

  const handleSubmitModal = async (formData) => {
    setIsSaving(true);
    setError(null);
    try {
      if (selectedPaciente?.id_cedula) {
        await updatePaciente(selectedPaciente.id_cedula, formData);
      } else {
        await createPaciente(formData);
      }
      setIsModalOpen(false);
      setSelectedPaciente(null);
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el paciente');
      console.error(err);
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
          <h1>Gestión de Pacientes</h1>
          <p>Administra los pacientes del consultorio</p>
        </div>
        <button className="btn btn-primary" onClick={handleNewPaciente}>
          + Nuevo Paciente
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="search-container">
        <svg
          className="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nombre o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <PacientesTable
          pacientes={filteredPacientes}
          onEdit={handleEditPaciente}
          onDelete={handleDeletePaciente}
          onView={handleViewPaciente}
          isLoading={false}
        />
      )}

      <PacienteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPaciente(null);
        }}
        onSubmit={handleSubmitModal}
        initialData={selectedPaciente}
        isLoading={isSaving}
      />
    </div>
  );
}
