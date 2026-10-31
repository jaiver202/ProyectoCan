import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/admin';
const API_TOKEN = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const colorTerracota = '#7b3f2e';
const estiloTerracota = { backgroundColor: colorTerracota, borderColor: colorTerracota, color: '#fff' };
const secciones = [
  { id: 'resumen', texto: 'Resumen', icono: 'bi-grid' },
  { id: 'productos', texto: 'Productos', icono: 'bi-cake2' },
  { id: 'inventario', texto: 'Inventario', icono: 'bi-box-seam' },
  { id: 'pedidos', texto: 'Pedidos', icono: 'bi-bag' },
  { id: 'clientes', texto: 'Clientes', icono: 'bi-people' },
  { id: 'reportes', texto: 'Reportes', icono: 'bi-bar-chart' }
];

const productoVacio = { nombre: '', descripcion: '', precio: '', stock: '', imagen: '' };
const formatoMoneda = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')}`;

function normalizarEstadoPedido(estado) {
  const normalizado = String(estado || '').toLocaleLowerCase().replaceAll('_', ' ').replaceAll('-', ' ');
  if (normalizado.includes('entreg')) return 'entregado';
  if (normalizado.includes('prepar')) return 'en preparación';
  return 'pendiente';
}

function AdminPanel({ usuario, volverATienda, cerrarSesion, actualizarCatalogo }) {
  const [seccion, setSeccion] = useState('resumen');
  const [resumen, setResumen] = useState(null);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [reportes, setReportes] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroInventario, setFiltroInventario] = useState('todos');
  const [modalProducto, setModalProducto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [formProducto, setFormProducto] = useState(productoVacio);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [resumenResponse, productosResponse, pedidosResponse, clientesResponse, reportesResponse] = await Promise.all([
        axios.get(`${API_URL}/resumen`, API_TOKEN()),
        axios.get(`${API_URL}/productos`, API_TOKEN()),
        axios.get(`${API_URL}/pedidos`, API_TOKEN()),
        axios.get(`${API_URL}/clientes`, API_TOKEN()),
        axios.get(`${API_URL}/reportes`, API_TOKEN())
      ]);
      setResumen(resumenResponse.data);
      setProductos(productosResponse.data);
      setPedidos(pedidosResponse.data);
      setClientes(clientesResponse.data);
      setReportes(reportesResponse.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los datos del panel. Revisa la conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const limpiarAvisos = () => {
    setError('');
    setMensaje('');
  };

  const productosFiltrados = useMemo(() => {
    const consulta = busqueda.trim().toLocaleLowerCase();
    return productos.filter((producto) => {
      const coincideTexto = !consulta
        || producto.nombre.toLocaleLowerCase().includes(consulta)
        || String(producto.id_producto).includes(consulta);
      const coincideInventario = filtroInventario === 'todos'
        || (filtroInventario === 'bajo' && Number(producto.stock) > 0 && Number(producto.stock) <= 5)
        || (filtroInventario === 'agotado' && Number(producto.stock) === 0);
      return coincideTexto && coincideInventario;
    });
  }, [busqueda, filtroInventario, productos]);

  const abrirNuevoProducto = () => {
    limpiarAvisos();
    setProductoEditando(null);
    setFormProducto(productoVacio);
    setModalProducto(true);
  };

  const abrirEdicionProducto = (producto) => {
    limpiarAvisos();
    setProductoEditando(producto.id_producto);
    setFormProducto({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: String(producto.precio ?? ''),
      stock: String(producto.stock ?? ''),
      imagen: producto.imagen || ''
    });
    setModalProducto(true);
  };

  const productoActivo = (producto) => Number(producto.activo) === 1;

  const guardarProducto = async (evento) => {
    evento.preventDefault();
    limpiarAvisos();
    setProcesando(true);
    const datos = {
      nombre: formProducto.nombre.trim(),
      descripcion: formProducto.descripcion.trim(),
      precio: Number(formProducto.precio),
      stock: Number(formProducto.stock),
      imagen: formProducto.imagen.trim()
    };

    try {
      if (productoEditando) {
        await axios.put(`http://localhost:3000/api/productos/${productoEditando}`, datos, API_TOKEN());
      } else {
        await axios.post('http://localhost:3000/api/productos', datos, API_TOKEN());
      }
      setMensaje(productoEditando ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
      setModalProducto(false);
      await cargarDatos();
      await actualizarCatalogo?.();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el producto.');
    } finally {
      setProcesando(false);
    }
  };

  const cambiarEstadoProducto = async (producto) => {
    limpiarAvisos();
    setProcesando(true);
    try {
      await axios.put(`http://localhost:3000/api/productos/${producto.id_producto}`, {
        activo: !productoActivo(producto)
      }, API_TOKEN());
      setMensaje(productoActivo(producto) ? 'Producto desactivado.' : 'Producto activado.');
      await cargarDatos();
      await actualizarCatalogo?.();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cambiar el estado del producto.');
    } finally {
      setProcesando(false);
    }
  };

  const cambiarEstadoPedido = async (pedido, estado) => {
    limpiarAvisos();
    try {
      await axios.put(`${API_URL}/pedidos/${pedido.id_pedido}/estado`, { estado }, API_TOKEN());
      setPedidos((actuales) => actuales.map((item) => item.id_pedido === pedido.id_pedido
        ? { ...item, estado }
        : item));
      await cargarDatos();
      setMensaje(`Pedido #${pedido.id_pedido}: estado actualizado.`);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar el estado del pedido.');
    }
  };

  const cambiarSeccion = (id) => {
    setSeccion(id);
    setBusqueda('');
    setFiltroInventario('todos');
    limpiarAvisos();
  };

  const totalStockBajo = productos.filter((item) => Number(item.stock) > 0 && Number(item.stock) <= 5).length;
  const productosAgotados = productos.filter((item) => Number(item.stock) === 0).length;

  const renderProductos = (inventario = false) => (
    <>
      <div className="d-flex flex-column flex-md-row gap-2 justify-content-between mb-3">
        <input
          className="form-control"
          style={{ maxWidth: 360 }}
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar por nombre o código"
          aria-label="Buscar producto"
        />
        {inventario ? (
          <div className="d-flex gap-2 flex-wrap">
            {[['todos', 'Todos'], ['bajo', 'Stock bajo'], ['agotado', 'Agotados']].map(([id, texto]) => (
              <button
                type="button"
                key={id}
                className={`btn btn-sm ${filtroInventario === id ? 'btn-dark' : 'btn-outline-secondary'}`}
                onClick={() => setFiltroInventario(id)}
              >
                {texto}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" className="btn" style={estiloTerracota} onClick={abrirNuevoProducto}>
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />Nuevo producto
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Existencias</th>
              <th>Estado</th>
              {!inventario && <th className="text-end">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((producto) => {
              const stock = Number(producto.stock);
              return (
                <tr key={producto.id_producto}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      {producto.imagen
                        ? <img src={producto.imagen} alt="" className="rounded object-fit-cover" style={{ width: 48, height: 48 }} />
                        : <span className="rounded d-flex align-items-center justify-content-center bg-light" style={{ width: 48, height: 48 }}><i className="bi bi-cake2 text-secondary" /></span>}
                      <div>
                        <strong className="d-block">{producto.nombre}</strong>
                        <small className="text-secondary">#{producto.id_producto}</small>
                      </div>
                    </div>
                  </td>
                  <td>{formatoMoneda(producto.precio)}</td>
                  <td>{stock}</td>
                  <td>
                    {stock === 0
                      ? <span className="badge text-bg-danger">Agotado</span>
                      : stock <= 5
                        ? <span className="badge text-bg-warning">Stock bajo</span>
                        : <span className="badge text-bg-success">Disponible</span>}
                    {!productoActivo(producto) && <span className="badge text-bg-secondary ms-1">Inactivo</span>}
                  </td>
                  {!inventario && (
                    <td className="text-end text-nowrap">
                      <button type="button" className="btn btn-sm btn-outline-secondary me-1" onClick={() => abrirEdicionProducto(producto)} disabled={procesando}>
                        Editar
                      </button>
                      <button type="button" className={`btn btn-sm ${productoActivo(producto) ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => cambiarEstadoProducto(producto)} disabled={procesando}>
                        {productoActivo(producto) ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {productosFiltrados.length === 0 && (
              <tr><td colSpan={inventario ? 4 : 5} className="py-4 text-center text-secondary">No hay productos que coincidan con esta búsqueda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  const tarjetaIndicador = (titulo, valor, icono, detalle, tono = 'text-dark') => (
    <div className="col-12 col-sm-6 col-xl-3" key={titulo}>
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body d-flex align-items-start justify-content-between">
          <div>
            <div className="small text-secondary mb-2">{titulo}</div>
            <div className={`fs-3 fw-semibold ${tono}`}>{valor}</div>
            <small className="text-secondary">{detalle}</small>
          </div>
          <span className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 42, height: 42, backgroundColor: '#f5eee7', color: colorTerracota }}>
            <i className={`bi ${icono}`} aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  );

  const tituloSeccion = secciones.find((item) => item.id === seccion)?.texto;

  return (
    <main className="container-fluid min-vh-100 px-3 px-md-4 px-xl-5 pb-5 text-start" style={{ backgroundColor: '#fbf8f3', color: '#3d2c29' }}>
      <header className="container-xl d-flex align-items-center justify-content-between border-bottom py-3 mb-4">
        <button type="button" className="btn btn-link d-flex align-items-center gap-3 p-0 text-decoration-none text-start" onClick={volverATienda} style={{ color: '#3d2c29' }}>
          <span className="rounded-circle d-flex align-items-center justify-content-center border" style={{ width: 42, height: 42, borderColor: colorTerracota, color: colorTerracota }}>C</span>
          <span><strong className="d-block fw-normal fs-5">CandyKane</strong><small className="text-uppercase text-secondary" style={{ fontSize: 9, letterSpacing: 1.5 }}>Administración</small></span>
        </button>
        <div className="d-flex align-items-center gap-2">
          <span className="d-none d-sm-inline small text-secondary">Hola, {usuario?.nombre}</span>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={volverATienda}>Volver a la tienda</button>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={cerrarSesion}>Salir</button>
        </div>
      </header>

      <div className="container-xl">
        <div className="row g-4">
          <aside className="col-12 col-lg-3 col-xl-2">
            <nav className="card border-0 shadow-sm p-2" aria-label="Secciones de administración">
              {secciones.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`btn text-start d-flex align-items-center gap-2 mb-1 ${seccion === item.id ? 'text-white' : 'text-secondary'}`}
                  style={seccion === item.id ? estiloTerracota : {}}
                  onClick={() => cambiarSeccion(item.id)}
                >
                  <i className={`bi ${item.icono}`} aria-hidden="true" />
                  {item.texto}
                </button>
              ))}
            </nav>
          </aside>

          <section className="col-12 col-lg-9 col-xl-10">
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
              <div>
                <span className="d-block text-uppercase fw-bold mb-2" style={{ color: '#9a6b55', fontSize: 9, letterSpacing: 1.8 }}>PANEL ADMINISTRATIVO</span>
                <h1 className="h2 mb-0">{tituloSeccion}</h1>
              </div>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={cargarDatos} disabled={cargando}>
                <i className={`bi bi-arrow-clockwise me-1${cargando ? ' spin' : ''}`} aria-hidden="true" />Actualizar datos
              </button>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}

            {cargando ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status" style={{ color: colorTerracota }} />
                <p className="small text-secondary mt-2">Cargando datos administrativos...</p>
              </div>
            ) : (
              <>
                {seccion === 'resumen' && resumen && (
                  <>
                    <div className="row g-3 mb-4">
                      {[
                        tarjetaIndicador('Productos activos', resumen.productos.activos, 'bi-cake2', `${resumen.productos.total} en total`),
                        tarjetaIndicador('Stock bajo', resumen.productos.stock_bajo, 'bi-exclamation-triangle', 'Entre 1 y 5 unidades', 'text-warning'),
                        tarjetaIndicador('Pedidos pendientes', resumen.pedidos.pendientes, 'bi-clock-history', `${resumen.pedidos.total} pedidos registrados`, 'text-primary'),
                        tarjetaIndicador('Ventas registradas', formatoMoneda(resumen.ventas), 'bi-currency-dollar', 'Suma de los pedidos registrados', 'text-success')
                      ]}
                    </div>
                    <div className="row g-3">
                      <div className="col-12 col-xl-7">
                        <div className="card border-0 shadow-sm h-100">
                          <div className="card-body">
                            <h2 className="h5">Atención de inventario</h2>
                            <p className="small text-secondary">Productos con cinco unidades o menos, incluidos los agotados.</p>
                            <div className="d-flex flex-wrap gap-2">
                              <span className="badge text-bg-warning">{totalStockBajo} con stock bajo</span>
                              <span className="badge text-bg-danger">{productosAgotados} agotados</span>
                            </div>
                            <button type="button" className="btn btn-link px-0 mt-2 text-decoration-none" style={{ color: colorTerracota }} onClick={() => cambiarSeccion('inventario')}>
                              Revisar inventario <i className="bi bi-arrow-right" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-xl-5">
                        <div className="card border-0 shadow-sm h-100">
                          <div className="card-body">
                            <h2 className="h5">Clientes registrados</h2>
                            <p className="display-6 mb-2">{resumen.clientes}</p>
                            <button type="button" className="btn btn-link px-0 text-decoration-none" style={{ color: colorTerracota }} onClick={() => cambiarSeccion('clientes')}>
                              Consultar clientes <i className="bi bi-arrow-right" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {seccion === 'productos' && (
                  <div className="card border-0 shadow-sm p-3 p-md-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div><h2 className="h5 mb-1">Catálogo de productos</h2><p className="small text-secondary mb-0">Crea, edita y activa productos de la vitrina.</p></div>
                    </div>
                    {renderProductos()}
                  </div>
                )}

                {seccion === 'inventario' && (
                  <div className="card border-0 shadow-sm p-3 p-md-4">
                    <h2 className="h5 mb-1">Existencias</h2>
                    <p className="small text-secondary mb-3">El inventario se marca bajo con cinco unidades o menos.</p>
                    {renderProductos(true)}
                  </div>
                )}

                {seccion === 'pedidos' && (
                  <div className="card border-0 shadow-sm p-3 p-md-4">
                    <h2 className="h5 mb-1">Pedidos de clientes</h2>
                    <p className="small text-secondary mb-3">Actualiza el estado para que el cliente pueda consultar el seguimiento.</p>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light"><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
                        <tbody>
                          {pedidos.map((pedido) => (
                            <tr key={pedido.id_pedido}>
                              <td>#{pedido.id_pedido}</td>
                              <td>{pedido.cliente || pedido.correo || `Cliente #${pedido.id_usuario}`}</td>
                              <td>{pedido.fecha_pedido ? new Date(pedido.fecha_pedido).toLocaleDateString('es-CO') : '—'}</td>
                              <td>{formatoMoneda(pedido.total)}</td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  style={{ minWidth: 155 }}
                                  value={normalizarEstadoPedido(pedido.estado)}
                                  onChange={(evento) => cambiarEstadoPedido(pedido, evento.target.value)}
                                  aria-label={`Estado del pedido ${pedido.id_pedido}`}
                                >
                                  <option value="pendiente">Pendiente</option>
                                  <option value="en preparación">En preparación</option>
                                  <option value="entregado">Entregado</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                          {pedidos.length === 0 && <tr><td colSpan="5" className="py-5 text-center text-secondary">Todavía no hay pedidos registrados.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {seccion === 'clientes' && (
                  <div className="card border-0 shadow-sm p-3 p-md-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
                      <div><h2 className="h5 mb-1">Clientes</h2><p className="small text-secondary mb-0">{clientes.length} cuentas registradas</p></div>
                      <input className="form-control" style={{ maxWidth: 320 }} placeholder="Buscar cliente" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} />
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light"><tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Estado</th></tr></thead>
                        <tbody>
                          {clientes.filter((cliente) => `${cliente.nombre} ${cliente.correo}`.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase())).map((cliente) => (
                            <tr key={cliente.id_usuario}>
                              <td>{cliente.nombre}</td><td>{cliente.correo}</td><td>{cliente.telefono || '—'}</td>
                              <td><span className={`badge ${Number(cliente.activo) === 1 ? 'text-bg-success' : 'text-bg-secondary'}`}>{Number(cliente.activo) === 1 ? 'Activo' : 'Inactivo'}</span></td>
                            </tr>
                          ))}
                          {clientes.length === 0 && <tr><td colSpan="4" className="py-5 text-center text-secondary">Todavía no hay clientes registrados.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {seccion === 'reportes' && reportes && (
                  <>
                    <div className="row g-3 mb-4">
                      {tarjetaIndicador('Ventas acumuladas', formatoMoneda(reportes.ventas), 'bi-currency-dollar', 'Según pedidos registrados', 'text-success')}
                      {tarjetaIndicador('Pedidos registrados', reportes.pedidos, 'bi-bag-check', 'Historial completo', 'text-primary')}
                    </div>
                    <div className="row g-3">
                      <div className="col-12 col-xl-7">
                        <div className="card border-0 shadow-sm p-3 p-md-4 h-100">
                          <h2 className="h5">Ventas y pedidos por mes</h2>
                          <div className="table-responsive">
                            <table className="table table-sm align-middle">
                              <thead><tr><th>Mes</th><th>Pedidos</th><th>Ventas</th></tr></thead>
                              <tbody>
                                {reportes.porMes.map((item) => (
                                  <tr key={item.periodo}>
                                    <td>{new Date(`${item.periodo}-02T12:00:00`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</td>
                                    <td>{item.pedidos}</td><td>{formatoMoneda(item.ventas)}</td>
                                  </tr>
                                ))}
                                {reportes.porMes.length === 0 && <tr><td colSpan="3" className="text-center text-secondary py-4">Aún no hay ventas registradas.</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-xl-5">
                        <div className="card border-0 shadow-sm p-3 p-md-4 h-100">
                          <h2 className="h5">Pedidos por estado</h2>
                          {reportes.porEstado.length
                            ? <ul className="list-group list-group-flush">{reportes.porEstado.map((item) => <li className="list-group-item d-flex justify-content-between px-0" key={item.estado}><span>{item.estado}</span><strong>{item.cantidad}</strong></li>)}</ul>
                            : <p className="small text-secondary">No hay pedidos para resumir.</p>}
                          <div className="alert alert-light border small mt-3 mb-0">{reportes.notaProductos}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {modalProducto && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050, backgroundColor: 'rgba(25, 20, 18, .55)' }} role="presentation">
          <div className="card border-0 shadow-lg w-100" style={{ maxWidth: 600 }} role="dialog" aria-modal="true" aria-labelledby="admin-product-title">
            <form onSubmit={guardarProducto}>
              <div className="card-header bg-white d-flex justify-content-between align-items-center p-3">
                <h2 className="h5 mb-0" id="admin-product-title">{productoEditando ? 'Editar producto' : 'Nuevo producto'}</h2>
                <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setModalProducto(false)} />
              </div>
              <div className="card-body p-3 p-md-4">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label" htmlFor="admin-product-name">Nombre</label>
                    <input id="admin-product-name" className="form-control" value={formProducto.nombre} onChange={(evento) => setFormProducto({ ...formProducto, nombre: evento.target.value })} maxLength="150" required />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="admin-product-description">Descripción</label>
                    <textarea id="admin-product-description" className="form-control" rows="3" value={formProducto.descripcion} onChange={(evento) => setFormProducto({ ...formProducto, descripcion: evento.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label" htmlFor="admin-product-price">Precio</label>
                    <input id="admin-product-price" className="form-control" type="number" min="0" step="0.01" value={formProducto.precio} onChange={(evento) => setFormProducto({ ...formProducto, precio: evento.target.value })} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label" htmlFor="admin-product-stock">Stock</label>
                    <input id="admin-product-stock" className="form-control" type="number" min="0" step="1" value={formProducto.stock} onChange={(evento) => setFormProducto({ ...formProducto, stock: evento.target.value })} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="admin-product-image">URL de imagen</label>
                    <input id="admin-product-image" className="form-control" type="url" value={formProducto.imagen} onChange={(evento) => setFormProducto({ ...formProducto, imagen: evento.target.value })} placeholder="https://..." />
                  </div>
                </div>
              </div>
              <div className="card-footer bg-white d-flex justify-content-end gap-2 p-3">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setModalProducto(false)} disabled={procesando}>Cancelar</button>
                <button type="submit" className="btn" style={estiloTerracota} disabled={procesando}>
                  {procesando ? 'Guardando...' : productoEditando ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminPanel;
