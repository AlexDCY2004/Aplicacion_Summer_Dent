import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCitas, createCita, updateCita, deleteCita } from '../../services/api/citas';
import { fetchPacientes } from '../../services/api/pacientes';
import { fetchDoctores } from '../../services/api/doctores';
import { fetchTratamientos } from '../../services/api/tratamientos';
import CitasTable from '../../components/citas/CitasTable';
import CitaModal from '../../components/citas/CitaModal';
import ErrorState from '../../components/feedback/ErrorState';
import LoadingState from '../../components/feedback/LoadingState';

export default function CitasPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
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
    setIsModalOpen(true);
  };

  const handleEditCita = (cita) => {
    setSelectedCita(cita);
    setIsModalOpen(true);
  };

  const handleDeleteCita = async (cita) => {
    const pacienteNombre = cita.paciente ? `${cita.paciente.nombre} ${cita.paciente.apellido}` : 'Paciente';
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
    const pacienteNombre = cita.paciente ? `${cita.paciente.nombre} ${cita.paciente.apellido}` : 'N/A';
    const doctorNombre = cita.doctor ? `${cita.doctor.nombre} ${cita.doctor.apellido}` : 'N/A';
    const tratamientoNombre = cita.tratamiento?.nombre || 'N/A';
    const fechaFormato = cita.fecha ? new Date(cita.fecha).toLocaleDateString('es-EC') : 'N/A';
    
    alert(
      `Detalles de la Cita\n\n` +
      `Paciente: ${pacienteNombre}\n` +
      `Odontólogo: ${doctorNombre}\n` +
      `Fecha: ${fechaFormato}\n` +
      `Hora: ${cita.hora_inicio || 'N/A'} - ${cita.hora_fin || 'N/A'}\n` +
      `Tratamiento: ${tratamientoNombre}\n` +
      `Estado: ${cita.estado || 'N/A'}\n` +
      `Monto: $${(cita.precio || 0).toFixed(2)}`
    );
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
          onEdit={handleEditCita}
          onDelete={handleDeleteCita}
          onView={handleViewCita}
          isLoading={false}
        />
      )}

      <CitaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCita(null);
        }}
        onSubmit={handleSubmitModal}
        initialData={selectedCita}
        isLoading={isSaving}
        pacientes={pacientes}
        doctores={doctores}
        tratamientos={tratamientos}
      />
    </div>
  );
}
