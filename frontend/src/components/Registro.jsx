import React, { useState } from 'react';
import axios from 'axios';

function Registro({ cambiarALogin }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setCargando(true);

    try {
      await axios.post('http://localhost:3000/api/registro', {
        nombre,
        correo,
        contrasena,
        telefono,
        direccion
      });

      setCargando(false);
      setExito('¡Registro exitoso! Ya puedes iniciar sesión.');
      setTimeout(() => {
        if (cambiarALogin) cambiarALogin();
      }, 2000);

    } catch (err) {
      setCargando(false);
      setError(err.response?.data?.error || 'Ocurrió un error al registrarse.');
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card border-0 p-4 shadow-sm" style={{ backgroundColor: '#f5efe6' }}>
            
            <div className="text-center mb-4">
              <h3 className="fw-normal" style={{ fontFamily: 'Georgia, serif', color: '#3d2c29' }}>
                Crear una Cuenta
              </h3>
              <p className="text-muted small">Disfruta de la pastelería artesanal en casa</p>
            </div>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            {exito && <div className="alert alert-success py-2 small">{exito}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small text-muted">Nombre completo</label>
                <input 
                  type="text" 
                  className="form-control rounded-0 border-0 p-2 shadow-none" 
                  style={{ backgroundColor: '#fff' }}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required 
                />
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted">Correo electrónico</label>
                <input 
                  type="email" 
                  className="form-control rounded-0 border-0 p-2 shadow-none" 
                  style={{ backgroundColor: '#fff' }}
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required 
                />
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted">Contraseña</label>
                <input 
                  type="password" 
                  className="form-control rounded-0 border-0 p-2 shadow-none" 
                  style={{ backgroundColor: '#fff' }}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required 
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label small text-muted">Teléfono</label>
                  <input 
                    type="text" 
                    className="form-control rounded-0 border-0 p-2 shadow-none" 
                    style={{ backgroundColor: '#fff' }}
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label small text-muted">Dirección</label>
                  <input 
                    type="text" 
                    className="form-control rounded-0 border-0 p-2 shadow-none" 
                    style={{ backgroundColor: '#fff' }}
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-terracota w-100 py-2 rounded-0 text-uppercase fw-bold mt-2"
                style={{ fontSize: '13px', letterSpacing: '1px' }}
                disabled={cargando}
              >
                {cargando ? 'Registrando...' : 'Registrarse'}
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="small text-muted mb-0">
                ¿Ya tienes una cuenta?{' '}
                <button 
                  onClick={cambiarALogin} 
                  className="btn btn-link p-0 text-decoration-underline fw-bold small"
                  style={{ color: '#7b3f2e' }}
                >
                  Inicia sesión
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Registro;