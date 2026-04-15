import Producto from '../models/producto.js';

export const crearProductoController = async (req, res) => {
    try {
        const { nombre, descripcion, categoria } = req.body;

        if (!nombre || !String(nombre).trim()) {
            return res.status(400).json({
                error: 'El nombre del producto es obligatorio'
            });
        }

        const nuevoProducto = await Producto.create({
            nombre: String(nombre).trim(),
            descripcion: descripcion ? String(descripcion).trim() : null,
            categoria: categoria ? String(categoria).trim() : null
        });

        return res.status(201).json({
            mensaje: 'Producto creado exitosamente',
            producto: nuevoProducto
        });
    } catch (error) {
        if (error?.name === 'SequelizeValidationError') {
            const detalles = error.errors?.map((e) => e.message).join('; ');
            return res.status(400).json({ error: detalles || 'Error de validación' });
        }

        return res.status(500).json({ error: error.message });
    }
};

export const obtenerProductosController = async (_req, res) => {
    try {
        const productos = await Producto.findAll({
            order: [['id', 'DESC']]
        });

        return res.json(productos);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const obtenerProductoPorIdController = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        return res.json(producto);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const actualizarProductoController = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, categoria } = req.body;

        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        if (nombre !== undefined && !String(nombre).trim()) {
            return res.status(400).json({
                error: 'El nombre del producto no puede estar vacío'
            });
        }

        await producto.update({
            nombre: nombre !== undefined ? String(nombre).trim() : producto.nombre,
            descripcion:
                descripcion !== undefined
                    ? (descripcion ? String(descripcion).trim() : null)
                    : producto.descripcion,
            categoria:
                categoria !== undefined
                    ? (categoria ? String(categoria).trim() : null)
                    : producto.categoria
        });

        return res.json({
            mensaje: 'Producto actualizado exitosamente',
            producto
        });
    } catch (error) {
        if (error?.name === 'SequelizeValidationError') {
            const detalles = error.errors?.map((e) => e.message).join('; ');
            return res.status(400).json({ error: detalles || 'Error de validación' });
        }

        return res.status(500).json({ error: error.message });
    }
};

export const eliminarProductoController = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        await producto.destroy();

        return res.json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
