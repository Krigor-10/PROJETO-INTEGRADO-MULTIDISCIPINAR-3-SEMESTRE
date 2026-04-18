export function readSession() {
  try {
    const token = localStorage.getItem("token") || "";
    const storedUser = localStorage.getItem("usuarioLogado");
    const user = storedUser ? JSON.parse(storedUser) : null;

    return {
      token,
      user
    };
  } catch {
    return {
      token: "",
      user: null
    };
  }
}

export function persistSession(session) {
  localStorage.setItem("token", session.token);
  localStorage.setItem("usuarioLogado", JSON.stringify(session.user));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuarioLogado");
}
