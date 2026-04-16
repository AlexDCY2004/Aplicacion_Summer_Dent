import { supabaseAdmin } from '../configuracionesDB/supabaseClient.js';

const estadosPermitidos = ['disponible', 'no disponible', 'eventual'];

export const crearDoctorController = async (req, res) => {
    try {
        const { nombre, telefono, correo, especialidad, estado } = req.body;

        if (!nombre || !correo || !especialidad) {
            return res.status(400).json({ error: 'Nombre, correo y especialidad son requeridos' });
        }

        if (estado && !estadosPermitidos.includes(String(estado).trim().toLowerCase())) {
            return res.status(400).json({ error: 'Estado inválido. Debe ser: disponible, no disponible o eventual' });
        }

        const { data, error } = await supabaseAdmin
            .from('doctor')
            .insert([
                {
                    nombre: String(nombre).trim(),
                    telefono: telefono ? String(telefono).trim() : null,
                    correo: String(correo).trim().toLowerCase(),
                    especialidad: String(especialidad).trim(),
                    estado: estado ? String(estado).trim().toLowerCase() : 'disponible'
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message || error });
        }

        return res.status(201).json({ mensaje: 'Doctor creado exitosamente', doctor: data });
    } catch (error) {
        return res.status(500).json({ error: error.message || error });
    }
};

export const obtenerDoctoresController = async (_req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('doctor')
            .select('*')
            .order('id', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });

        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message || error });
    }
};

export const obtenerDoctorPorIdController = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('doctor')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) return res.status(500).json({ error: error.message });
        if (!data) return res.status(404).json({ error: 'Doctor no encontrado' });

        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message || error });
    }
};

export const actualizarDoctorController = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, correo, especialidad, estado } = req.body;

        // Validaciones simples
        if (nombre !== undefined && !String(nombre).trim()) return res.status(400).json({ error: 'El nombre no puede estar vacío' });
        if (correo !== undefined && !String(correo).trim()) return res.status(400).json({ error: 'El correo no puede estar vacío' });
        if (especialidad !== undefined && !String(especialidad).trim()) return res.status(400).json({ error: 'La especialidad no puede estar vacía' });
        if (estado !== undefined && !estadosPermitidos.includes(String(estado).trim().toLowerCase())) return res.status(400).json({ error: 'Estado inválido. Debe ser: disponible, no disponible o eventual' });

        const updates = {};
        if (nombre !== undefined) updates.nombre = String(nombre).trim();
        if (telefono !== undefined) updates.telefono = telefono ? String(telefono).trim() : null;
        if (correo !== undefined) updates.correo = String(correo).trim().toLowerCase();
        if (especialidad !== undefined) updates.especialidad = String(especialidad).trim();
        if (estado !== undefined) updates.estado = String(estado).trim().toLowerCase();

        const { data, error } = await supabaseAdmin
            .from('doctor')
            .update(updates)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) return res.status(400).json({ error: error.message || error });
        if (!data) return res.status(404).json({ error: 'Doctor no encontrado' });

        return res.json({ mensaje: 'Doctor actualizado exitosamente', doctor: data });
    } catch (error) {
        return res.status(500).json({ error: error.message || error });
    }
};

export const eliminarDoctorController = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: existing, error: fetchErr } = await supabaseAdmin
            .from('doctor')
            .select('id')
            .eq('id', id)
            .maybeSingle();

        if (fetchErr) return res.status(500).json({ error: fetchErr.message });
        if (!existing) return res.status(404).json({ error: 'Doctor no encontrado' });

        const { error } = await supabaseAdmin.from('doctor').delete().eq('id', id);
        if (error) return res.status(500).json({ error: error.message || error });

        return res.json({ mensaje: 'Doctor eliminado exitosamente' });
    } catch (error) {
        return res.status(500).json({ error: error.message || error });
    }
};
