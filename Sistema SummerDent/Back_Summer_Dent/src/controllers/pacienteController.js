import Paciente from '../models/paciente.js';

export const crearPacienteController = async (req, res) => {
  try {
    const { id_cedula, nombre, apellido, fecha_nacimiento, telefono, correo } = req.body;

    if (!id_cedula || !String(id_cedula).trim()) {
      return res.status(400).json({ error: 'La cédula es obligatoria' });
    }

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    if (!apellido || !String(apellido).trim()) {
      return res.status(400).json({ error: 'El apellido es obligatorio' });
    }

    const existente = await Paciente.findByPk(String(id_cedula).trim());
    if (existente) {
      return res.status(409).json({ error: 'Paciente con esa cédula ya existe' });
    }

    const nuevo = await Paciente.create({
      id_cedula: String(id_cedula).trim(),
      nombre: String(nombre).trim(),
      apellido: String(apellido).trim(),
      fecha_nacimiento: fecha_nacimiento ? String(fecha_nacimiento) : null,
      telefono: telefono ? String(telefono).trim() : null,
      correo: correo ? String(correo).trim() : null
    });

    return res.status(201).json({ mensaje: 'Paciente creado', paciente: nuevo });
  } catch (error) {
    if (error?.name === 'SequelizeValidationError') {
      const detalles = error.errors?.map((e) => e.message).join('; ');
      return res.status(400).json({ error: detalles || 'Error de validación' });
    }
    return res.status(500).json({ error: error.message || error });
  }
};

export const obtenerPacientesController = async (_req, res) => {
  try {
    const pacientes = await Paciente.findAll({ order: [['created_at', 'DESC']] });
    return res.json(pacientes);
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

export const obtenerPacientePorIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await Paciente.findByPk(id);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
    return res.json(paciente);
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

export const actualizarPacienteController = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, fecha_nacimiento, telefono, correo } = req.body;

    const paciente = await Paciente.findByPk(id);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

    if (nombre !== undefined && !String(nombre).trim()) {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }

    if (apellido !== undefined && !String(apellido).trim()) {
      return res.status(400).json({ error: 'El apellido no puede estar vacío' });
    }

    await paciente.update({
      nombre: nombre !== undefined ? String(nombre).trim() : paciente.nombre,
      apellido: apellido !== undefined ? String(apellido).trim() : paciente.apellido,
      fecha_nacimiento:
        fecha_nacimiento !== undefined ? (fecha_nacimiento ? String(fecha_nacimiento) : null) : paciente.fecha_nacimiento,
      telefono: telefono !== undefined ? (telefono ? String(telefono).trim() : null) : paciente.telefono,
      correo: correo !== undefined ? (correo ? String(correo).trim() : null) : paciente.correo
    });

    return res.json({ mensaje: 'Paciente actualizado', paciente });
  } catch (error) {
    if (error?.name === 'SequelizeValidationError') {
      const detalles = error.errors?.map((e) => e.message).join('; ');
      return res.status(400).json({ error: detalles || 'Error de validación' });
    }
    return res.status(500).json({ error: error.message || error });
  }
};

export const eliminarPacienteController = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await Paciente.findByPk(id);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

    await paciente.destroy();
    return res.json({ mensaje: 'Paciente eliminado' });
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

export default {
  crearPacienteController,
  obtenerPacientesController,
  obtenerPacientePorIdController,
  actualizarPacienteController,
  eliminarPacienteController
};
