import { supabase, supabaseAdmin, getSupabaseClientWithToken } from '../configuracionesDB/supabaseClient.js';

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.replace('Bearer ', '').trim();
};

const checkAdmin = async (token) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return false;
  const { data: perfil, error: perfilError } = await supabaseAdmin.from('perfil').select('rol').eq('id', user.id).maybeSingle();
  if (perfilError) return false;
  return perfil && perfil.rol === 'administrador';
};

export const crearTratamientoController = async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const isAdmin = await checkAdmin(token);
    if (!isAdmin) return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });

    const supabaseUser = getSupabaseClientWithToken(token);
    const { area, nombre, precio, descripcion } = req.body;

    if (!area || !String(area).trim()) return res.status(400).json({ error: 'El área es obligatoria' });
    if (!nombre || !String(nombre).trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (precio === undefined || precio === null) return res.status(400).json({ error: 'El precio es obligatorio' });

    const { data, error } = await supabaseUser.from('tratamiento').insert([{
      area: String(area).trim(),
      nombre: String(nombre).trim(),
      precio: precio,
      descripcion: descripcion ? String(descripcion).trim() : null
    }]).select().maybeSingle();

    if (error) return res.status(400).json({ error: error.message || error });
    return res.status(201).json({ mensaje: 'Tratamiento creado', tratamiento: data });
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

export const obtenerTratamientosController = async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const supabaseUser = getSupabaseClientWithToken(token);
    const { data, error } = await supabaseUser.from('tratamiento').select('*').order('id', { ascending: false });
    if (error) return res.status(500).json({ error: error.message || error });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

export const obtenerTratamientoPorIdController = async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const supabaseUser = getSupabaseClientWithToken(token);
    const { id } = req.params;
    const { data, error } = await supabaseUser.from('tratamiento').select('*').eq('id', id).maybeSingle();
    if (error) return res.status(500).json({ error: error.message || error });
    if (!data) return res.status(404).json({ error: 'Tratamiento no encontrado' });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

export const actualizarTratamientoController = async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const isAdmin = await checkAdmin(token);
    if (!isAdmin) return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });

    const supabaseUser = getSupabaseClientWithToken(token);
    const { id } = req.params;
    const { area, nombre, precio, descripcion } = req.body;

    const { data: existing, error: fetchErr } = await supabaseUser.from('tratamiento').select('id').eq('id', id).maybeSingle();
    if (fetchErr) return res.status(500).json({ error: fetchErr.message || fetchErr });
    if (!existing) return res.status(404).json({ error: 'Tratamiento no encontrado' });

    const updates = {};
    if (area !== undefined) updates.area = area ? String(area).trim() : null;
    if (nombre !== undefined) updates.nombre = nombre ? String(nombre).trim() : null;
    if (precio !== undefined) updates.precio = precio;
    if (descripcion !== undefined) updates.descripcion = descripcion ? String(descripcion).trim() : null;

    const { data, error } = await supabaseUser.from('tratamiento').update(updates).eq('id', id).select().maybeSingle();
    if (error) return res.status(400).json({ error: error.message || error });
    return res.json({ mensaje: 'Tratamiento actualizado', tratamiento: data });
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

export const eliminarTratamientoController = async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const isAdmin = await checkAdmin(token);
    if (!isAdmin) return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });

    const supabaseUser = getSupabaseClientWithToken(token);
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabaseUser.from('tratamiento').select('id').eq('id', id).maybeSingle();
    if (fetchErr) return res.status(500).json({ error: fetchErr.message || fetchErr });
    if (!existing) return res.status(404).json({ error: 'Tratamiento no encontrado' });

    const { error } = await supabaseUser.from('tratamiento').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message || error });

    return res.json({ mensaje: 'Tratamiento eliminado' });
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

export default {
  crearTratamientoController,
  obtenerTratamientosController,
  obtenerTratamientoPorIdController,
  actualizarTratamientoController,
  eliminarTratamientoController
};
