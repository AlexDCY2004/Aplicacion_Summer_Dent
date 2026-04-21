import { useMemo, useState } from 'react';

export default function InventarioModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  productos = []
}) {
  const [errors, setErrors] = useState({});

  const isEditing = Boolean(initialData?.id);

  const productOptions = useMemo(() => productos, [productos]);

  const formKey = isEditing
    ? `inventario-edit-${initialData.id}-${initialData.id_producto ?? 'sin-producto'}-${initialData.stock_producto ?? 'sin-stock'}-${initialData.stock_minimo ?? 'sin-minimo'}`
    : 'inventario-new';

  const closeModal = () => {
    setErrors({});
    onClose();
  };

  const validateForm = (formValues) => {
    const nextErrors = {};
    const idProducto = formValues.id_producto?.trim() || '';
    const stockProducto = formValues.stock_producto?.trim() || '';
    const stockMinimo = formValues.stock_minimo?.trim() || '';
    const registrarMovimiento = Boolean(formValues.registrarMovimiento);
    const cantidad = formValues.cantidad?.trim() || '';

    if (!idProducto) {
      nextErrors.id_producto = 'Debes seleccionar un producto';
    }

    if (!stockProducto && !isEditing) {
      nextErrors.stock_producto = 'El stock actual es obligatorio';
    } else if (stockProducto !== '' && (!/^\d+$/.test(stockProducto) || Number(stockProducto) < 0)) {
      nextErrors.stock_producto = 'El stock actual debe ser un entero >= 0';
    }

    if (stockMinimo === '') {
      nextErrors.stock_minimo = 'El stock mínimo es obligatorio';
    } else if (!/^\d+$/.test(stockMinimo) || Number(stockMinimo) < 0) {
      nextErrors.stock_minimo = 'El stock mínimo debe ser un entero >= 0';
    }

    if (registrarMovimiento) {
      if (!cantidad) {
        nextErrors.cantidad = 'La cantidad es obligatoria';
      } else if (!/^\d+$/.test(cantidad) || Number(cantidad) <= 0) {
        nextErrors.cantidad = 'La cantidad debe ser un entero mayor que 0';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name } = event.target;

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const formValues = Object.fromEntries(new FormData(event.currentTarget).entries());
    formValues.registrarMovimiento = event.currentTarget.registrarMovimiento.checked;

    if (!validateForm(formValues)) return;

    onSubmit({
      id_producto: Number(formValues.id_producto),
      stock_producto: formValues.stock_producto !== '' ? Number(formValues.stock_producto) : undefined,
      stock_minimo: Number(formValues.stock_minimo),
      registrarMovimiento: Boolean(formValues.registrarMovimiento),
      tipo_movimiento: formValues.tipo_movimiento || 'entrada',
      cantidad: formValues.cantidad !== '' ? Number(formValues.cantidad) : undefined
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content modal-content--large" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
          <button type="button" className="modal-close" onClick={closeModal}>✕</button>
        </div>

        <form key={formKey} className="inventario-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="id_producto">Producto *</label>
            <select
              id="id_producto"
              name="id_producto"
              defaultValue={initialData?.id_producto ? String(initialData.id_producto) : ''}
              onChange={handleChange}
              className={errors.id_producto ? 'input-error' : ''}
            >
              <option value="">Seleccionar producto</option>
              {productOptions.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre}
                </option>
              ))}
            </select>
            {errors.id_producto && <span className="error-text">{errors.id_producto}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stock_producto">Cantidad Actual *</label>
              <input
                id="stock_producto"
                name="stock_producto"
                type="number"
                min="0"
                defaultValue={initialData?.stock_producto !== undefined ? String(initialData.stock_producto) : ''}
                onChange={handleChange}
                className={errors.stock_producto ? 'input-error' : ''}
                placeholder="0"
              />
              {errors.stock_producto && <span className="error-text">{errors.stock_producto}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="stock_minimo">Stock Mínimo *</label>
              <input
                id="stock_minimo"
                name="stock_minimo"
                type="number"
                min="0"
                defaultValue={initialData?.stock_minimo !== undefined ? String(initialData.stock_minimo) : ''}
                onChange={handleChange}
                className={errors.stock_minimo ? 'input-error' : ''}
                placeholder="0"
              />
              {errors.stock_minimo && <span className="error-text">{errors.stock_minimo}</span>}
            </div>
          </div>

          <div className="inventario-movement-card">
            <h3>Registrar movimiento opcional</h3>
            <label className="checkbox-row">
              <input type="checkbox" name="registrarMovimiento" defaultChecked={false} onChange={handleChange} />
              Quiero registrar un movimiento de inventario al guardar
            </label>

            <div className="inventario-movement-grid">
              <div className="form-group">
                <label htmlFor="tipo_movimiento">Tipo de movimiento</label>
                <select id="tipo_movimiento" name="tipo_movimiento" defaultValue="entrada" onChange={handleChange}>
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="cantidad">Cantidad *</label>
                <input id="cantidad" name="cantidad" type="number" min="1" defaultValue="" onChange={handleChange} className={errors.cantidad ? 'input-error' : ''} placeholder="1" />
                {errors.cantidad && <span className="error-text">{errors.cantidad}</span>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
