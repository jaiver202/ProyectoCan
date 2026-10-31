import React, { useState } from 'react';

function Navbar({ onLoginClick, usuarioLogueado, cerrarSesion, irAlPerfil }) {
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  return (
    <div className="w-100">
      <div style={{ backgroundColor: '#7b3f2e', color: '#fff', fontSize: '12px', letterSpacing: '1px' }} className="py-2 text-center fw-light w-100">
        ENVÍO GRATUITO EN PEDIDOS SUPERIORES A $50.000
      </div>

      <nav className="navbar navbar-expand-lg navbar-light py-3 border-bottom w-100 px-4" style={{ backgroundColor: '#fbf8f3' }}>
        <div className="container-fluid">
          
          <a className="navbar-brand d-flex align-items-center gap-3 text-dark text-start" href="#">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '42px', height: '42px', fontFamily: 'Georgia, serif', fontSize: '18px', border: '1px solid #3d2c29', color: '#3d2c29' }}
            >
              C
            </div>
            <div>
              <h4 className="m-0 fw-normal" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.5px', color: '#3d2c29' }}>
                CandyKane
              </h4>
              <span className="d-block text-uppercase" style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#7b3f2e' }}>
                Pastelería Artesanal
              </span>
            </div>
          </a>

          <button 
            className="navbar-toggler border-0 shadow-none" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#menuResponsive"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-between mt-3 mt-lg-0" id="menuResponsive">
            
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-lg-4 text-center">
              <li className="nav-item">
                <a className="nav-link text-dark" href="#nosotros">Nuestro obrador</a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-dark" href="#catalogo">Colección</a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-dark" href="#">Encargos</a>
              </li>
            </ul>

            <div className="d-flex justify-content-center align-items-center gap-3 pb-2 pb-lg-0">
              <button className="btn btn-outline-dark btn-sm rounded-pill px-3 border-0 bg-transparent">
                🛒 Cesta <span className="badge rounded-circle bg-dark text-white ms-1">0</span>
              </button>
              
              {usuarioLogueado ? (
                <div className="dropdown d-flex">
                  <button
                    className="btn btn-terracota btn-sm ps-4 pe-2 rounded-start-pill"
                    type="button"
                    onClick={irAlPerfil}
                  >
                    Hola, {usuarioLogueado.nombre}
                  </button>
                  <button
                    className="btn btn-terracota btn-sm px-3 rounded-end-pill border-start"
                    type="button"
                    aria-label="Abrir menú de usuario"
                    aria-expanded={menuUsuarioAbierto}
                    onClick={() => setMenuUsuarioAbierto((abierto) => !abierto)}
                  >
                    <i className={`bi bi-chevron-${menuUsuarioAbierto ? 'up' : 'down'}`} aria-hidden="true" />
                  </button>
                  <ul className={`dropdown-menu dropdown-menu-end border-0 shadow-sm${menuUsuarioAbierto ? ' show' : ''}`} style={{ backgroundColor: '#fbf8f3' }}>
                    <li>
                      <button
                        className="dropdown-item small"
                        onClick={() => {
                          setMenuUsuarioAbierto(false);
                          irAlPerfil();
                        }}
                      >
                        Mi Perfil
                      </button>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button
                        className="dropdown-item small text-danger"
                        onClick={() => {
                          setMenuUsuarioAbierto(false);
                          cerrarSesion();
                        }}
                      >
                        Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <button 
                  className="btn btn-terracota btn-sm px-4 rounded-pill"
                  onClick={onLoginClick}
                >
                  Iniciar Sesión
                </button>
              )}
            </div>

          </div>

        </div>
      </nav>
    </div>
  );
}

export default Navbar;