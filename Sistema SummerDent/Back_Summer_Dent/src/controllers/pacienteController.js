import { getSupabaseClientWithToken } from '../configuracionesDB/supabaseClient.js';

export const crearPacienteController = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').startsWith('Bearer ') ? req.headers.authorization.replace('Bearer ', '').trim() : null;
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const supabaseUser = getSupabaseClientWithToken(token);
    const { id_cedula, nombre, apellido, fecha_nacimiento, telefono, correo, direccion } = req.body;

    if (!id_cedula || !String(id_cedula).trim()) return res.status(400).json({ error: 'La cédula es obligatoria' });
    if (!nombre || !String(nombre).trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (!apellido || !String(apellido).trim()) return res.status(400).json({ error: 'El apellido es obligatorio' });

    // Verificar existencia (con token del usuario — RLS se aplicará)
    const { data: existente, error: existErr } = await supabaseUser
      .from('paciente')
      .select('id_cedula')
      .eq('id_cedula', String(id_cedula).trim())
      .maybeSingle();

    if (existErr) return res.status(500).json({ error: existErr.message });
    if (existente) return res.status(409).json({ error: 'Paciente con esa cédula ya existe' });

    const { data, error } = await supabaseUser
      .from('paciente')
      .insert([
        {
          id_cedula: String(id_cedula).trim(),
          nombre: String(nombre).trim(),
          apellido: String(apellido).trim(),
          fecha_nacimiento: fecha_nacimiento ? String(fecha_nacimiento) : null,
          telefono: telefono ? String(telefono).trim() : null,
          correo: correo ? String(correo).trim() : null,
          direccion: direccion ? String(direccion).trim() : null
        }
      ])
      .select()
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message || error });

    return res.status(201).json({ mensaje: 'Paciente creado', paciente: data });
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

export const obtenerPacientesController = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').startsWith('Bearer ') ? req.headers.authorization.replace('Bearer ', '').trim() : null;
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const supabaseUser = getSupabaseClientWithToken(token);
    const { data, error } = await supabaseUser.from('paciente').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message || error });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

export const obtenerPacientePorIdController = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').startsWith('Bearer ') ? req.headers.authorization.replace('Bearer ', '').trim() : null;
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const supabaseUser = getSupabaseClientWithToken(token);
    const { id } = req.params;
    const { data, error } = await supabaseUser.from('paciente').select('*').eq('id_cedula', id).maybeSingle();
    if (error) return res.status(500).json({ error: error.message || error });
    if (!data) return res.status(404).json({ error: 'Paciente no encontrado' });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

export const actualizarPacienteController = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').startsWith('Bearer ') ? req.headers.authorization.replace('Bearer ', '').trim() : null;
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const supabaseUser = getSupabaseClientWithToken(token);
    const { id } = req.params;
    const { nombre, apellido, fecha_nacimiento, telefono, correo, direccion } = req.body;

    const { data: existing, error: fetchErr } = await supabaseUser.from('paciente').select('id_cedula').eq('id_cedula', id).maybeSingle();
    if (fetchErr) return res.status(500).json({ error: fetchErr.message || fetchErr });
    if (!existing) return res.status(404).json({ error: 'Paciente no encontrado' });

    if (nombre !== undefined && !String(nombre).trim()) return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    if (apellido !== undefined && !String(apellido).trim()) return res.status(400).json({ error: 'El apellido no puede estar vacío' });

    const updates = {};
    if (nombre !== undefined) updates.nombre = String(nombre).trim();
    if (apellido !== undefined) updates.apellido = String(apellido).trim();
    if (fecha_nacimiento !== undefined) updates.fecha_nacimiento = fecha_nacimiento ? String(fecha_nacimiento) : null;
    if (telefono !== undefined) updates.telefono = telefono ? String(telefono).trim() : null;
    if (correo !== undefined) updates.correo = correo ? String(correo).trim() : null;
    if (direccion !== undefined) updates.direccion = direccion ? String(direccion).trim() : null;

    const { data, error } = await supabaseUser.from('paciente').update(updates).eq('id_cedula', id).select().maybeSingle();
    if (error) return res.status(400).json({ error: error.message || error });

    return res.json({ mensaje: 'Paciente actualizado', paciente: data });
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

export const eliminarPacienteController = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').startsWith('Bearer ') ? req.headers.authorization.replace('Bearer ', '').trim() : null;
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const supabaseUser = getSupabaseClientWithToken(token);
    const { id } = req.params;
    const { data: existing, error: fetchErr } = await supabaseUser.from('paciente').select('id_cedula').eq('id_cedula', id).maybeSingle();
    if (fetchErr) return res.status(500).json({ error: fetchErr.message || fetchErr });
    if (!existing) return res.status(404).json({ error: 'Paciente no encontrado' });

    const { error } = await supabaseUser.from('paciente').delete().eq('id_cedula', id);
    if (error) return res.status(500).json({ error: error.message || error });

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
