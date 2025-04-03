import React from 'react';
import ReactDOM from 'react-dom/client'; // Cambia esto a 'react-dom/client'
import './index.css';
import App from './App';
import 'leaflet/dist/leaflet.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement); // Crea la raíz del DOM
root.render( // Usamos 'render' en la instancia de root
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
