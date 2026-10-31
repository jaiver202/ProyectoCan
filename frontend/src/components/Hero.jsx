import React from 'react';

function Hero() {
  return (
    <div className="container-fluid px-0 my-0">
      <div className="row g-0 align-items-stretch hero-row">
        
        {/* Columna Izquierda: Textos elegantes */}
        <div 
          className="col-lg-6 py-5 pe-4 pe-lg-5 d-flex flex-column justify-content-center hero-copy" 
          style={{ backgroundColor: '#f5f0e6', paddingLeft: '8%' }}
        >
          {/* Subtítulo superior */}
          <span 
            className="text-uppercase fw-semibold mb-4" 
            style={{ color: '#8c4230', fontSize: '11px', letterSpacing: '2.5px' }}
          >
            HECHO DESPACIO, DISFRUTADO SIN PRISA
          </span>

          {/* Título principal dividido en 4 líneas con d-block y lh-1 de Bootstrap */}
          <h1 
            className="display-2 fw-normal lh-1 mb-4 hero-title" 
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#362621', letterSpacing: '-1px' }}
          >
            <span className="d-block">Pequeños</span>
            <span className="d-block">placeres,</span>
            <em className="d-block fst-italic" style={{ color: '#9c4332' }}>grandes</em>
            <em className="d-block fst-italic" style={{ color: '#9c4332' }}>momentos.</em>
          </h1>

          {/* Párrafo descriptivo */}
          <p 
            className="text-muted mb-5 fs-6 fw-light" 
            style={{ maxWidth: '440px', lineHeight: '1.7' }}
          >
            Pastelería contemporánea elaborada a mano cada mañana, con ingredientes honestos y una pizca de imaginación.
          </p>

          {/* Botones de acción */}
          <div className="d-flex align-items-center gap-4 flex-wrap">
            <a 
              href="#catalogo" 
              className="btn btn-terracota px-4 py-3 rounded-0 text-uppercase fw-bold d-inline-flex align-items-center justify-content-between" 
              style={{ 
                backgroundColor: '#7b3f2e', 
                color: '#ffffff', 
                fontSize: '11px', 
                letterSpacing: '1.5px',
                minWidth: '210px'
              }}
            >
              <span>Ver la Colección</span>
              <span className="ms-3 fs-6 lh-1">→</span>
            </a>

            <a 
              href="#nosotros" 
              className="text-dark text-decoration-none small fw-medium pb-2 border-bottom border-dark"
            >
              Conoce nuestra historia
            </a>
          </div>
        </div>

        {/* Columna Derecha: Imagen grande estilo vitrina */}
        <div className="col-lg-6">
          <div 
            className="w-100 h-100 hero-image"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1000&q=80")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
        </div>

      </div>
    </div>
  );
}

export default Hero;