import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/perfil';

const apartados = [
  { id: 'informacion', nombre: 'Mi información', icono: 'bi-person' },
  { id: 'pedidos', nombre: 'Mis pedidos', icono: 'bi-bag' },
  { id: 'seguimiento', nombre: 'Seguimiento', icono: 'bi-truck' },
  { id: 'direcciones', nombre: 'Mis direcciones', icono: 'bi-geo-alt' },
  { id: 'favoritos', nombre: 'Favoritos', icono: 'bi-heart' }
];

const colorTerracota = '#7b3f2e';
const estiloTerracota = { backgroundColor: colorTerracota, borderColor: colorTerracota, color: '#fff' };

function obtenerEstado(estado) {
  const normalizado = String(estado || '').toLowerCase().replaceAll('_', ' ').replaceAll('-', ' ');
  if (normalizado.includes('entreg')) return { texto: 'Entregado', paso: 3 };
  if (normalizado.includes('prepar')) return { texto: 'En preparación', paso: 2 };
  if (normalizado.includes('pend')) return { texto: 'Pendiente', paso: 1 };
  return { texto: estado || 'Pendiente', paso: 1 };
}

function Perfil({ usuario, productos = [], volverATienda, cerrarSesion, alActualizarUsuario }) {
  const [apartadoActivo, setApartadoActivo] = useState('informacion');
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [informacion, setInformacion] = useState({ nombre: '', correo: '', telefono: '' });
  const [direccion, setDireccion] = useState({ alias: '', direccion: '', ciudad: '', referencia: '' });
  const [productoSeleccionado, setProductoSeleccionado] = useState('');

  const cargarPerfil = async (mostrarCarga = true) => {
    if (mostrarCarga) setCargando(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPerfil(response.data);
      setInformacion({
        nombre: response.data.usuario.nombre || '',
        correo: response.data.usuario.correo || '',
        telefono: response.data.usuario.telefono || ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar tu perfil. Inténtalo de nuevo.');
    } finally {
      if (mostrarCarga) setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const limpiarAvisos = () => {
    setError('');
    setMensaje('');
  };

  const mostrarError = (err, mensajePredeterminado) => {
    setError(err.response?.data?.error || mensajePredeterminado);
    setMensaje('');
  };

  const guardarInformacion = async (evento) => {
    evento.preventDefault();
    limpiarAvisos();
    setGuardando(true);
    try {
      const response = await axios.put(API_URL, informacion, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPerfil((actual) => ({ ...actual, usuario: response.data.usuario }));
      alActualizarUsuario?.(response.data.usuario);
      setMensaje(response.data.mensaje);
    } catch (err) {
      mostrarError(err, 'No se pudo guardar tu información.');
    } finally {
      setGuardando(false);
    }
  };

  const guardarDireccion = async (evento) => {
    evento.preventDefault();
    limpiarAvisos();
    setGuardando(true);
    try {
      const response = await axios.post(`${API_URL}/direcciones`, direccion, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPerfil((actual) => ({
        ...actual,
        direcciones: [response.data, ...actual.direcciones]
      }));
      setDireccion({ alias: '', direccion: '', ciudad: '', referencia: '' });
      setMensaje('Dirección guardada correctamente.');
    } catch (err) {
      mostrarError(err, 'No se pudo guardar la dirección.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarDireccion = async (idDireccion) => {
    limpiarAvisos();
    try {
      await axios.delete(`${API_URL}/direcciones/${idDireccion}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPerfil((actual) => ({
        ...actual,
        direcciones: actual.direcciones.filter((item) => item.id_direccion !== idDireccion)
      }));
      setMensaje('Dirección eliminada.');
    } catch (err) {
      mostrarError(err, 'No se pudo eliminar la dirección.');
    }
  };

  const agregarFavorito = async (evento) => {
    evento.preventDefault();
    if (!productoSeleccionado) return;
    limpiarAvisos();
    try {
      await axios.post(`${API_URL}/favoritos`, { id_producto: productoSeleccionado }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const producto = productos.find((item) => String(item.id_producto) === productoSeleccionado);
      if (producto) {
        setPerfil((actual) => ({
          ...actual,
          favoritos: [producto, ...actual.favoritos.filter(
            (item) => item.id_producto !== producto.id_producto
          )]
        }));
      }
      setProductoSeleccionado('');
      setMensaje('Postre agregado a tus favoritos.');
    } catch (err) {
      mostrarError(err, 'No se pudo guardar el postre favorito.');
    }
  };

  const eliminarFavorito = async (idProducto) => {
    limpiarAvisos();
    try {
      await axios.delete(`${API_URL}/favoritos/${idProducto}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPerfil((actual) => ({
        ...actual,
        favoritos: actual.favoritos.filter((item) => item.id_producto !== idProducto)
      }));
      setMensaje('Postre eliminado de tus favoritos.');
    } catch (err) {
      mostrarError(err, 'No se pudo eliminar el postre favorito.');
    }
  };

  const apartadoNombre = apartados.find((apartado) => apartado.id === apartadoActivo)?.nombre;
  const idsFavoritos = new Set((perfil?.favoritos || []).map((item) => item.id_producto));

  return (
    <main className="container-fluid min-vh-100 px-3 px-md-4 px-xl-5 pb-5 text-start" style={{ backgroundColor: '#fbf8f3', color: '#3d2c29' }}>
      <header className="container-xl d-flex align-items-center justify-content-between border-bottom py-3 mb-4 mb-lg-5">
        <button type="button" className="btn btn-link d-flex align-items-center gap-3 p-0 text-decoration-none text-start" onClick={volverATienda} aria-label="Volver a CandyKane" style={{ color: '#3d2c29' }}>
          <span className="rounded-circle d-flex align-items-center justify-content-center border" style={{ width: 42, height: 42, borderColor: colorTerracota, color: colorTerracota, fontSize: 19 }}>C</span>
          <span>
            <strong className="d-block fw-normal fs-5">CandyKane</strong>
            <small className="d-block text-uppercase" style={{ color: '#8d746b', fontSize: 9, letterSpacing: 1.7 }}>Pastelería artesanal</small>
          </span>
        </button>
        <button type="button" className="btn btn-link d-flex align-items-center gap-2 p-2 text-decoration-none" onClick={volverATienda} style={{ color: '#755e55' }}>
          <i className="bi bi-arrow-left" aria-hidden="true" /> <span className="d-none d-sm-inline">Volver a la tienda</span>
        </button>
      </header>

      <div className="container-xl">
        <div className="row g-4 g-lg-5">
          <aside className="col-12 col-lg-3">
            <div className="card border p-3 p-xl-4 shadow-sm" style={{ borderColor: '#eee6dc', backgroundColor: 'rgba(255,255,255,.8)' }}>
              <div className="d-flex align-items-center gap-3 border-bottom pb-3">
                <span className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 45, height: 45, backgroundColor: '#ead9c8', color: colorTerracota, fontSize: 21 }}>
                  {(perfil?.usuario?.nombre || usuario?.nombre || 'U').charAt(0).toUpperCase()}
                </span>
                <div className="overflow-hidden">
                  <span className="d-block text-uppercase fw-bold mb-1" style={{ color: '#9a6b55', fontFamily: 'Arial, sans-serif', fontSize: 9, letterSpacing: 1.8 }}>TU CUENTA</span>
                  <h1 className="h6 text-truncate mb-1 fw-normal">{perfil?.usuario?.nombre || usuario?.nombre || 'Mi perfil'}</h1>
                  <p className="small text-secondary text-truncate mb-0" style={{ fontSize: 11 }}>{perfil?.usuario?.correo || usuario?.correo || 'Área personal'}</p>
                </div>
              </div>

              <nav className="nav nav-pills flex-row flex-lg-column flex-nowrap overflow-auto gap-2 gap-lg-1 py-3" aria-label="Apartados del perfil">
                {apartados.map((apartado) => (
                  <button
                    type="button"
                    key={apartado.id}
                    className={`nav-link d-flex align-items-center gap-2 text-nowrap text-lg-start${apartadoActivo === apartado.id ? ' active' : ''}`}
                    style={apartadoActivo === apartado.id
                      ? { backgroundColor: '#f5eee7', color: colorTerracota }
                      : { color: '#6f625c' }}
                    onClick={() => {
                      setApartadoActivo(apartado.id);
                      limpiarAvisos();
                    }}
                  >
                    <i className={`bi ${apartado.icono}`} aria-hidden="true" />
                    <span>{apartado.nombre}</span>
                    <i className="bi bi-chevron-right ms-auto d-none d-lg-inline" aria-hidden="true" />
                  </button>
                ))}
              </nav>

              <button type="button" className="btn btn-link border-top rounded-0 d-flex align-items-center gap-2 w-100 px-2 pt-3 text-start text-decoration-none" onClick={cerrarSesion} style={{ color: '#9b5145' }}>
                <i className="bi bi-box-arrow-right" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </aside>

          <section className="col-12 col-lg-9">
            <div className="d-flex align-items-end justify-content-between mb-4">
              <div>
                <span className="d-block text-uppercase fw-bold mb-2" style={{ color: '#9a6b55', fontFamily: 'Arial, sans-serif', fontSize: 9, letterSpacing: 1.8 }}>ÁREA PERSONAL</span>
                <h2 className="display-6 mb-0" style={{ color: '#392722' }}>{apartadoNombre}</h2>
              </div>
            </div>

            {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
            {mensaje && <div className="alert alert-success py-2 small" role="status">{mensaje}</div>}

            {cargando ? (
              <div className="card border-0 bg-transparent py-5 text-center" style={{ color: '#8b7c73' }}>
                <div className="spinner-border spinner-border-sm mx-auto mb-2" role="status" style={{ color: colorTerracota }} />
                <span>Cargando tu información...</span>
              </div>
            ) : !perfil ? (
              <div className="card border p-5 text-center" style={{ borderColor: '#eee6dc', backgroundColor: 'rgba(255,255,255,.8)' }}>
                <i className="bi bi-person-exclamation fs-2 mb-2" aria-hidden="true" style={{ color: '#b7856b' }} />
                <p className="text-secondary mb-3">No pudimos abrir tu perfil. Vuelve a iniciar sesión para continuar.</p>
                <button type="button" className="btn align-self-center" style={estiloTerracota} onClick={cerrarSesion}>Ir al inicio</button>
              </div>
            ) : (
              <>
              {apartadoActivo === 'informacion' && (
                <div className="card border p-3 p-md-4 p-xl-5 shadow-sm" style={{ borderColor: '#eee6dc', backgroundColor: 'rgba(255,255,255,.8)' }}>
                  <div className="mb-4">
                    <h3 className="h4 fw-normal mb-2">Un espacio solo para ti</h3>
                    <p className="text-secondary small mb-0">Mantén tus datos al día para que podamos atenderte mejor.</p>
                  </div>
                  <form className="row g-3" onSubmit={guardarInformacion}>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="perfil-nombre">Nombre completo</label>
                      <input id="perfil-nombre" className="form-control" type="text" autoComplete="name" value={informacion.nombre}
                        onChange={(evento) => setInformacion({ ...informacion, nombre: evento.target.value })} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="perfil-correo">Correo electrónico</label>
                      <input id="perfil-correo" className="form-control" type="email" autoComplete="email" value={informacion.correo}
                        onChange={(evento) => setInformacion({ ...informacion, correo: evento.target.value })} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="perfil-telefono">Teléfono</label>
                      <input id="perfil-telefono" className="form-control" type="tel" autoComplete="tel" value={informacion.telefono}
                        onChange={(evento) => setInformacion({ ...informacion, telefono: evento.target.value })}
                        placeholder="Añade un número de contacto" />
                    </div>
                    <div className="col-12 pt-2">
                      <button className="btn px-4" style={estiloTerracota} type="submit" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {apartadoActivo === 'pedidos' && (
                <div className="card border p-3 p-md-4 p-xl-5 shadow-sm" style={{ borderColor: '#eee6dc', backgroundColor: 'rgba(255,255,255,.8)' }}>
                  <div className="mb-4">
                    <h3 className="h4 fw-normal mb-2">El historial de tus antojos</h3>
                    <p className="text-secondary small mb-0">Aquí encontrarás tus pedidos anteriores y los que están en curso.</p>
                  </div>
                  {perfil.pedidos.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-bag-heart fs-2 d-block mb-3" aria-hidden="true" style={{ color: '#b7856b' }} />
                      <h3 className="h5 fw-normal">Aún no tienes pedidos</h3>
                      <p className="text-secondary small mb-3">Cuando hagas tu primera compra, aparecerá aquí con todos sus detalles.</p>
                      <button type="button" className="btn btn-outline-secondary" onClick={volverATienda}>
                        Explorar la vitrina
                      </button>
                    </div>
                  ) : (
                    <div className="d-grid gap-2">
                      {perfil.pedidos.map((pedido) => {
                        const estado = obtenerEstado(pedido.estado);
                        return (
                          <article className="card border p-3" key={pedido.id_pedido} style={{ borderColor: '#eee6dc', backgroundColor: '#fffdfa' }}>
                            <div className="row align-items-center g-3">
                              <div className="col-auto">
                                <span className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, backgroundColor: '#f5eee7', color: '#87533f' }}>
                                  <i className="bi bi-box-seam" aria-hidden="true" />
                                </span>
                              </div>
                              <div className="col">
                                <strong className="d-block small">Pedido #{String(pedido.id_pedido).padStart(5, '0')}</strong>
                                <span className="text-secondary small">{new Date(pedido.creado_en).toLocaleDateString('es-CO', {
                                year: 'numeric', month: 'long', day: 'numeric'
                                })}</span>
                              </div>
                              <div className="col-auto">
                                <span className={`badge rounded-pill ${estado.paso === 3 ? 'text-bg-success' : estado.paso === 2 ? 'text-bg-warning' : 'text-bg-secondary'}`}>{estado.texto}</span>
                              </div>
                              <strong className="col-12 col-sm-auto text-sm-end small">
                                ${Number(pedido.total).toLocaleString('es-CO')}
                              </strong>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {apartadoActivo === 'seguimiento' && (
                <div className="card border p-3 p-md-4 p-xl-5 shadow-sm" style={{ borderColor: '#eee6dc', backgroundColor: 'rgba(255,255,255,.8)' }}>
                  <div className="mb-4">
                    <h3 className="h4 fw-normal mb-2">Tu pedido, paso a paso</h3>
                    <p className="text-secondary small mb-0">Consulta en qué etapa está cada una de tus delicias.</p>
                  </div>
                  {perfil.pedidos.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-truck fs-2 d-block mb-3" aria-hidden="true" style={{ color: '#b7856b' }} />
                      <h3 className="h5 fw-normal">No hay pedidos para seguir</h3>
                      <p className="text-secondary small mb-0">Cuando tengas un pedido, su estado aparecerá aquí.</p>
                    </div>
                  ) : (
                    <div className="d-grid gap-3">
                      {perfil.pedidos.map((pedido) => {
                        const estado = obtenerEstado(pedido.estado);
                        return (
                          <article className="card border p-3 p-md-4" key={pedido.id_pedido} style={{ borderColor: '#eee6dc', backgroundColor: '#fffdfa' }}>
                            <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
                              <strong className="small">Pedido #{String(pedido.id_pedido).padStart(5, '0')}</strong>
                              <span className={`badge rounded-pill ${estado.paso === 3 ? 'text-bg-success' : estado.paso === 2 ? 'text-bg-warning' : 'text-bg-secondary'}`}>{estado.texto}</span>
                            </div>
                            <div className="row text-center g-0">
                              {['Pendiente', 'En preparación', 'Entregado'].map((paso, index) => (
                                <div className={`col position-relative small ${estado.paso >= index + 1 ? 'text-success' : 'text-secondary'}`} key={paso}>
                                  <span
                                    className={`rounded-circle border d-inline-flex align-items-center justify-content-center position-relative mb-2 ${estado.paso >= index + 1 ? 'bg-success text-white border-success' : 'bg-white'}`}
                                    style={{ width: 20, height: 20, zIndex: 1 }}
                                  >
                                    {estado.paso > index + 1 && <i className="bi bi-check" aria-hidden="true" />}
                                  </span>
                                  <span className="d-block">{paso}</span>
                                </div>
                              ))}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {apartadoActivo === 'direcciones' && (
                <div className="card border p-3 p-md-4 p-xl-5 shadow-sm" style={{ borderColor: '#eee6dc', backgroundColor: 'rgba(255,255,255,.8)' }}>
                  <div className="mb-4">
                    <h3 className="h4 fw-normal mb-2">¿A dónde llevamos algo dulce?</h3>
                    <p className="text-secondary small mb-0">Guarda tus direcciones para tenerlas a mano en tus próximos pedidos.</p>
                  </div>
                  <form className="row g-3 border-bottom pb-4 mb-4" onSubmit={guardarDireccion}>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="perfil-alias-direccion">Nombre de la dirección</label>
                      <input id="perfil-alias-direccion" className="form-control" value={direccion.alias} onChange={(evento) => setDireccion({ ...direccion, alias: evento.target.value })} placeholder="Casa, trabajo..." maxLength="60" required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="perfil-direccion">Dirección</label>
                      <input id="perfil-direccion" className="form-control" value={direccion.direccion} onChange={(evento) => setDireccion({ ...direccion, direccion: evento.target.value })} placeholder="Calle, número, barrio" maxLength="255" required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="perfil-ciudad">Ciudad</label>
                      <input id="perfil-ciudad" className="form-control" value={direccion.ciudad} onChange={(evento) => setDireccion({ ...direccion, ciudad: evento.target.value })} placeholder="Tu ciudad" maxLength="100" required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="perfil-referencia">Referencia <span className="text-secondary fw-normal">(opcional)</span></label>
                      <input id="perfil-referencia" className="form-control" value={direccion.referencia} onChange={(evento) => setDireccion({ ...direccion, referencia: evento.target.value })} placeholder="Indicaciones para llegar" maxLength="255" />
                    </div>
                    <div className="col-12 pt-2">
                      <button className="btn px-4" style={estiloTerracota} type="submit" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar dirección'}
                      </button>
                    </div>
                  </form>
                  {perfil.direcciones.length > 0 && (
                    <div className="d-grid gap-2">
                      <h3 className="h5 fw-normal mb-1">Direcciones guardadas</h3>
                      {perfil.direcciones.map((item) => (
                        <article className="card border p-3" key={item.id_direccion} style={{ borderColor: '#eee6dc', backgroundColor: '#fffdfa' }}>
                          <div className="d-flex align-items-start gap-3">
                            <span className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40, backgroundColor: '#f5eee7', color: '#87533f' }}>
                              <i className="bi bi-geo-alt" aria-hidden="true" />
                            </span>
                            <div className="flex-grow-1">
                              <strong className="d-block small">{item.alias}</strong>
                              <p className="small text-secondary mb-1">{item.direccion}, {item.ciudad}</p>
                              {item.referencia && <small className="text-secondary">{item.referencia}</small>}
                            </div>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              aria-label={`Eliminar dirección ${item.alias}`}
                              onClick={() => eliminarDireccion(item.id_direccion)}
                            >
                              <i className="bi bi-trash3" aria-hidden="true" />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {apartadoActivo === 'favoritos' && (
                <div className="card border p-3 p-md-4 p-xl-5 shadow-sm" style={{ borderColor: '#eee6dc', backgroundColor: 'rgba(255,255,255,.8)' }}>
                  <div className="mb-4">
                    <h3 className="h4 fw-normal mb-2">Tus pequeños grandes favoritos</h3>
                    <p className="text-secondary small mb-0">Guarda los postres que te gustaría volver a disfrutar.</p>
                  </div>
                  <form className="mb-4" onSubmit={agregarFavorito}>
                    <label className="form-label small fw-semibold" htmlFor="perfil-producto">Añadir un postre de la vitrina</label>
                    <div className="d-flex flex-column flex-sm-row gap-2">
                      <select
                        className="form-select"
                        id="perfil-producto"
                        value={productoSeleccionado}
                        onChange={(evento) => setProductoSeleccionado(evento.target.value)}
                        required
                      >
                        <option value="">Elige un postre</option>
                        {productos.filter((producto) => !idsFavoritos.has(producto.id_producto)).map((producto) => (
                          <option key={producto.id_producto} value={producto.id_producto}>{producto.nombre}</option>
                        ))}
                      </select>
                      <button className="btn px-4 flex-shrink-0" style={estiloTerracota} type="submit" disabled={!productoSeleccionado}>
                        <i className="bi bi-heart" aria-hidden="true" /> Añadir
                      </button>
                    </div>
                  </form>
                  {perfil.favoritos.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-heart fs-2 d-block mb-3" aria-hidden="true" style={{ color: '#b7856b' }} />
                      <h3 className="h5 fw-normal">Tu lista está esperando algo rico</h3>
                      <p className="text-secondary small mb-0">Elige un postre arriba para guardarlo en tus favoritos.</p>
                    </div>
                  ) : (
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3">
                      {perfil.favoritos.map((producto) => (
                        <article className="col" key={producto.id_producto}>
                          <div className="card h-100 border overflow-hidden" style={{ borderColor: '#eee6dc', backgroundColor: '#fffdfa' }}>
                          <img
                            src={producto.imagen || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'}
                            alt={producto.nombre}
                            className="card-img-top object-fit-cover"
                            style={{ height: 155 }}
                          />
                          <div className="card-body d-flex align-items-center justify-content-between gap-2 p-3">
                            <div>
                              <strong className="d-block small">{producto.nombre}</strong>
                              <span className="small" style={{ color: '#8d7161' }}>${Number(producto.precio).toLocaleString('es-CO')}</span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-link p-1"
                              style={{ color: '#a45b4b' }}
                              aria-label={`Quitar ${producto.nombre} de favoritos`}
                              onClick={() => eliminarFavorito(producto.id_producto)}
                            >
                              <i className="bi bi-heart-fill" aria-hidden="true" />
                            </button>
                          </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </>
          )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Perfil;
