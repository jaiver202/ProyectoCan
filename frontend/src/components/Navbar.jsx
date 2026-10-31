import React from 'react';

function Navbar({ onLoginClick }) {
  return (
    <div className="w-100">
      {/* 1. Barra de aviso superior */}
      <div style={{ backgroundColor: '#7b3f2e', color: '#fff', fontSize: '12px', letterSpacing: '1px' }} className="py-2 text-center fw-light w-100">
        ENVÍO GRATUITO EN PEDIDOS SUPERIORES A $50.000
      </div>

      {/* 2. Barra de Navegación Principal */}
      <nav className="navbar navbar-expand-lg navbar-light py-3 border-bottom w-100 px-4" style={{ backgroundColor: '#fbf8f3' }}>
        <div className="container-fluid">
          
          {/* Logo / Marca */}
          <a className="navbar-brand fw-bold fs-3 text-dark text-start" href="#" style={{ fontFamily: 'Georgia, serif', letterSpacing: '1px' }}>
            🍬 CandyKane 
            <span className="d-block" style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: '#7b3f2e' }}>
              Pastelería Artesanal
            </span>
          </a>

          {/* Botón hamburguesa para celulares */}
          <button 
            className="navbar-toggler border-0 shadow-none" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#menuResponsive"
            aria-controls="menuResponsive" 
            aria-expanded="false" 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Menú colapsable para que sea responsive */}
          <div className="collapse navbar-collapse justify-content-between mt-3 mt-lg-0" id="menuResponsive">
            
            {/* Enlaces centrales */}
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

            {/* Acciones de la derecha (Cesta y Login) */}
            <div className="d-flex justify-content-center align-items-center gap-3 pb-2 pb-lg-0">
              <button className="btn btn-outline-dark btn-sm rounded-pill px-3 border-0 bg-transparent">
                🛒 Cesta <span className="badge rounded-circle bg-dark text-white ms-1">0</span>
              </button>
              
              {/* Botón con el evento onClick */}
              <button 
                className="btn btn-terracota btn-sm px-4 rounded-pill"
                onClick={onLoginClick}
              >
                Iniciar Sesión
              </button>
            </div>

          </div>

        </div>
      </nav>
    </div>
  );
}

export default Navbar;