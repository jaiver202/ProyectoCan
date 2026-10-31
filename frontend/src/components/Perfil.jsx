import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Perfil.css';

const API_URL = 'http://localhost:3000/api/perfil';

const apartados = [
  { id: 'informacion', nombre: 'Mi información', icono: 'bi-person' },
  { id: 'pedidos', nombre: 'Mis pedidos', icono: 'bi-bag' },
  { id: 'seguimiento', nombre: 'Seguimiento', icono: 'bi-truck' },
  { id: 'direcciones', nombre: 'Mis direcciones', icono: 'bi-geo-alt' },
  { id: 'favoritos', nombre: 'Favoritos', icono: 'bi-heart' },
  { id: 'seguridad', nombre: 'Seguridad', icono: 'bi-shield-lock' }
];

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
  const [contrasenas, setContrasenas] = useState({ actual: '', nueva: '', confirmar: '' });

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

  const cambiarContrasena = async (evento) => {
    evento.preventDefault();
    limpiarAvisos();
    if (contrasenas.nueva !== contrasenas.confirmar) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    if (contrasenas.nueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setGuardando(true);
    try {
      const response = await axios.put(`${API_URL}/contrasena`, {
        contrasenaActual: contrasenas.actual,
        contrasenaNueva: contrasenas.nueva
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setContrasenas({ actual: '', nueva: '', confirmar: '' });
      setMensaje(response.data.mensaje);
    } catch (err) {
      mostrarError(err, 'No se pudo cambiar la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  const apartadoNombre = apartados.find((apartado) => apartado.id === apartadoActivo)?.nombre;
  const idsFavoritos = new Set((perfil?.favoritos || []).map((item) => item.id_producto));

  return (
    <main className="perfil-page">
      <header className="perfil-topbar">
        <button type="button" className="perfil-brand" onClick={volverATienda} aria-label="Volver a CandyKane">
          <span className="perfil-brand-mark">C</span>
          <span>
            <strong>CandyKane</strong>
            <small>Pastelería artesanal</small>
          </span>
        </button>
        <button type="button" className="perfil-back-link" onClick={volverATienda}>
          <i className="bi bi-arrow-left" aria-hidden="true" /> Volver a la tienda
        </button>
      </header>

      <div className="perfil-layout">
        <aside className="perfil-sidebar">
          <div className="perfil-welcome">
            <span className="perfil-avatar">
              {(perfil?.usuario?.nombre || usuario?.nombre || 'U').charAt(0).toUpperCase()}
            </span>
            <div>
              <span className="perfil-eyebrow">TU CUENTA</span>
              <h1>{perfil?.usuario?.nombre || usuario?.nombre || 'Mi perfil'}</h1>
              <p>{perfil?.usuario?.correo || usuario?.correo || 'Área personal'}</p>
            </div>
          </div>

          <nav className="perfil-nav" aria-label="Apartados del perfil">
            {apartados.map((apartado) => (
              <button
                type="button"
                key={apartado.id}
                className={`perfil-nav-item${apartadoActivo === apartado.id ? ' is-active' : ''}`}
                onClick={() => {
                  setApartadoActivo(apartado.id);
                  limpiarAvisos();
                }}
              >
                <i className={`bi ${apartado.icono}`} aria-hidden="true" />
                <span>{apartado.nombre}</span>
                <i className="bi bi-chevron-right perfil-nav-chevron" aria-hidden="true" />
              </button>
            ))}
          </nav>

          <button type="button" className="perfil-logout" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right" aria-hidden="true" />
            Cerrar sesión
          </button>
        </aside>

        <section className="perfil-content">
          <div className="perfil-content-heading">
            <div>
              <span className="perfil-eyebrow">ÁREA PERSONAL</span>
              <h2>{apartadoNombre}</h2>
            </div>
            <span className="perfil-heading-flourish" aria-hidden="true">✦</span>
          </div>

          {error && <div className="perfil-alert perfil-alert-error" role="alert">{error}</div>}
          {mensaje && <div className="perfil-alert perfil-alert-success" role="status">{mensaje}</div>}

          {cargando ? (
            <div className="perfil-loading">
              <span className="spinner-border spinner-border-sm" role="status" />
              <span>Cargando tu información...</span>
            </div>
          ) : !perfil ? (
            <div className="perfil-empty">
              <i className="bi bi-person-exclamation" aria-hidden="true" />
              <p>No pudimos abrir tu perfil. Vuelve a iniciar sesión para continuar.</p>
              <button type="button" className="perfil-button" onClick={cerrarSesion}>Ir al inicio</button>
            </div>
          ) : (
            <>
              {apartadoActivo === 'informacion' && (
                <div className="perfil-panel">
                  <div className="perfil-panel-intro">
                    <h3>Un espacio solo para ti</h3>
                    <p>Mantén tus datos al día para que podamos atenderte mejor.</p>
                  </div>
                  <form className="perfil-form" onSubmit={guardarInformacion}>
                    <label>
                      Nombre completo
                      <input
                        type="text"
                        autoComplete="name"
                        value={informacion.nombre}
                        onChange={(evento) => setInformacion({ ...informacion, nombre: evento.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Correo electrónico
                      <input
                        type="email"
                        autoComplete="email"
                        value={informacion.correo}
                        onChange={(evento) => setInformacion({ ...informacion, correo: evento.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Teléfono
                      <input
                        type="tel"
                        autoComplete="tel"
                        value={informacion.telefono}
                        onChange={(evento) => setInformacion({ ...informacion, telefono: evento.target.value })}
                        placeholder="Añade un número de contacto"
                      />
                    </label>
                    <div className="perfil-form-actions">
                      <button className="perfil-button" type="submit" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {apartadoActivo === 'pedidos' && (
                <div className="perfil-panel">
                  <div className="perfil-panel-intro">
                    <h3>El historial de tus antojos</h3>
                    <p>Aquí encontrarás tus pedidos anteriores y los que están en curso.</p>
                  </div>
                  {perfil.pedidos.length === 0 ? (
                    <div className="perfil-empty">
                      <i className="bi bi-bag-heart" aria-hidden="true" />
                      <h3>Aún no tienes pedidos</h3>
                      <p>Cuando hagas tu primera compra, aparecerá aquí con todos sus detalles.</p>
                      <button type="button" className="perfil-button perfil-button-secondary" onClick={volverATienda}>
                        Explorar la vitrina
                      </button>
                    </div>
                  ) : (
                    <div className="perfil-order-list">
                      {perfil.pedidos.map((pedido) => {
                        const estado = obtenerEstado(pedido.estado);
                        return (
                          <article className="perfil-order-card" key={pedido.id_pedido}>
                            <div className="perfil-order-icon"><i className="bi bi-box-seam" aria-hidden="true" /></div>
                            <div className="perfil-order-details">
                              <strong>Pedido #{String(pedido.id_pedido).padStart(5, '0')}</strong>
                              <span>{new Date(pedido.creado_en).toLocaleDateString('es-CO', {
                                year: 'numeric', month: 'long', day: 'numeric'
                              })}</span>
                            </div>
                            <span className={`perfil-status perfil-status-${estado.paso}`}>{estado.texto}</span>
                            <strong className="perfil-order-total">
                              ${Number(pedido.total).toLocaleString('es-CO')}
                            </strong>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {apartadoActivo === 'seguimiento' && (
                <div className="perfil-panel">
                  <div className="perfil-panel-intro">
                    <h3>Tu pedido, paso a paso</h3>
                    <p>Consulta en qué etapa está cada una de tus delicias.</p>
                  </div>
                  {perfil.pedidos.length === 0 ? (
                    <div className="perfil-empty">
                      <i className="bi bi-truck" aria-hidden="true" />
                      <h3>No hay pedidos para seguir</h3>
                      <p>Cuando tengas un pedido, su estado aparecerá aquí.</p>
                    </div>
                  ) : (
                    <div className="perfil-tracking-list">
                      {perfil.pedidos.map((pedido) => {
                        const estado = obtenerEstado(pedido.estado);
                        return (
                          <article className="perfil-tracking-card" key={pedido.id_pedido}>
                            <div className="perfil-tracking-heading">
                              <strong>Pedido #{String(pedido.id_pedido).padStart(5, '0')}</strong>
                              <span className={`perfil-status perfil-status-${estado.paso}`}>{estado.texto}</span>
                            </div>
                            <div className="perfil-tracking-steps">
                              {['Pendiente', 'En preparación', 'Entregado'].map((paso, index) => (
                                <div className={`perfil-tracking-step${estado.paso >= index + 1 ? ' is-complete' : ''}`} key={paso}>
                                  <span className="perfil-step-dot">
                                    {estado.paso > index + 1 ? <i className="bi bi-check" aria-hidden="true" /> : null}
                                  </span>
                                  <span>{paso}</span>
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
                <div className="perfil-panel">
                  <div className="perfil-panel-intro">
                    <h3>¿A dónde llevamos algo dulce?</h3>
                    <p>Guarda tus direcciones para tenerlas a mano en tus próximos pedidos.</p>
                  </div>
                  <form className="perfil-form perfil-address-form" onSubmit={guardarDireccion}>
                    <label>
                      Nombre de la dirección
                      <input
                        value={direccion.alias}
                        onChange={(evento) => setDireccion({ ...direccion, alias: evento.target.value })}
                        placeholder="Casa, trabajo..."
                        maxLength="60"
                        required
                      />
                    </label>
                    <label>
                      Dirección
                      <input
                        value={direccion.direccion}
                        onChange={(evento) => setDireccion({ ...direccion, direccion: evento.target.value })}
                        placeholder="Calle, número, barrio"
                        maxLength="255"
                        required
                      />
                    </label>
                    <label>
                      Ciudad
                      <input
                        value={direccion.ciudad}
                        onChange={(evento) => setDireccion({ ...direccion, ciudad: evento.target.value })}
                        placeholder="Tu ciudad"
                        maxLength="100"
                        required
                      />
                    </label>
                    <label>
                      Referencia <span className="perfil-optional">(opcional)</span>
                      <input
                        value={direccion.referencia}
                        onChange={(evento) => setDireccion({ ...direccion, referencia: evento.target.value })}
                        placeholder="Indicaciones para llegar"
                        maxLength="255"
                      />
                    </label>
                    <div className="perfil-form-actions">
                      <button className="perfil-button" type="submit" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar dirección'}
                      </button>
                    </div>
                  </form>
                  {perfil.direcciones.length > 0 && (
                    <div className="perfil-saved-list">
                      <h3>Direcciones guardadas</h3>
                      {perfil.direcciones.map((item) => (
                        <article className="perfil-saved-card" key={item.id_direccion}>
                          <span className="perfil-saved-icon"><i className="bi bi-geo-alt" aria-hidden="true" /></span>
                          <div>
                            <strong>{item.alias}</strong>
                            <p>{item.direccion}, {item.ciudad}</p>
                            {item.referencia && <small>{item.referencia}</small>}
                          </div>
                          <button
                            type="button"
                            className="perfil-icon-button"
                            aria-label={`Eliminar dirección ${item.alias}`}
                            onClick={() => eliminarDireccion(item.id_direccion)}
                          >
                            <i className="bi bi-trash3" aria-hidden="true" />
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {apartadoActivo === 'favoritos' && (
                <div className="perfil-panel">
                  <div className="perfil-panel-intro">
                    <h3>Tus pequeños grandes favoritos</h3>
                    <p>Guarda los postres que te gustaría volver a disfrutar.</p>
                  </div>
                  <form className="perfil-favorite-form" onSubmit={agregarFavorito}>
                    <label htmlFor="perfil-producto">Añadir un postre de la vitrina</label>
                    <div className="perfil-favorite-controls">
                      <select
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
                      <button className="perfil-button" type="submit" disabled={!productoSeleccionado}>
                        <i className="bi bi-heart" aria-hidden="true" /> Añadir
                      </button>
                    </div>
                  </form>
                  {perfil.favoritos.length === 0 ? (
                    <div className="perfil-empty">
                      <i className="bi bi-heart" aria-hidden="true" />
                      <h3>Tu lista está esperando algo rico</h3>
                      <p>Elige un postre arriba para guardarlo en tus favoritos.</p>
                    </div>
                  ) : (
                    <div className="perfil-favorite-grid">
                      {perfil.favoritos.map((producto) => (
                        <article className="perfil-favorite-card" key={producto.id_producto}>
                          <img
                            src={producto.imagen || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'}
                            alt={producto.nombre}
                          />
                          <div className="perfil-favorite-info">
                            <div>
                              <strong>{producto.nombre}</strong>
                              <span>${Number(producto.precio).toLocaleString('es-CO')}</span>
                            </div>
                            <button
                              type="button"
                              className="perfil-icon-button perfil-heart-button"
                              aria-label={`Quitar ${producto.nombre} de favoritos`}
                              onClick={() => eliminarFavorito(producto.id_producto)}
                            >
                              <i className="bi bi-heart-fill" aria-hidden="true" />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {apartadoActivo === 'seguridad' && (
                <div className="perfil-panel">
                  <div className="perfil-panel-intro">
                    <h3>Cuida el acceso a tu cuenta</h3>
                    <p>Elige una contraseña segura que no uses en otros sitios.</p>
                  </div>
                  <form className="perfil-form perfil-security-form" onSubmit={cambiarContrasena}>
                    <label>
                      Contraseña actual
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={contrasenas.actual}
                        onChange={(evento) => setContrasenas({ ...contrasenas, actual: evento.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Nueva contraseña
                      <input
                        type="password"
                        autoComplete="new-password"
                        minLength="8"
                        value={contrasenas.nueva}
                        onChange={(evento) => setContrasenas({ ...contrasenas, nueva: evento.target.value })}
                        required
                      />
                      <small>Debe tener al menos 8 caracteres.</small>
                    </label>
                    <label>
                      Confirmar nueva contraseña
                      <input
                        type="password"
                        autoComplete="new-password"
                        minLength="8"
                        value={contrasenas.confirmar}
                        onChange={(evento) => setContrasenas({ ...contrasenas, confirmar: evento.target.value })}
                        required
                      />
                    </label>
                    <div className="perfil-form-actions">
                      <button className="perfil-button" type="submit" disabled={guardando}>
                        {guardando ? 'Actualizando...' : 'Cambiar contraseña'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default Perfil;
