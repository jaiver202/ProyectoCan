import React, { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { CartContext } from './CartContext';

const API_URL = 'http://localhost:3000';
const UMBRAL_ENVIO_GRATIS = 50000;

function formatPrice(value) {
  return `$${Number(value).toLocaleString('es-CO')}`;
}

function CartView({ usuario, volverATienda, iniciarSesion }) {
  const { cart, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const [procesandoCompra, setProcesandoCompra] = useState(false);
  const [validandoRevision, setValidandoRevision] = useState(false);
  const panelRef = useRef(null);
  const compraActivaRef = useRef(false);
  const [etapa, setEtapa] = useState('cesta');
  const [modalidadEntrega, setModalidadEntrega] = useState('domicilio');
  const [direccionEntrega, setDireccionEntrega] = useState(usuario?.direccion || '');
  const [metodoPago, setMetodoPago] = useState('transferencia');
  const [errorCheckout, setErrorCheckout] = useState('');
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const [productosRevision, setProductosRevision] = useState(new Map());
  const precioActual = (item) => Number(
    productosRevision.get(String(item.id_producto))?.precio ?? item.precio
  );
  const subtotal = cart.reduce((total, item) => total + precioActual(item) * item.cantidad, 0);
  const faltaParaEnvioGratis = Math.max(UMBRAL_ENVIO_GRATIS - subtotal, 0);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    const elementoEnfocado = document.activeElement;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const manejarTecladoDelPanel = (event) => {
      if (event.key === 'Escape') {
        if (!compraActivaRef.current) volverATienda();
        return;
      }

      if (event.key !== 'Tab') return;

      const elementosEnfocables = panelRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!elementosEnfocables?.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const primero = elementosEnfocables[0];
      const ultimo = elementosEnfocables[elementosEnfocables.length - 1];
      if (event.shiftKey && (document.activeElement === primero || document.activeElement === panelRef.current)) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && (document.activeElement === ultimo || document.activeElement === panelRef.current)) {
        event.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener('keydown', manejarTecladoDelPanel);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', manejarTecladoDelPanel);
      if (elementoEnfocado instanceof HTMLElement) elementoEnfocado.focus();
    };
  }, [volverATienda]);

  const continuarAlResumen = async () => {
    if (compraActivaRef.current || validandoRevision) return;
    setErrorCheckout('');
    if (cart.length === 0) {
      setErrorCheckout('Tu cesta está vacía.');
      return;
    }

    if (!usuario || !localStorage.getItem('token')) {
      setErrorCheckout('Inicia sesión para continuar con tu pedido.');
      return;
    }

    compraActivaRef.current = true;
    setValidandoRevision(true);
    try {
      const { data: productosActuales } = await axios.get(`${API_URL}/api/productos`);
      const productosPorId = new Map(
        productosActuales.map((producto) => [String(producto.id_producto), producto])
      );
      const faltantes = cart.flatMap((item) => {
        const producto = productosPorId.get(String(item.id_producto));
        if (!producto) return [`${item.nombre} ya no está disponible.`];
        if (Number(producto.stock) < item.cantidad) {
          return [`${item.nombre}: disponibles ${Number(producto.stock)}, solicitados ${item.cantidad}.`];
        }
        return [];
      });

      if (faltantes.length > 0) {
        setErrorCheckout(faltantes.join(' '));
        return;
      }

      setProductosRevision(productosPorId);
      setEtapa('revision');
    } catch (error) {
      console.error('Error al validar el pedido:', error);
      setErrorCheckout('No se pudo actualizar el inventario y los precios. Inténtalo nuevamente.');
    } finally {
      compraActivaRef.current = false;
      setValidandoRevision(false);
    }
  };

  const handleCheckout = async () => {
    if (compraActivaRef.current) return;
    if (cart.length === 0) {
      setErrorCheckout('Tu cesta está vacía.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!usuario || !token) {
      setErrorCheckout('Inicia sesión para confirmar tu pedido.');
      return;
    }
    if (modalidadEntrega === 'domicilio' && !direccionEntrega.trim()) {
      setErrorCheckout('Ingresa la dirección donde quieres recibir tu pedido.');
      return;
    }

    setErrorCheckout('');
    compraActivaRef.current = true;
    setProcesandoCompra(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/pedidos`, {
        modalidad_entrega: modalidadEntrega,
        direccion_entrega: modalidadEntrega === 'domicilio' ? direccionEntrega.trim() : '',
        metodo_pago: metodoPago,
        productos: cart.map((item) => ({
          id_producto: item.id_producto,
          cantidad: item.cantidad
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPedidoConfirmado(data.pedido);
      clearCart();
      setEtapa('confirmado');
    } catch (error) {
      console.error('Error al procesar el pedido:', error);
      setErrorCheckout(error.response?.data?.error || 'No se pudo registrar el pedido.');
    } finally {
      compraActivaRef.current = false;
      setProcesandoCompra(false);
    }
  };

  return (
    <div className="cart-overlay">
      <button
        type="button"
        className="cart-backdrop"
        aria-label="Cerrar cesta"
        disabled={procesandoCompra || validandoRevision}
        onClick={volverATienda}
      />
      <aside
        ref={panelRef}
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex="-1"
      >
        <header className="cart-drawer-header">
          <div>
            <span className="cart-eyebrow">Tu selección</span>
            <h2 id="cart-title">
              {etapa === 'revision' ? 'Revisar pedido' : etapa === 'confirmado' ? 'Pedido listo' : 'La cesta'}
            </h2>
          </div>
          <button
            type="button"
            className="cart-close"
            aria-label="Cerrar cesta"
            disabled={procesandoCompra || validandoRevision}
            onClick={volverATienda}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {etapa === 'confirmado' ? (
          <div className="cart-confirmation">
            <span className="cart-confirmation-icon" aria-hidden="true">✓</span>
            <span className="cart-eyebrow">Gracias por elegir CandyKane</span>
            <h3>Tu pedido fue confirmado</h3>
            <p>Guarda este número para consultar tu pedido:</p>
            <strong className="cart-order-number">
              #{String(pedidoConfirmado?.id_pedido).padStart(5, '0')}
            </strong>
            <p className="cart-confirmation-total">
              Total del pedido: <strong>{formatPrice(pedidoConfirmado?.total ?? subtotal)}</strong>
            </p>
            <p className="cart-confirmation-note">
              Te contactaremos para coordinar el pago y {modalidadEntrega === 'recogida' ? 'la recogida' : 'la entrega'}.
            </p>
            <button type="button" className="cart-continue-button" onClick={volverATienda}>
              Seguir comprando
            </button>
          </div>
        ) : etapa === 'revision' ? (
          <>
            <div className="cart-items cart-checkout-content">
              <button
                type="button"
                className="cart-back-button"
                disabled={procesandoCompra || validandoRevision}
                onClick={() => {
                  setErrorCheckout('');
                  setEtapa('cesta');
                }}
              >
                ← Volver a la cesta
              </button>

              <section className="checkout-section" aria-labelledby="delivery-title">
                <h3 id="delivery-title">Entrega o recogida</h3>
                <div className="checkout-options">
                  <label className={`checkout-option${modalidadEntrega === 'domicilio' ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="modalidad-entrega"
                      value="domicilio"
                      checked={modalidadEntrega === 'domicilio'}
                      disabled={procesandoCompra || validandoRevision}
                      onChange={() => setModalidadEntrega('domicilio')}
                    />
                    <span>
                      <strong>Envío a domicilio</strong>
                      <small>Coordinaremos la entrega contigo.</small>
                    </span>
                  </label>
                  <label className={`checkout-option${modalidadEntrega === 'recogida' ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="modalidad-entrega"
                      value="recogida"
                      checked={modalidadEntrega === 'recogida'}
                      disabled={procesandoCompra || validandoRevision}
                      onChange={() => setModalidadEntrega('recogida')}
                    />
                    <span>
                      <strong>Recoger en tienda</strong>
                      <small>Te avisaremos cuando esté listo.</small>
                    </span>
                  </label>
                </div>
                {modalidadEntrega === 'domicilio' && (
                  <label className="checkout-field">
                    <span>Dirección de entrega</span>
                    <textarea
                      rows="2"
                      maxLength="500"
                      required
                      value={direccionEntrega}
                      disabled={procesandoCompra || validandoRevision}
                      placeholder="Calle, número, barrio y ciudad"
                      onChange={(event) => setDireccionEntrega(event.target.value)}
                    />
                  </label>
                )}
              </section>

              <section className="checkout-section" aria-labelledby="payment-title">
                <h3 id="payment-title">Método de pago</h3>
                <div className="checkout-options">
                  <label className={`checkout-option${metodoPago === 'transferencia' ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="metodo-pago"
                      value="transferencia"
                      checked={metodoPago === 'transferencia'}
                      disabled={procesandoCompra || validandoRevision}
                      onChange={() => setMetodoPago('transferencia')}
                    />
                    <span>
                      <strong>Transferencia</strong>
                      <small>Te compartiremos los datos para pagar.</small>
                    </span>
                  </label>
                  <label className={`checkout-option${metodoPago === 'efectivo' ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="metodo-pago"
                      value="efectivo"
                      checked={metodoPago === 'efectivo'}
                      disabled={procesandoCompra || validandoRevision}
                      onChange={() => setMetodoPago('efectivo')}
                    />
                    <span>
                      <strong>Efectivo</strong>
                      <small>Al recibir el pedido o recogerlo.</small>
                    </span>
                  </label>
                </div>
              </section>

              <section className="checkout-section checkout-review" aria-labelledby="review-title">
                <h3 id="review-title">Resumen de productos</h3>
                {cart.map((item) => (
                  <div className="checkout-review-row" key={item.id_producto}>
                    <span>{item.cantidad} × {item.nombre}</span>
                    <strong>{formatPrice(precioActual(item) * item.cantidad)}</strong>
                  </div>
                ))}
                <div className="checkout-review-total">
                  <span>Total estimado</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
              </section>
              {errorCheckout && (
                <p className="checkout-error" role="alert">
                  {errorCheckout}
                  {(!usuario || !localStorage.getItem('token')) && (
                    <button type="button" onClick={iniciarSesion}>Iniciar sesión</button>
                  )}
                </p>
              )}
            </div>
            <footer className="cart-summary checkout-footer">
              <p className="cart-shipping-detail">
                El costo de envío, si aplica, se confirmará al coordinar la entrega.
              </p>
              <div className="cart-summary-total">
                <span>Total estimado</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <button
                type="button"
                className="cart-checkout-button"
                onClick={handleCheckout}
                disabled={procesandoCompra || validandoRevision}
              >
                <span>{procesandoCompra ? 'Registrando pedido...' : 'Confirmar pedido'}</span>
                <span aria-hidden="true">→</span>
              </button>
              <p className="checkout-payment-note">No se realizará ningún cobro en línea.</p>
            </footer>
          </>
        ) : cart.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-mark" aria-hidden="true">C</span>
            <h3>Tu cesta está vacía</h3>
            <p>Descubre nuestras preparaciones artesanales y elige tus favoritas.</p>
            <button type="button" className="cart-continue-button" onClick={volverATienda}>
              Volver a la vitrina
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items" aria-label="Productos en tu cesta">
              {cart.map((item) => (
                <article className="cart-item" key={item.id_producto}>
                  <img
                    className="cart-item-image"
                    src={item.imagen || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'}
                    alt={item.nombre}
                  />
                  <div className="cart-item-details">
                    <span className="cart-item-category">{item.categoria || 'Artesanal'}</span>
                    <h3>{item.nombre}</h3>
                    <span className="cart-item-price">{formatPrice(item.precio)}</span>
                    <div className="cart-item-controls">
                      <div className="cart-quantity" aria-label={`Cantidad de ${item.nombre}`}>
                        <button
                          type="button"
                          aria-label={`Reducir cantidad de ${item.nombre}`}
                          disabled={procesandoCompra || validandoRevision || item.cantidad <= 1}
                          onClick={() => updateQuantity(item.id_producto, item.cantidad - 1)}
                        >
                          −
                        </button>
                        <span aria-live="polite">{item.cantidad}</span>
                        <button
                          type="button"
                          aria-label={`Aumentar cantidad de ${item.nombre}`}
                          disabled={procesandoCompra || validandoRevision || (Number.isFinite(Number(item.stock)) && item.cantidad >= Number(item.stock))}
                          onClick={() => updateQuantity(item.id_producto, item.cantidad + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="cart-remove"
                        disabled={procesandoCompra || validandoRevision}
                        onClick={() => removeFromCart(item.id_producto)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <footer className="cart-summary">
              <p className="cart-shipping-note">
                {faltaParaEnvioGratis === 0
                  ? 'Tu pedido incluye envío gratuito.'
                  : `Agrega ${formatPrice(faltaParaEnvioGratis)} para obtener envío gratuito.`}
              </p>
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="cart-shipping-detail">
                El costo de envío, si aplica, se confirmará al coordinar la entrega.
              </p>
              <div className="cart-summary-total">
                <span>Total estimado</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              {errorCheckout && (
                <p className="checkout-error" role="alert">
                  {errorCheckout}
                  {(!usuario || !localStorage.getItem('token')) && (
                    <button type="button" onClick={iniciarSesion}>Iniciar sesión</button>
                  )}
                </p>
              )}
              <button
                type="button"
                className="cart-checkout-button"
                onClick={continuarAlResumen}
                disabled={procesandoCompra || validandoRevision}
              >
                <span>{validandoRevision ? 'Actualizando precios...' : 'Continuar con el pedido'}</span>
                <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="cart-clear-button"
                onClick={clearCart}
                disabled={procesandoCompra || validandoRevision}
              >
                Vaciar cesta
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

export default CartView;
