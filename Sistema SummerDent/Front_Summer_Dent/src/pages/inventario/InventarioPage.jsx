import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProductos, updateProducto } from '../../services/api/productos';
import { fetchInventarios, registrarMovimientoInventario } from '../../services/api/inventario';
import ErrorState from '../../components/feedback/ErrorState';
import InventarioModal from '../../components/inventario/InventarioModal';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const getProductName = (inventario) => {
  if (inventario.producto?.nombre) return inventario.producto.nombre;
  return inventario.id_producto ? `Producto #${inventario.id_producto}` : '-';
};

const getStatus = (stock, minimo) => {
  const current = Number(stock || 0);
  const min = Number(minimo || 0);

  if (min > 0 && current <= 0) return 'critical';
  if (min > 0 && current <= min) return 'low';
  if (current > min) return 'ok';
  return 'unknown';
};

const getStatusLabel = (stock, minimo) => {
  const status = getStatus(stock, minimo);
  if (status === 'critical') return 'Stock Crítico';
  if (status === 'low') return 'Stock Bajo';
  if (status === 'ok') return 'Disponible';
  return 'Sin referencia';
};

const buildAlertSummary = (inventoryList) => {
  const lowStockItems = inventoryList.filter((item) => getStatus(item.stock_producto, item.stock_minimo) === 'low' || getStatus(item.stock_producto, item.stock_minimo) === 'critical');
  if (lowStockItems.length === 0) return null;

  const firstItem = lowStockItems[0];
  const remaining = lowStockItems.length - 1;

  return {
    count: lowStockItems.length,
    text: remaining > 0
      ? `${getProductName(firstItem)} y ${remaining} insumo(s) más necesitan reposición`
      : `${getProductName(firstItem)} necesita reposición`
  };
};

