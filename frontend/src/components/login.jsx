import React, { useState } from 'react';
import axios from 'axios';

function Login({ volverATienda, cambiarARegistro, alIniciarSesionExitoso }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarPass, setMostrarPass] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const response = await axios.post('http://localhost:3000/api/login', {
        correo,
        contrasena
      });

      setCargando(false);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      alert(`¡Bienvenido de nuevo, ${response.data.usuario.nombre}!`);
      if (alIniciarSesionExitoso) alIniciarSesionExitoso(response.data.usuario);
    } catch (err) {
      setCargando(false);
      setError(err.response?.data?.error || 'Correo o contraseña incorrectos.');
    }
  };

  return (
    <div className="container-fluid p-0 min-vh-100">
      <div className="row g-0 min-vh-100">
        
        {/* COLUMNA IZQUIERDA */}
        <div 
          className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white position-relative"
          style={{
            backgroundImage: 'linear-gradient(to bottom, rgba(35, 22, 18, 0.45), rgba(35, 22, 18, 0.85)), url("https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div onClick={volverATienda} style={{ cursor: 'pointer' }} className="d-flex align-items-center gap-3">
            <div 
              className="rounded-circle border border-light d-flex align-items-center justify-content-center"
              style={{ width: '42px', height: '42px', fontFamily: 'Georgia, serif', fontSize: '18px' }}
            >
              C
            </div>
            <div>
              <h4 className="m-0 fw-normal text-white" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.5px' }}>
                CandyKane
              </h4>
              <span className="d-block text-uppercase" style={{ fontSize: '8px', letterSpacing: '2.5px', opacity: 0.85 }}>
                Pastelería Artesanal
              </span>
            </div>
          </div>

          <div className="my-auto pt-5" style={{ maxWidth: '460px' }}>
            <span className="text-uppercase d-block mb-3" style={{ fontSize: '10px', letterSpacing: '2.5px', color: '#e6ccb2' }}>
              TU RINCÓN MÁS DULCE
            </span>
            <h1 className="display-3 fw-normal mb-4 text-white" style={{ fontFamily: 'Georgia, serif', lineHeight: '1.1' }}>
              Bienvenida a<br />CandyKane.
            </h1>
            <p className="fw-light mb-0" style={{ fontSize: '15px', lineHeight: '1.6', color: '#f0e6dd' }}>
              Guarda tus favoritos, consulta tus encargos y disfruta de pequeños detalles creados para ti.
            </p>
          </div>

          <div>
            <span className="text-uppercase" style={{ fontSize: '9px', letterSpacing: '2px', opacity: 0.7 }}>
              HECHO A MANO CADA MAÑANA EN NUESTRO OBRADOR.
            </span>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="col-lg-6 d-flex flex-column justify-content-between p-4 p-md-5" style={{ backgroundColor: '#fbf8f3' }}>
          
          <div className="text-end">
            <button 
              type="button"
              onClick={volverATienda} 
              className="btn btn-link text-decoration-none p-2 text-uppercase"
              style={{ color: '#8c7a74', fontSize: '11px', letterSpacing: '1.5px', cursor: 'pointer' }}
            >
              ← VOLVER A LA PASTELERÍA
            </button>
          </div>

          <div className="mx-auto w-100 my-auto py-4" style={{ maxWidth: '440px' }}>
            <span className="text-uppercase fw-bold d-block mb-2" style={{ color: '#7b3f2e', fontSize: '10px', letterSpacing: '2px' }}>
              ÁREA PERSONAL
            </span>
            <h2 className="display-5 fw-normal mb-2" style={{ fontFamily: 'Georgia, serif', color: '#2b1d1a' }}>
              Qué alegría verte.
            </h2>
            <p className="text-muted small mb-4 pb-2">
              Inicia sesión para continuar donde lo dejaste.
            </p>

            {/* Pestañas: INICIAR SESIÓN | CREAR CUENTA */}
            <div className="d-flex mb-4">
              <button 
                type="button"
                className="w-50 bg-transparent border-0 text-uppercase fw-bold"
                style={{ 
                  fontSize: '11px', 
                  letterSpacing: '1.5px', 
                  color: '#2b1d1a', 
                  borderBottom: '2px solid #7b3f2e',
                  paddingBottom: '10px',
                  cursor: 'pointer'
                }}
              >
                INICIAR SESIÓN
              </button>
              <button 
                type="button"
                onClick={cambiarARegistro}
                className="w-50 bg-transparent border-0 text-uppercase"
                style={{ 
                  fontSize: '11px', 
                  letterSpacing: '1.5px', 
                  color: '#9e9089',
                  borderBottom: '1px solid #e2dad0',
                  paddingBottom: '11px',
                  cursor: 'pointer'
                }}
              >
                CREAR CUENTA
              </button>
            </div>

            {error && <div className="alert alert-danger py-2 small rounded-0 border-0">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="mb-4">
                <label className="form-label text-uppercase fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#5a4a44' }}>
                  CORREO ELECTRÓNICO
                </label>
                <input 
                  type="email" 
                  placeholder="tu@correo.com"
                  className="form-control bg-transparent border-0 border-bottom rounded-0 px-0 py-2 shadow-none" 
                  style={{ borderColor: '#d5cbbd', color: '#3d2c29', fontSize: '14px' }}
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required 
                />
              </div>

              <div className="mb-5">
                <label className="form-label text-uppercase fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#5a4a44' }}>
                  CONTRASEÑA
                </label>
                <div className="position-relative d-flex align-items-center border-bottom" style={{ borderColor: '#d5cbbd' }}>
                  <input 
                    type={mostrarPass ? 'text' : 'password'} 
                    placeholder="Mínimo 8 caracteres"
                    className="form-control bg-transparent border-0 rounded-0 px-0 py-2 shadow-none" 
                    style={{ color: '#3d2c29', fontSize: '14px' }}
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setMostrarPass(!mostrarPass)}
                    className="btn btn-link text-decoration-none p-0 text-uppercase fw-bold ms-2"
                    style={{ fontSize: '10px', letterSpacing: '1px', color: '#7b3f2e' }}
                  >
                    {mostrarPass ? 'OCULTAR' : 'VER'}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-terracota w-100 py-3 px-4 rounded-0 text-uppercase fw-bold d-flex justify-content-between align-items-center"
                style={{ fontSize: '11px', letterSpacing: '1.5px' }}
                disabled={cargando}
              >
                <span>{cargando ? 'ENTRANDO...' : 'ENTRAR EN MI CUENTA'}</span>
                <span>→</span>
              </button>
            </form>

            <div className="text-center mt-4 pt-2">
              <span className="small" style={{ color: '#9e9089', fontSize: '12px' }}>
                ¿Necesitas ayuda? <button type="button" onClick={volverATienda} className="btn btn-link p-0 text-decoration-underline small" style={{ color: '#7b3f2e', fontSize: '12px' }}>Escríbenos</button>
              </span>
            </div>
          </div>

          <div></div>
        </div>

      </div>
    </div>
  );
}

export default Login;