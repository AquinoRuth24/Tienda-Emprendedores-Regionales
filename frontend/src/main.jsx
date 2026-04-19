import { StrictMode } from 'react' //ayuda a detectar errores en el desarrollo
import { createRoot } from 'react-dom/client' //dice donde mostrar la app en el html <div id="root"></div>
import { BrowserRouter } from 'react-router-dom' //permite la navegacion entre paginas 
import App from './App.jsx' //componente principal de la app contiene las rutas y estructura
import './index.css' //estilos globales de la app

createRoot(document.getElementById('root')).render(
  <StrictMode> 
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

//StrictMode:capa exterior, detecta errores
//BrowserRouter:capa del medio, maneja las rutas/navegación
//App:el núcleotu aplicación