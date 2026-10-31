import React, { useState } from 'react';
import axios from 'axios';

function Login({ alIniciarSesionExitoso, cambiarARegistro }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
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
      // Guardar el token en el almacenamiento local (localStorage)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      
      alert(`¡Bienvenido de nuevo, ${response.data.usuario.nombre}!`);
      if (alIniciarSesionExitoso) alIniciarSesionExitoso(response.data.usuario);

    } catch (err) {
      setCargando(false);
      setError(err.response?.data?.error || 'Ocurrió un error al iniciar sesión.');
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card border-0 p-4 shadow-sm" style={{ backgroundColor: '#f5efe6' }}>
            
            <div className="text-center mb-4">
              <h3 className="fw-normal" style={{ fontFamily: 'Georgia, serif', color: '#3d2c29' }}>
                Iniciar Sesión
              </h3>
              <p className="text-muted small">Accede a tu cuenta de CandyKane</p>
            </div>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small text-muted">Correo electrónico</label>
                <input 
                  type="email" 
                  className="form-control rounded-0 border-0 p-2 shadow-none" 
                  style={{ backgroundColor: '#fff', color: '#3d2c29' }}
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required 
                />
              </div>

              <div className="mb-4">
                <label className="form-label small text-muted">Contraseña</label>
                <input 
                  type="password" 
                  className="form-control rounded-0 border-0 p-2 shadow-none" 
                  style={{ backgroundColor: '#fff', color: '#3d2c29' }}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-terracota w-100 py-2 rounded-0 text-uppercase fw-bold"
                style={{ fontSize: '13px', letterSpacing: '1px' }}
                disabled={cargando}
              >
                {cargando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="small text-muted mb-0">
                ¿No tienes una cuenta?{' '}
                <button 
                  onClick={cambiarARegistro} 
                  className="btn btn-link p-0 text-decoration-underline fw-bold small"
                  style={{ color: '#7b3f2e' }}
                >
                  Regístrate aquí
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;