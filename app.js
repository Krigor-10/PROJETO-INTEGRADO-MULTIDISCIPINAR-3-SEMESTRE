// ══════════════════════════════════════
//  1. CONFIGURAÇÃO DA CONEXÃO
// ══════════════════════════════════════
// AJUSTE A PORTA ABAIXO DE ACORDO COM O SEU VISUAL STUDIO
const API_URL = "http://localhost:5000/api";

let alunos = [];
let professores = [];
let turmas = [];
let listaMatriculas = [];
let currentRole = 'admin';

// ══════════════════════════════════════
//  2. COMUNICAÇÃO COM O C# (API)
// ══════════════════════════════════════

async function carregarDadosDoBanco() {
    try {
        // Busca Usuários (Alunos e Professores)
        const resUsuarios = await fetch(`${API_URL}/Usuarios`);
        if (!resUsuarios.ok) throw new Error("Erro ao buscar usuários");
        const todosUsuarios = await resUsuarios.json();

        // No seu C#, o EF usa o Discriminator. Aqui separamos por lógica:
        alunos = todosUsuarios.filter(u => u.tipoUsuario === "Aluno" || u.matricula);
        professores = todosUsuarios.filter(u => u.tipoUsuario === "Professor");

        // Busca Cursos (que usaremos como base para as turmas no mock por enquanto)
        const resCursos = await fetch(`${API_URL}/Cursos`);
        const cursosBanco = await resCursos.json();

        // Se sua API de turmas ainda não estiver pronta, usamos os cursos como exemplo
        turmas = cursosBanco.map(c => ({ id: c.id, nome: c.titulo, periodo: 'Integral' }));

        atualizarInterface();
    } catch (erro) {
        console.error("Falha na conexão com a API:", erro);
        alert("Aviso: Não foi possível carregar dados do servidor C#. Verifique se a API está rodando e o CORS está ativo.");
    }
}

function atualizarInterface() {
    document.getElementById('total-alunos').innerText = alunos.length;
    renderAlunosTable();
    renderProfessoresTable();
    renderSelectsMatricula();
}

// ══════════════════════════════════════
//  3. CONTROLE DE LOGIN E NAVEGAÇÃO
// ══════════════════════════════════════

function selectRole(el) {
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
    currentRole = el.dataset.role;
}

function doLogin() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';

    const roles = {
        'admin': 'Administrador',
        'coordenador': 'Coordenador(a)',
        'professor': 'Professor(a)',
        'aluno': 'Aluno(a)'
    };
    document.getElementById('user-display-name').innerText = roles[currentRole] || 'Usuário';

    // Carrega os dados reais assim que logar
    carregarDadosDoBanco();
}

function showPage(pageId, el = null) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) targetPage.classList.add('active');

    if (el) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        el.classList.add('active');
    }
}

// ══════════════════════════════════════
//  4. RENDERIZAÇÃO DE TABELAS
// ══════════════════════════════════════

function renderAlunosTable() {
    const tbody = document.getElementById('alunos-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    alunos.forEach(aluno => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${aluno.id}</strong></td>
            <td>${aluno.nome}</td>
            <td>${aluno.email}</td>
            <td>${aluno.cidade || '---'}</td>
            <td><span class="status-badge active">${aluno.ativo ? 'Ativo' : 'Inativo'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderProfessoresTable() {
    const tbody = document.getElementById('professores-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    professores.forEach(prof => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${prof.id}</strong></td>
            <td>${prof.nome}</td>
            <td>${prof.email}</td>
            <td><span class="status-badge spec">${prof.estado || 'Docente'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// ══════════════════════════════════════
//  5. LÓGICA DE MATRÍCULA (POST PARA API)
// ══════════════════════════════════════

function renderSelectsMatricula() {
    const selAluno = document.getElementById('sel-aluno');
    const selTurma = document.getElementById('sel-turma');

    if (selAluno) {
        selAluno.innerHTML = '<option value="">-- Escolha um Aluno --</option>' +
            alunos.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
    }

    if (selTurma) {
        selTurma.innerHTML = '<option value="">-- Escolha uma Turma --</option>' +
            turmas.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');
    }
}

async function efetuarMatricula() {
    const alunoId = parseInt(document.getElementById('sel-aluno').value);
    const turmaId = parseInt(document.getElementById('sel-turma').value);

    if (!alunoId || !turmaId) return alert("Selecione aluno e turma!");

    const novaMatricula = {
        alunoId: alunoId,
        turmaId: turmaId,
        status: 1, // Ativa
        dataSolicitacao: new Date().toISOString()
    };

    try {
        const resposta = await fetch(`${API_URL}/Matriculas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaMatricula)
        });

        if (resposta.ok) {
            alert("Matrícula realizada com sucesso no banco de dados!");
            carregarDadosDoBanco(); // Recarrega para mostrar na lista
            document.getElementById('form-matricula').reset();
        } else {
            alert("Erro ao salvar matrícula. Verifique se o aluno e turma existem.");
        }
    } catch (e) {
        alert("Erro de conexão com o servidor.");
    }
}

function logout() { window.location.reload(); }

// Função para mostrar/esconder o formulário
function toggleForm(id) {
    const form = document.getElementById(id);
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// Função para enviar o Aluno para o SQL Server via API
async function cadastrarAluno() {
    const nome = document.getElementById('aluno-nome').value;
    const email = document.getElementById('aluno-email').value;
    const cpf = document.getElementById('aluno-cpf').value;

    const novoAluno = {
        nome: nome,
        email: email,
        cpf: cpf,
        tipoUsuario: "Aluno", // Importante para o seu C# saber que é um Aluno
        ativo: true
    };

    try {
        const resposta = await fetch(`${API_URL}/Usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoAluno)
        });

        if (resposta.ok) {
            alert("Aluno registrado com sucesso!");
            document.getElementById('form-aluno').reset();
            toggleForm('form-container-aluno');

            // Recarrega a tabela chamando a função que já criamos
            carregarDadosDoBanco();
        } else {
            alert("Erro ao salvar no banco de dados.");
        }
    } catch (e) {
        alert("Servidor C# offline ou erro de rede.");
    }
}