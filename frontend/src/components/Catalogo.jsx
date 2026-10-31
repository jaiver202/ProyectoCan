import React, { useState } from 'react';

function Catalogo({ productos }) {
  // Estado para la categoría seleccionada (por ahora mostramos todos)
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  return (
    <section id="catalogo" className="container my-5 py-4"
    style={{ backgroundColor: '#FBF8F3' }}>
      {/* Cabecera de la Vitrina */}
      <div className="row align-items-end mb-5">
        <div className="col-lg-8">
          <span className="text-uppercase fw-bold" style={{ color: '#7b3f2e', fontSize: '11px', letterSpacing: '2px' }}>
            NUESTROS FAVORITOS
          </span>
          <h2 className="display-5 fw-normal mt-2" style={{ fontFamily: 'Georgia, serif', color: '#141413' }}>
            La vitrina de hoy
          </h2>
        </div>
        <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
          <p className="text-muted small mb-0" style={{ maxWidth: '300px', marginLeft: 'auto', lineHeight: '1.5' }}>
            Cada semana cambia, siguiendo el ritmo de las estaciones y la inspiración de nuestro obrador.
          </p>
        </div>
      </div>

      {/* Pestañas de Filtro (Estilo minimalista) */}
      <div className="d-flex gap-4 border-bottom pb-2 mb-5 catalog-filters" style={{ borderColor: '#383128 !important' }}>
        {['Todos', 'Tartas', 'Individuales', 'Cajas'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            className="btn p-0 border-0 bg-transparent text-uppercase small fw-bold"
            style={{
              color: categoriaActiva === cat ? '#7b3f2e' : '#8c7a74',
              letterSpacing: '1px',
              borderBottom: categoriaActiva === cat ? '2px solid #7b3f2e' : 'none',
              borderRadius: '0',
              paddingBottom: '4px'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cuadrícula de Productos */}
      <div className="row g-4">
        {productos.map((producto) => (
          <div key={producto.id_producto} className="col-lg-3 col-md-6 col-sm-6">
            <div className="card h-100 border-0 bg-transparent position-relative">
              
              {/* Imagen del producto con diseño limpio */}
              <div className="position-relative overflow-hidden mb-3 catalog-product-image" style={{ backgroundColor: '#11100f' }}>
                <img 
                  src={producto.imagen || "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"} 
                  alt={producto.nombre}
                  className="w-100 h-100 object-fit-cover"
                />
                
                {/* Botón flotante "AÑADIR +" abajo a la derecha de la imagen */}
                <button 
                  onClick={() => alert(`Agregaste al carrito: ${producto.nombre}`)}
                  className="btn btn-light position-absolute bottom-0 end-0 m-3 rounded-0 px-3 py-2 shadow-sm fw-bold"
                  style={{ fontSize: '11px', letterSpacing: '1px', backgroundColor: '#fbf8f3', color: '#3d2c29', border: '1px solid #dcd2c5' }}
                >
                  AÑADIR +
                </button>
              </div>

              {/* Información del producto debajo de la imagen */}
              <div className="card-body px-0 pt-0 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <span className="text-uppercase text-muted" style={{ fontSize: '10px', letterSpacing: '1.5px' }}>
                    {producto.categoria || 'ARTESANAL'}
                  </span>
                  <span className="fw-bold" style={{ color: '#3d2c29', fontSize: '14px' }}>
                    ${Number(producto.precio).toLocaleString()}
                  </span>
                </div>
                <h5 className="fw-normal mb-1" style={{ fontFamily: 'Georgia, serif', color: '#3d2c29', fontSize: '17px' }}>
                  {producto.nombre}
                </h5>
                <p className="text-muted small mb-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  {producto.descripcion}
                </p>
              </div>

            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Catalogo;