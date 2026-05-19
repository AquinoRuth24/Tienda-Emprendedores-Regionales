const fetchConToken = async (url, options = {}) => {
const token = localStorage.getItem("token");
const res = await fetch(url, {
    ...options,
    headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
    },
});

//Si el token expiró, limpia y redirige al login
//retorna null explícitamente para que los componentes puedan manejar este caso
if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("cliente");
    window.location.href = "/login";
    return null;
}
return res;
};

export default fetchConToken;