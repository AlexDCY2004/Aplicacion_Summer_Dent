import Doctor from '../models/doctor.js';

const estadosPermitidos = ['disponible', 'no disponible', 'eventual'];

export const crearDoctorController = async (req, res) => {
    try {
        const { nombre, telefono, correo, especialidad, estado } = req.body;

        if (!nombre || !correo || !especialidad) {
            return res.status(400).json({
                error: 'Nombre, correo y especialidad son requeridos'
            });
        }

        if (estado && !estadosPermitidos.includes(String(estado).trim().toLowerCase())) {
            return res.status(400).json({
                error: 'Estado inválido. Debe ser: disponible, no disponible o eventual'
            });
        }

        const nuevoDoctor = await Doctor.create({
            nombre: String(nombre).trim(),
            telefono: telefono ? String(telefono).trim() : null,
            correo: String(correo).trim().toLowerCase(),
            especialidad: String(especialidad).trim(),
            estado: estado ? String(estado).trim().toLowerCase() : 'disponible'
        });

        return res.status(201).json({
            mensaje: 'Doctor creado exitosamente',
            doctor: nuevoDoctor
        });
    } catch (error) {
        if (
            error?.name === 'SequelizeValidationError' ||
            error?.name === 'SequelizeUniqueConstraintError'
        ) {
            const detalles = error.errors?.map((e) => e.message).join('; ');
            return res.status(400).json({ error: detalles || 'Error de validación' });
        }

        return res.status(500).json({ error: error.message });
    }
};

export const obtenerDoctoresController = async (_req, res) => {
    try {
        const doctores = await Doctor.findAll({
            order: [['id', 'DESC']]
        });

        return res.json(doctores);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const obtenerDoctorPorIdController = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await Doctor.findByPk(id);

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor no encontrado' });
        }

        return res.json(doctor);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const actualizarDoctorController = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, correo, especialidad, estado } = req.body;

        const doctor = await Doctor.findByPk(id);

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor no encontrado' });
        }

        if (nombre !== undefined && !String(nombre).trim()) {
            return res.status(400).json({ error: 'El nombre no puede estar vacío' });
        }

        if (correo !== undefined && !String(correo).trim()) {
            return res.status(400).json({ error: 'El correo no puede estar vacío' });
        }

        if (especialidad !== undefined && !String(especialidad).trim()) {
            return res.status(400).json({ error: 'La especialidad no puede estar vacía' });
        }

        if (
            estado !== undefined &&
            !estadosPermitidos.includes(String(estado).trim().toLowerCase())
        ) {
            return res.status(400).json({
                error: 'Estado inválido. Debe ser: disponible, no disponible o eventual'
            });
        }

        await doctor.update({
            nombre: nombre !== undefined ? String(nombre).trim() : doctor.nombre,
            telefono: telefono !== undefined ? (telefono ? String(telefono).trim() : null) : doctor.telefono,
            correo: correo !== undefined ? String(correo).trim().toLowerCase() : doctor.correo,
            especialidad:
                especialidad !== undefined ? String(especialidad).trim() : doctor.especialidad,
            estado: estado !== undefined ? String(estado).trim().toLowerCase() : doctor.estado
        });

        return res.json({
            mensaje: 'Doctor actualizado exitosamente',
            doctor
        });
    } catch (error) {
        if (
            error?.name === 'SequelizeValidationError' ||
            error?.name === 'SequelizeUniqueConstraintError'
        ) {
            const detalles = error.errors?.map((e) => e.message).join('; ');
            return res.status(400).json({ error: detalles || 'Error de validación' });
        }

        return res.status(500).json({ error: error.message });
    }
};

export const eliminarDoctorController = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await Doctor.findByPk(id);

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor no encontrado' });
        }

        await doctor.destroy();

        return res.json({ mensaje: 'Doctor eliminado exitosamente' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
