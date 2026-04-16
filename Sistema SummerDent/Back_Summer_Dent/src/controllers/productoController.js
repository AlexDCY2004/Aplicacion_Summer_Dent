import { supabaseAdmin } from '../configuracionesDB/supabaseClient.js';

export const crearProductoController = async (req, res) => {
    try {
        const { nombre, descripcion, categoria } = req.body;

        if (!nombre || !String(nombre).trim()) return res.status(400).json({ error: 'El nombre del producto es obligatorio' });

        const { data, error } = await supabaseAdmin
            .from('producto')
            .insert([
                {
                    nombre: String(nombre).trim(),
                    descripcion: descripcion ? String(descripcion).trim() : null,
                    categoria: categoria ? String(categoria).trim() : null
                }
            ])
            .select()
            .maybeSingle();

        if (error) return res.status(400).json({ error: error.message || error });

        return res.status(201).json({ mensaje: 'Producto creado exitosamente', producto: data });
    } catch (error) {
        return res.status(500).json({ error: error.message || error });
    }
};

export const obtenerProductosController = async (_req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('producto').select('*').order('id', { ascending: false });
        if (error) return res.status(500).json({ error: error.message || error });
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message || error });
    }
};

export const obtenerProductoPorIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabaseAdmin.from('producto').select('*').eq('id', id).maybeSingle();
        if (error) return res.status(500).json({ error: error.message || error });
        if (!data) return res.status(404).json({ error: 'Producto no encontrado' });
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message || error });
    }
};

export const actualizarProductoController = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, categoria } = req.body;

        const { data: existing, error: fetchErr } = await supabaseAdmin.from('producto').select('id').eq('id', id).maybeSingle();
        if (fetchErr) return res.status(500).json({ error: fetchErr.message || fetchErr });
        if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

        if (nombre !== undefined && !String(nombre).trim()) return res.status(400).json({ error: 'El nombre del producto no puede estar vacío' });

        const updates = {};
        if (nombre !== undefined) updates.nombre = String(nombre).trim();
        if (descripcion !== undefined) updates.descripcion = descripcion ? String(descripcion).trim() : null;
        if (categoria !== undefined) updates.categoria = categoria ? String(categoria).trim() : null;

        const { data, error } = await supabaseAdmin.from('producto').update(updates).eq('id', id).select().maybeSingle();
        if (error) return res.status(400).json({ error: error.message || error });

        return res.json({ mensaje: 'Producto actualizado exitosamente', producto: data });
    } catch (error) {
        return res.status(500).json({ error: error.message || error });
    }
};

export const eliminarProductoController = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: existing, error: fetchErr } = await supabaseAdmin.from('producto').select('id').eq('id', id).maybeSingle();
        if (fetchErr) return res.status(500).json({ error: fetchErr.message || fetchErr });
        if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

        const { error } = await supabaseAdmin.from('producto').delete().eq('id', id);
        if (error) return res.status(500).json({ error: error.message || error });

        return res.json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (error) {
        return res.status(500).json({ error: error.message || error });
    }
};
