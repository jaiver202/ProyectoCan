import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Catalogo from './components/Catalogo';
import SobreNosotros from './components/SobreNosotros';
import Footer from './components/Footer';
import Login from './components/login'; 
import Registro from './components/Registro';
import Perfil from './components/Perfil';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [vistaActual, setVistaActual] = useState('home');
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      setUsuarioLogueado(JSON.parse(usuarioGuardado));
    }

    axios.get('http://localhost:3000/api/productos')
      .then(response => {
        setProductos(response.data);
        setCargando(false);
      })
      .catch(err => {
        console.error('Error al conectar con el backend:', err);
        setError('No se pudo conectar con el servidor de CandyKane');
        setCargando(false);
      });
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuarioLogueado(null);
    setVistaActual('home');
  };

  return (
    <div className="w-100 overflow-hidden" style={{ backgroundColor: '#fbf8f3', minHeight: '100vh' }}>
      
      {vistaActual === 'login' && (
        <Login 
          volverATienda={() => setVistaActual('home')} 
          cambiarARegistro={() => setVistaActual('registro')}
          alIniciarSesionExitoso={(usuario) => {
            setUsuarioLogueado(usuario);
            setVistaActual('home');
          }}
        />
      )}

      {vistaActual === 'registro' && (
        <Registro 
          volverATienda={() => setVistaActual('home')} 
          cambiarALogin={() => setVistaActual('login')}
        />
      )}

      {vistaActual === 'perfil' && (
        <Perfil 
          usuario={usuarioLogueado}
          productos={productos}
          volverATienda={() => setVistaActual('home')}
          cerrarSesion={cerrarSesion}
          alActualizarUsuario={(usuario) => {
            setUsuarioLogueado(usuario);
            localStorage.setItem('usuario', JSON.stringify(usuario));
          }}
        />
      )}

      {vistaActual === 'admin' && usuarioLogueado?.rol === 'admin' && (
        <AdminPanel
          usuario={usuarioLogueado}
          volverATienda={() => setVistaActual('home')}
          cerrarSesion={cerrarSesion}
          actualizarCatalogo={async () => {
            const response = await axios.get('http://localhost:3000/api/productos');
            setProductos(response.data);
          }}
        />
      )}

      {vistaActual === 'admin' && usuarioLogueado?.rol !== 'admin' && (
        <div className="container py-5 text-center">
          <div className="alert alert-danger">No tienes permisos para acceder al panel administrativo.</div>
          <button type="button" className="btn btn-terracota" onClick={() => setVistaActual('home')}>Volver a la tienda</button>
        </div>
      )}

      {vistaActual === 'home' && (
        <>
          <Navbar 
            onLoginClick={() => setVistaActual('login')} 
            cambiarVista={setVistaActual}
            usuarioLogueado={usuarioLogueado}
            cerrarSesion={cerrarSesion}
            irAlPerfil={() => setVistaActual('perfil')}
            irAlAdmin={() => setVistaActual('admin')}
          />

          <Hero />

          <div className="container-fluid px-4 px-lg-5">
            {cargando && (
              <div className="text-center my-5">
                <div className="spinner-border text-dark" role="status"></div>
                <p className="mt-2">Cargando vitrina...</p>
              </div>
            )}
            {error && <div className="alert alert-danger text-center m-4">{error}</div>}

            {!cargando && !error && <Catalogo productos={productos} />}
          </div>

          <SobreNosotros />

          <Footer />
        </>
      )}

    </div>
  );
}

export default App;