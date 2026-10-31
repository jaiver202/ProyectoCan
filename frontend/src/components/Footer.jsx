import React from 'react';

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="text-light pt-5 pb-4" style={{ backgroundColor: '#7b3f2e', fontFamily: 'Georgia, serif' }}>
      <div className="container py-4">
        <div className="row gy-4 justify-content-between">
          
          {/* Columna 1: Logo y Marca */}
          <div className="col-12 col-sm-6 col-lg-3">
            <h4 className="fw-normal mb-2 text-white" style={{ letterSpacing: '1px' }}>
              🍬 Lumbre
            </h4>
            <span className="text-uppercase small" style={{ color: '#c4a482', letterSpacing: '2px', fontSize: '10px' }}>
              PASTELERÍA ARTESANAL
            </span>
          </div>

          {/* Columna 2: Visítanos */}
          <div className="col-12 col-sm-6 col-lg-3">
            <h6 className="text-uppercase fw-bold mb-3" style={{ color: '#c4a482', fontSize: '11px', letterSpacing: '2px' }}>
              VISÍTANOS
            </h6>
            <p className="small text-light mb-1 opacity-75">Calle del Dulce, 24</p>
            <p className="small text-light mb-2 opacity-75">18001 Granada</p>
            <p className="small text-light mb-1 opacity-75">Mar–Sáb · 9:00–20:00</p>
            <p className="small text-light mb-0 opacity-75">Dom · 9:00–15:00</p>
          </div>

          {/* Columna 3: Contacto */}
          <div className="col-12 col-sm-6 col-lg-2">
            <h6 className="text-uppercase fw-bold mb-3" style={{ color: '#c4a482', fontSize: '11px', letterSpacing: '2px' }}>
              CONTACTO
            </h6>
            <p className="small text-light mb-1 opacity-75">+34 910 000 000</p>
            <p className="small text-light mb-2 opacity-75">hola@candykane.es</p>
            <p className="small mb-0">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-light text-decoration-none opacity-75">
                Instagram
              </a>
            </p>
          </div>

          {/* Columna 4: Newsletter / Cartas desde el obrador */}
          <div className="col-12 col-sm-6 col-lg-3">
            <h6 className="text-uppercase fw-bold mb-2" style={{ color: '#c4a482', fontSize: '11px', letterSpacing: '2px' }}>
              CARTAS DESDE EL OBRADOR
            </h6>
            <p className="small text-light mb-3 opacity-75" style={{ fontSize: '13px' }}>
              Novedades, recetas y algo dulce para tu bandeja de entrada.
            </p>
            
          </div>

        </div>

        {/* Línea divisoria y Copyright */}
        <hr className="my-5 border-secondary opacity-25" />

        <div className="row align-items-center small text-light opacity-75">
          <div className="col-md-4 text-center text-md-start mb-3 mb-md-0">
            © 2026 CandyKane Pastelería
          </div>
          <div className="col-md-4 text-center mb-3 mb-md-0" style={{ fontSize: '12px', letterSpacing: '1px', color: '#c4a482' }}>
            Ingredientes honestos · Manos expertas · Mucho cariño
          </div>
          <div className="col-md-4 text-center text-md-end">
            <button 
              onClick={scrollToTop}
              className="btn btn-link text-light text-decoration-none p-0 small opacity-75"
              style={{ fontSize: '12px' }}
            >
              Volver arriba ↑
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;