export default function InventarioPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInventario, setSelectedInventario] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: inventarios = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['inventario'],
    queryFn: fetchInventarios
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: fetchProductos
  });

  const alertSummary = useMemo(() => buildAlertSummary(inventarios), [inventarios]);

  const filteredInventarios = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return inventarios.filter((item) => {
      const status = getStatus(item.stock_producto, item.stock_minimo);
      const matchesStatus = statusFilter === 'todos' || status === statusFilter;
      const matchesDate = !dateFilter || toDateInputValue(item.fecha_actualizacion) === dateFilter;

      const searchableFields = [
        getProductName(item),
        item.id_producto,
        item.id_perfil,
        item.stock_producto,
        item.stock_minimo,
        item.fecha_actualizacion,
        item.created_at,
        status
      ]
        .filter(Boolean)
        .map((field) => String(field).toLowerCase());

      const matchesSearch = !search || searchableFields.some((field) => field.includes(search));

      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [dateFilter, inventarios, searchTerm, statusFilter]);

  const openCreateModal = () => {
    setSelectedInventario(null);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (inventario) => {
    setSelectedInventario(inventario);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleViewInventario = (inventario) => {
    window.alert(
      `Inventario #${inventario.id}\n`
      + `Producto: ${getProductName(inventario)}\n`
      + `Id Producto: ${inventario.id_producto || '-'}\n`
      + `Id Perfil: ${inventario.id_perfil || '-'}\n`
      + `Cantidad Actual: ${inventario.stock_producto ?? 0}\n`
      + `Stock Mínimo: ${inventario.stock_minimo ?? 0}\n`
      + `Fecha Actualización: ${formatDate(inventario.fecha_actualizacion)}\n`
      + `Fecha Registro: ${formatDate(inventario.created_at)}`
    );
  };

  const handleRegisterMovement = async (inventario) => {
    const movementQty = Number(window.prompt(`Cantidad a registrar para ${getProductName(inventario)}:`, '1'));
    if (!Number.isFinite(movementQty) || movementQty <= 0) return;

    const movementType = window.confirm('Aceptar = Entrada, Cancelar = Salida') ? 'entrada' : 'salida';

    try {
      await registrarMovimientoInventario({
        id_producto: inventario.id_producto,
        tipo_movimiento: movementType,
        cantidad: Math.floor(movementQty)
      });
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'No se pudo registrar el movimiento.');
    }
  };

  const handleSubmit = async (payload) => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      const productId = payload.id_producto;
      const productData = productos.find((producto) => Number(producto.id) === Number(productId));

      if (!productData) {
        throw new Error('No se encontró el producto seleccionado');
      }

      await updateProducto(productId, {
        nombre: productData.nombre,
        descripcion: productData.descripcion ?? null,
        categoria: productData.categoria ?? null,
        precio: productData.precio ?? 0,
        stock_producto: payload.stock_producto,
        stock_minimo: payload.stock_minimo
      });

      if (payload.registrarMovimiento) {
        await registrarMovimientoInventario({
          id_producto: productId,
          tipo_movimiento: payload.tipo_movimiento,
          cantidad: payload.cantidad
        });
      }

      setIsModalOpen(false);
      setSelectedInventario(null);
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'No se pudo guardar el inventario.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="page-container inventario-page">
      <div className="page-header page-header--finance">
        <div>
          <h1>Gestión de Inventario</h1>
          <p>Controla los insumos y materiales del consultorio</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          + Nuevo Insumo
        </button>
      </div>

      {alertSummary && (
        <section className="inventario-alert-card">
          <div className="inventario-alert-card__title">
            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
            Alertas de Stock Bajo
          </div>
          <div className="inventario-alert-card__body">
            {alertSummary.count} insumo{alertSummary.count !== 1 ? 's' : ''} necesita{alertSummary.count !== 1 ? 'n' : ''} reposición: {alertSummary.text}
          </div>
        </section>
      )}

      <div className="inventario-legend">
        <span><i className="inventario-dot inventario-dot--ok" />Disponible</span>
        <span><i className="inventario-dot inventario-dot--low" />Stock Bajo</span>
        <span><i className="inventario-dot inventario-dot--critical" />Stock Crítico</span>
      </div>

      <div className="inventario-filters">
        <div className="search-container search-container--finance search-container--compact">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por producto, stock o perfil..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <input
          type="date"
          className="search-input inventario-date-input"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
        />

        <select
          className="search-input inventario-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="ok">Disponible</option>
          <option value="low">Stock Bajo</option>
          <option value="critical">Stock Crítico</option>
        </select>
      </div>

      {errorMessage && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {errorMessage}
        </div>
      )}

      <div className="table-container">
        {isLoading ? (
          <div className="skeleton-table">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="skeleton-row skeleton-row--finance">
                <div className="skeleton-cell" style={{ width: '20%' }} />
                <div className="skeleton-cell" style={{ width: '12%' }} />
                <div className="skeleton-cell" style={{ width: '12%' }} />
                <div className="skeleton-cell" style={{ width: '16%' }} />
                <div className="skeleton-cell" style={{ width: '12%' }} />
                <div className="skeleton-cell" style={{ width: '10%' }} />
                <div className="skeleton-cell" style={{ width: '18%' }} />
              </div>
            ))}
          </div>
        ) : filteredInventarios.length === 0 ? (
          <div className="empty-state finance-empty-state">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
            <h3>No hay insumos para mostrar</h3>
            <p>Prueba cambiando los filtros o registra un nuevo insumo.</p>
          </div>
        ) : (
          <table className="inventario-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="inventario-col-center">Cantidad Actual</th>
                <th className="inventario-col-center">Stock Mínimo</th>
                <th>Última Actualización</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventarios.map((inventario) => {
                const status = getStatus(inventario.stock_producto, inventario.stock_minimo);

                return (
                  <tr key={inventario.id}>
                    <td>
                      <span className="inventario-product-title">{getProductName(inventario)}</span>
                    </td>
                    <td className={`inventario-col-center inventario-stock-value inventario-stock-value--${status}`}>
                      {inventario.stock_producto ?? 0}
                    </td>
                    <td className="inventario-col-center">{inventario.stock_minimo ?? 0}</td>
                    <td>{formatDate(inventario.fecha_actualizacion)}</td>
                    <td>
                      <span className={`inventory-status-badge inventory-status-badge--${status}`}>
                        {getStatusLabel(inventario.stock_producto, inventario.stock_minimo)}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="inventario-action-btn inventario-action-btn--view"
                        onClick={() => handleViewInventario(inventario)}
                        aria-label="Ver detalle"
                        title="Ver detalle"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="inventario-action-btn inventario-action-btn--edit"
                        onClick={() => openEditModal(inventario)}
                        aria-label="Editar"
                        title="Editar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="inventario-action-btn inventario-action-btn--movement"
                        onClick={() => handleRegisterMovement(inventario)}
                        aria-label="Registrar movimiento"
                        title="Registrar movimiento"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M17 1l4 4-4 4" />
                          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                          <path d="M7 23l-4-4 4-4" />
                          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <InventarioModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedInventario(null);
        }}
        onSubmit={handleSubmit}
        initialData={selectedInventario}
        isLoading={isSaving}
        productos={productos}
      />
    </div>
  );
}
