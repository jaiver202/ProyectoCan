import React from 'react';

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="text-light pt-5 pb-4" style={{ backgroundColor: '#2b1d1a', fontFamily: 'Georgia, serif' }}>
      <div className="container py-4">
        <div className="row gy-4 justify-content-between">
          <div className="col-lg-3">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div 
                className="rounded-circle border border-light d-flex align-items-center justify-content-center"
                style={{ width: '40px', height: '40px', fontFamily: 'Georgia, serif', fontSize: '17px', color: '#fff' }}
              >
                C
              </div>
              <div>
                <h4 className="m-0 fw-normal text-white" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.5px', fontSize: '20px' }}>
                  CandyKane
                </h4>
              </div>
            </div>
            <span className="text-uppercase small" style={{ color: '#c4a482', letterSpacing: '2.5px', fontSize: '9px' }}>
              PASTELERÍA ARTESANAL
            </span>
          </div>

          {/* Columna 2: Visítanos */}
          <div className="col-lg-3">
            <h6 className="text-uppercase fw-bold mb-3" style={{ color: '#c4a482', fontSize: '11px', letterSpacing: '2px' }}>
              VISÍTANOS
            </h6>
            <p className="small text-light mb-1 opacity-75">Calle del Dulce, 24</p>
            <p className="small text-light mb-2 opacity-75">18001 Granada</p>
            <p className="small text-light mb-1 opacity-75">Mar–Sáb · 9:00–20:00</p>
            <p className="small text-light mb-0 opacity-75">Dom · 9:00–15:00</p>
          </div>

          {/* Columna 3: Contacto */}
          <div className="col-lg-2">
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

          <div className="col-lg-3">
            <h6 className="text-uppercase fw-bold mb-2" style={{ color: '#c4a482', fontSize: '11px', letterSpacing: '2px' }}>
              CARTAS DESDE EL OBRADOR
            </h6>
            <p className="small text-light mb-3 opacity-75" style={{ fontSize: '13px' }}>
              Novedades, recetas y algo dulce para tu bandeja de entrada.
            </p>
            <div className="position-relative border-bottom border-secondary pb-1">
              <input 
                type="email" 
                placeholder="Tu correo electrónico" 
                className="bg-transparent border-0 text-light w-100 small shadow-none" 
                style={{ outline: 'none', fontSize: '13px' }}
              />
              <button 
                onClick={() => alert('¡Gracias por suscribirte a CandyKane!')}
                className="btn btn-sm text-light position-absolute end-0 top-0 p-0 border-0 bg-transparent"
              >
                →
              </button>
            </div>
          </div>

        </div>

      
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