// =============================
// INICIALIZAÇÃO
// =============================
document.addEventListener("DOMContentLoaded", iniciarApp);

function iniciarApp() {
    const usuario = obterUsuario();

    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    aplicarControleDeAcesso(usuario);
    atualizarUsuarioUI(usuario);
    carregarDashboard();
    configurarNavegacao();
}

// =============================
// AUTH
// =============================
function obterUsuario() {
    const raw = localStorage.getItem("usuarioLogado");
    return raw ? JSON.parse(raw) : null;
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
}

// =============================
// API
// =============================
const API_URL = "http://localhost:5000/api";

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });
}

// =============================
// CONTROLE DE ACESSO
// =============================
function aplicarControleDeAcesso(usuario) {
    const links = document.querySelectorAll("[data-roles]");

    links.forEach(link => {
        const roles = link.dataset.roles.split(",");

        if (!roles.includes(usuario.tipoUsuario)) {
            link.style.display = "none";
        }
    });
}

// =============================
// USUÁRIO NA UI
// =============================
function atualizarUsuarioUI(usuario) {
    const nome = document.getElementById("user-display-name");

    if (nome) {
        nome.textContent = usuario.nome;
    }
}

// =============================
// NAVEGAÇÃO (USA SUA ESTRUTURA)
// =============================
function configurarNavegacao() {
    const links = document.querySelectorAll('.nav-item[data-page]');
    const pages = document.querySelectorAll('.page');

    links.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();

            const pageName = this.dataset.page;

            // trocar páginas
            pages.forEach(p => p.classList.remove('active'));
            const page = document.getElementById(`page-${pageName}`);
            if (page) page.classList.add('active');

            // trocar menu ativo
            links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // carregar dados da tela
            carregarDadosDaTela(pageName);
        });
    });
}

// =============================
// DASHBOARD
// =============================
async function carregarDashboard() {
    try {
        const [alunos, cursos, matriculas] = await Promise.all([
            apiFetch("/Alunos"),
            apiFetch("/Cursos"),
            apiFetch("/Matriculas")
        ]);

        const listaAlunos = await alunos.json();
        const listaCursos = await cursos.json();
        const listaMatriculas = await matriculas.json();

        document.getElementById("total-alunos").textContent = listaAlunos.length;
        document.getElementById("total-cursos").textContent = listaCursos.length;

        const pendentes = listaMatriculas.filter(m => m.status === "Pendente");
        document.getElementById("total-pendentes").textContent = pendentes.length;

    } catch (erro) {
        console.error("Erro dashboard:", erro);
    }
}

// =============================
// CARREGAMENTO POR TELA
// =============================
function carregarDadosDaTela(tela) {
    switch (tela) {
        case "alunos":
            carregarAlunos();
            break;
        case "professores":
            carregarProfessores();
            break;
        case "cursos":
            carregarCursos();
            break;
        case "matriculas":
            carregarMatriculas();
            break;
    }
}

// =============================
// PREENCHER TABELAS
// =============================

async function carregarAlunos() {
    try {
        const res = await apiFetch("/Alunos");
        const alunos = await res.json();

        const tbody = document.getElementById("alunos-list");
        tbody.innerHTML = "";

        alunos.forEach(a => {
            tbody.innerHTML += `
                <tr>
                    <td>${a.id}</td>
                    <td>${a.nome}</td>
                    <td>${a.email}</td>
                    <td>${a.cpf}</td>
                    <td>${a.ativo ? "Ativo" : "Inativo"}</td>
                </tr>
            `;
        });

    } catch {
        console.error("Erro alunos");
    }
}

async function carregarProfessores() {
    try {
        const res = await apiFetch("/Professores");
        const lista = await res.json();

        const tbody = document.getElementById("professores-list");
        tbody.innerHTML = "";

        lista.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.registro}</td>
                    <td>${p.nome}</td>
                    <td>${p.email}</td>
                    <td>${p.especialidade || "-"}</td>
                </tr>
            `;
        });

    } catch {
        console.error("Erro professores");
    }
}

async function carregarCursos() {
    try {
        const res = await apiFetch("/Cursos");
        const lista = await res.json();

        const tbody = document.getElementById("cursos-list");
        tbody.innerHTML = "";

        lista.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.nome}</td>
                    <td>R$ ${c.preco || 0}</td>
                    <td>${c.coordenadorNome || "-"}</td>
                </tr>
            `;
        });

    } catch {
        console.error("Erro cursos");
    }
}

async function carregarMatriculas() {
    try {
        const res = await apiFetch("/Matriculas");
        const lista = await res.json();

        const tbody = document.getElementById("matriculas-list");
        tbody.innerHTML = "";

        lista.forEach(m => {
            tbody.innerHTML += `
                <tr>
                    <td>${m.id}</td>
                    <td>${m.alunoNome}</td>
                    <td>${m.cursoNome}</td>
                    <td>${m.turmaNome || "-"}</td>
                    <td>${m.status}</td>
                </tr>
            `;
        });

    } catch {
        console.error("Erro matrículas");
    }
}