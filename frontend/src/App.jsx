import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Catalogo from './components/Catalogo';
import SobreNosotros from './components/SobreNosotros';
import Footer from './components/Footer';
import Login from './components/login'; 
import './App.css';

function App() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);


  const [vistaActual, setVistaActual] = useState('home');

  useEffect(() => {
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

  return (
    <div className="w-100 overflow-hidden" style={{ backgroundColor: '#fbf8f3', minHeight: '100vh' }}>
      
  
      <Navbar onLoginClick={() => setVistaActual('login')} />

    
      {vistaActual === 'login' ? (
       
        <Login />
      ) : (
   
        <>
        
          <Hero />

     
          <div className="container-fluid px-4 px-lg-5">
            {cargando && <div className="text-center my-5"><div className="spinner-border text-dark" role="status"></div><p className="mt-2">Cargando vitrina...</p></div>}
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