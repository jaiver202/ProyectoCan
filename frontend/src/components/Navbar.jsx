import React, { useContext, useState } from 'react';
import { CartContext } from './CartContext';

function Navbar({ onLoginClick, usuarioLogueado, cerrarSesion, irAlPerfil, irAlAdmin, irAlCarrito }) {
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const { cart } = useContext(CartContext);
  const totalItems = cart.reduce((total, item) => total + item.cantidad, 0);

  const cerrarMenuMovil = () => setMenuMovilAbierto(false);

  return (
    <header className="ck-header">
      <div className="ck-announcement">
        ENVÍO GRATUITO EN PEDIDOS SUPERIORES A $50.000
      </div>

      <nav className="ck-navbar" aria-label="Navegación principal">
        <button
          type="button"
          className="ck-menu-toggle"
          aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuMovilAbierto}
          aria-controls="ck-navigation-links"
          onClick={() => setMenuMovilAbierto((abierto) => !abierto)}
        >
          <span />
          <span />
          <span />
        </button>

        <ul
          id="ck-navigation-links"
          className={`ck-navigation-links${menuMovilAbierto ? ' is-open' : ''}`}
        >
          <li><a href="#nosotros" onClick={cerrarMenuMovil}>Nuestro obrador</a></li>
          <li><a href="#catalogo" onClick={cerrarMenuMovil}>Colección</a></li>
          <li><a href="#" onClick={cerrarMenuMovil}>Encargos</a></li>
          <li><a href="#nosotros" onClick={cerrarMenuMovil}>Visítanos</a></li>
          <li className="ck-account">
            <button
              type="button"
              aria-expanded={menuUsuarioAbierto}
              onClick={() => {
                cerrarMenuMovil();
                if (!usuarioLogueado) {
                  onLoginClick();
                  return;
                }
                setMenuUsuarioAbierto((abierto) => !abierto);
              }}
            >
              Mi cuenta
            </button>
            {usuarioLogueado && (
              <ul className={`ck-account-menu${menuUsuarioAbierto ? ' is-open' : ''}`}>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuUsuarioAbierto(false);
                      irAlPerfil();
                    }}
                  >
                    Mi perfil
                  </button>
                </li>
                {usuarioLogueado.rol === 'admin' && (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuUsuarioAbierto(false);
                        irAlAdmin();
                      }}
                    >
                      Panel administrativo
                    </button>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    className="ck-signout"
                    onClick={() => {
                      setMenuUsuarioAbierto(false);
                      cerrarSesion();
                    }}
                  >
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            )}
          </li>
        </ul>

        <a className="ck-brand" href="#" aria-label="CandyKane, inicio">
          <span className="ck-brand-mark" aria-hidden="true">C</span>
          <span className="ck-brand-copy">
            <span className="ck-brand-name">CandyKane</span>
            <span className="ck-brand-tagline">Pastelería artesanal</span>
          </span>
        </a>

        <button type="button" className="ck-cart-link" onClick={irAlCarrito}>
          <svg
            className="ck-cart-icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M7 8V6a5 5 0 0 1 10 0v2M5.5 8h13l1 13h-15l1-13Z" />
          </svg>
          <span>Cesta</span>
          <span className="ck-cart-count" aria-label={`${totalItems} productos`}>
            {totalItems}
          </span>
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
