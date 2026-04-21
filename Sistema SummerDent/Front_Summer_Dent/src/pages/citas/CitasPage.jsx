import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCitas, createCita, updateCita, deleteCita } from '../../services/api/citas';
import { fetchPacientes } from '../../services/api/pacientes';
import { fetchDoctores } from '../../services/api/doctores';
import { fetchTratamientos } from '../../services/api/tratamientos';
import CitasTable from '../../components/citas/CitasTable';
import CitaModal from '../../components/citas/CitaModal';
import ErrorState from '../../components/feedback/ErrorState';
import LoadingState from '../../components/feedback/LoadingState';

const getPacienteNombre = (cita, pacientes) => {
  if (cita.paciente?.nombre) {
    return `${cita.paciente.nombre} ${cita.paciente.apellido}`.trim();
  }

  const paciente = pacientes.find((item) => String(item.id_cedula) === String(cita.id_paciente));
  return paciente ? `${paciente.nombre} ${paciente.apellido}`.trim() : '-';
};

export default function CitasPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const { data: citas = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['citas'],
    queryFn: fetchCitas
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: fetchPacientes
  });

  const { data: doctores = [] } = useQuery({
    queryKey: ['doctores'],
    queryFn: fetchDoctores
  });

  const { data: tratamientos = [] } = useQuery({
    queryKey: ['tratamientos'],
    queryFn: fetchTratamientos
  });

  const handleNewCita = () => {
    setSelectedCita(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditCita = (cita) => {
    setSelectedCita(cita);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteCita = async (cita) => {
    const pacienteNombre = getPacienteNombre(cita, pacientes) !== '-' ? getPacienteNombre(cita, pacientes) : 'Paciente';
    const fechaFormato = cita.fecha ? new Date(cita.fecha).toLocaleDateString('es-EC') : '';
    
    if (confirm(`¿Eliminar cita de ${pacienteNombre} del ${fechaFormato}?`)) {
      try {
        await deleteCita(cita.id);
        queryClient.invalidateQueries({ queryKey: ['citas'] });
      } catch (err) {
        setError('Error al eliminar la cita');
        console.error(err);
      }
    }
  };

  const handleViewCita = (cita) => {
    setSelectedCita(cita);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (formData) => {
    setIsSaving(true);
    setError(null);
    try {
      if (selectedCita?.id) {
        await updateCita(selectedCita.id, formData);
      } else {
        await createCita(formData);
      }
      setIsModalOpen(false);
      setSelectedCita(null);
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la cita');
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
          <h1>Gestión de Citas</h1>
          <p>Administra las citas del consultorio</p>
        </div>
        <button className="btn btn-primary" onClick={handleNewCita}>
          + Nueva Cita
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingState />
      ) : (
        <CitasTable
          citas={citas}
          pacientes={pacientes}
          doctores={doctores}
          tratamientos={tratamientos}
          onEdit={handleEditCita}
          onDelete={handleDeleteCita}
          onView={handleViewCita}
          isLoading={false}
        />
      )}

      <CitaModal
        key={`${modalMode}-${selectedCita?.id || 'new-cita'}-${isModalOpen ? 'open' : 'closed'}`}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCita(null);
          setModalMode('create');
        }}
        onSubmit={handleSubmitModal}
        initialData={selectedCita}
        isLoading={isSaving}
        pacientes={pacientes}
        doctores={doctores}
        tratamientos={tratamientos}
        readOnly={modalMode === 'view'}
        isEditing={modalMode === 'edit'}
      />
    </div>
  );
}
