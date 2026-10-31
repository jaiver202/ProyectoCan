import React from 'react';

function SobreNosotros() {
  return (
    <section id="nosotros" className="container-fluid px-0 my-5 py-5">
      <div className="row g-0 align-items-stretch" style={{ minHeight: '580px' }}>
        
        {/* Columna Izquierda: Imagen artesanal */}
        <div className="col-lg-6">
          <div 
            className="w-100 h-100"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=80")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '500px'
            }}
          ></div>
        </div>

        {/* Columna Derecha: Textos institucionales */}
        <div 
          className="col-lg-6 py-5 d-flex flex-column justify-content-center" 
          style={{ backgroundColor: '#f5f0e6', paddingLeft: '7%', paddingRight: '8%' }}
        >
          {/* Subtítulo superior */}
          <span 
            className="text-uppercase fw-semibold mb-4" 
            style={{ color: '#9c4332', fontSize: '11px', letterSpacing: '2.5px' }}
          >
            NUESTRO OBRADOR
          </span>

          {/* Título en 2 líneas usando d-block y lh-1 de Bootstrap */}
          <h2 
            className="display-3 fw-normal lh-1 mb-4" 
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#362621', letterSpacing: '-1px' }}
          >
            <span className="d-block">La belleza está en</span>
            <em className="d-block fst-italic" style={{ color: '#9c4332' }}>hacerlo bien.</em>
          </h2>

          {/* Primer párrafo: Tipografía Serif más grande como en la imagen */}
          <p 
            className="mb-4 fs-5 fw-normal" 
            style={{ 
              fontFamily: "'Playfair Display', Georgia, serif", 
              color: '#3d2c29', 
              lineHeight: '1.5',
              maxWidth: '500px'
            }}
          >
            Empezamos CandyKane con una idea sencilla: recuperar el tiempo, el oficio y el sabor de las cosas hechas con cariño.
          </p>

          {/* Segundo párrafo: Sans-serif más pequeño y ligero */}
          <p 
            className="text-muted mb-5 small fw-light" 
            style={{ lineHeight: '1.7', maxWidth: '500px' }}
          >
            Nuestro equipo prepara cada crema, bizcocho y masa desde cero. Sin conservantes, sin prisas y con productores que comparten nuestra forma de entender la calidad.
          </p>

          {/* Enlace inferior con línea extendida */}
          <div>
            <a 
              href="#catalogo" 
              className="text-dark text-decoration-none small fw-medium pb-2 border-bottom border-dark d-inline-flex align-items-center"
            >
              <span>Descubre quiénes somos</span>
              <span className="ms-3 fs-6 lh-1">→</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

export default SobreNosotros;