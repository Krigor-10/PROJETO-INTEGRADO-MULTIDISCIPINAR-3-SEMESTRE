const API_URL = window.APP_CONFIG.API_URL;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-login");
    if (form) {
        form.addEventListener("submit", fazerLogin);
    }
});

async function fazerLogin(event) {
    event.preventDefault();

    const mensagem = document.getElementById("login-mensagem");
    const login = document.getElementById("login").value.trim();
    const senha = document.getElementById("senha").value.trim();

    mensagem.textContent = "";

    if (!login || !senha) {
        mensagem.textContent = "Informe e-mail/CPF e senha.";
        return;
    }

    try {
        const { resposta, dados } = await apiPost("/Auth/login", { login, senha });

        if (!resposta.ok) {
            mensagem.textContent = dados.mensagem || "Usuário ou senha incorretos.";
            return;
        }

        localStorage.setItem("token", dados.token);
        localStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));

        window.location.href = "app.html";

    } catch (erro) {
        console.error("Erro no login:", erro);
        mensagem.textContent = "Erro de conexão com o servidor.";
    }
}