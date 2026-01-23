const isDev = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isDev ? "http://localhost:8000" : "https://projectc943-project943.hf.space");

export default API_BASE_URL;
