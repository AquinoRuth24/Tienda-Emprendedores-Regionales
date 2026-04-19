import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

//maneja el inicio de sesion del cliente,guarda el token y redirige a la pagina inicio
function Login() {
  const [email, setEmail] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault() //evita que la pagina se recarge
    setError('') //limpia errores anteriores

    try {
      //manda los datos del backend
      const res = await axios.post('http://localhost:3001/api/cliente/login', {
        email,
        contraseña
      })

      //guarda token en el navegador
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('cliente', JSON.stringify(res.data.cliente))

      //redirige a inicio
      navigate('/inicio')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    }
  }

  return (
    <div style={estilos.pagina}>
      <div style={estilos.tarjeta}>

        {/* Panel izquierdo - Formulario */}
        <div style={estilos.panelIzquierdo}>
          <h2 style={estilos.titulo}>Iniciar Sesión</h2>

          {error && <p style={estilos.error}>{error}</p>}

          <form onSubmit={handleSubmit} style={estilos.form}>
            <div style={estilos.campo}>
              <label style={estilos.label}>Correo electrónico</label>
              <input
                type="email"
                placeholder="juanPerez@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={estilos.input}
                required
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>Contraseña</label>
              <input
                type="password"
                placeholder="••••••"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                style={estilos.input}
                required
              />
            </div>
            {/* Link para recuperar contraseña 
            <p style={estilos.olvidaste}>
              ¿Olvidaste tu contraseña? <a href="#" style={estilos.linkRecuperar}>Recuperar</a>
            </p>
            */}
            <button type="submit" style={estilos.boton}>
              INICIAR SESIÓN
            </button>
          </form>
        </div>

        {/* Panel derecho */}
        <div style={estilos.panelDerecho}>
          <h2 style={estilos.saludo}>¡Hola!</h2>
          <p style={estilos.subSaludo}>¿No tienes cuenta?</p>
          <Link to="/registro">
            <button style={estilos.botonRegistro}>INSCRIBIRSE</button>
          </Link>
        </div>

      </div>
    </div>
  )
}

const estilos = {
  pagina: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#d6e8f7',
  },
  tarjeta: {
    display: 'flex',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    width: '750px',
    minHeight: '450px',
  },
  panelIzquierdo: {
    backgroundColor: '#eaf4fb',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '50px 40px',
  },
  titulo: {
    color: '#333',
    marginBottom: '30px',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    color: '#555',
    fontWeight: '500',
  },
  input: {
    border: '1px solid #cce0f0',
    borderRadius: '8px',
    padding: '12px 15px',
    fontSize: '14px',
    color: '#333',
    backgroundColor: 'white',
    outline: 'none',
    width: '100%',
  },
  olvidaste: {
    fontSize: '12px',
    color: '#888',
    textAlign: 'right',
  },
  linkRecuperar: {
    color: '#4ab8d8',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  boton: {
    backgroundColor: '#4ab8d8',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    padding: '13px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    marginTop: '10px',
    width: '100%',
  },
  error: {
    color: 'red',
    fontSize: '13px',
    marginBottom: '5px',
  },
  panelDerecho: {
    backgroundColor: '#4ab8d8',
    width: '250px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 25px',
    gap: '15px',
  },
  saludo: {
    color: 'white',
    fontSize: '30px',
    margin: 0,
  },
  subSaludo: {
    color: 'white',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
  },
  botonRegistro: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid white',
    borderRadius: '25px',
    padding: '10px 30px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '1px',
  }
}

export default Login