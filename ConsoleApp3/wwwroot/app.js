// ══════════════════════════════════════
//  1. CONFIGURAÇÃO DA CONEXÃO
// ══════════════════════════════════════
const API_URL = "http://localhost:5000/api";

let alunos = [];
let professores = [];
let turmas = [];
let listaMatriculas = [];
let currentRole = 'admin';
let coordenadores = [];
let listaCursos = [];

// ══════════════════════════════════════
//  2. COMUNICAÇÃO COM O C# (API)
// ══════════════════════════════════════

async function carregarDadosDoBanco() {
    try {
        // Buscamos os perfis nas rotas que criamos ontem
        const resAlunos = await fetch(`${API_URL}/Alunos`);
        if (resAlunos.ok) alunos = await resAlunos.json();

        const resProfessores = await fetch(`${API_URL}/Professores`);
        if (resProfessores.ok) professores = await resProfessores.json();

        const resCoordenadores = await fetch(`${API_URL}/Coordenadores`);
        if (resCoordenadores.ok) coordenadores = await resCoordenadores.json();

        // IMPORTANTE: Ajuste da rota para bater com o [HttpGet] do seu CursosController
        // Se no C# você não definiu um nome específico para o GET de listagem, use apenas /Cursos
        // Se usou [HttpGet("ListarTodos")], mude para `${API_URL}/Cursos/ListarTodos`
        const resCursos = await fetch(`${API_URL}/Cursos`);

        if (resCursos.ok) {
            listaCursos = await resCursos.json();

            // 2FN na prática: A Turma agora é uma "filha" de um Curso existente
            // Usamos o ID e o Título do curso para criar a visualização da turma
            turmas = listaCursos.map(c => ({
                id: c.id,
                nome: `Turma - ${c.titulo}`,
                periodo: 'Integral',
                cursoId: c.id // Referência vital para manter a normalização
            }));
        }

        atualizarInterface();
        console.log("Dados sincronizados com o banco de dados (2FN).");
    } catch (erro) {
        console.error("Falha na conexão com a API:", erro);
    }
}

// ══════════════════════════════════════
//  FUNÇÃO DE ATUALIZAÇÃO DA UI
// ══════════════════════════════════════

function atualizarInterface() {
    // Chamamos as funções que você já definiu para desenhar as tabelas
    renderAlunosTable();
    renderProfessoresTable();
    renderCoordenadoresTable();
    renderCursosTable();
    renderTurmasTable();

    // Atualiza o contador de alunos no Dashboard (opcional)
    const totalAlunosEl = document.getElementById('total-alunos');
    if (totalAlunosEl) totalAlunosEl.innerText = alunos.length;

    console.log("Interface atualizada com sucesso!");
}

// ══════════════════════════════════════
//  RENDERIZAÇÃO DAS NOVAS TABELAS
// ══════════════════════════════════════

function renderCoordenadoresTable() {
    const tbody = document.getElementById('coordenadores-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    coordenadores.forEach(coord => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${coord.id}</strong></td>
            <td>${coord.nome}</td>
            <td>${coord.email}</td>
            <td><span class="status-badge active">${coord.ativo ? 'Ativo' : 'Inativo'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCursosTable() {
    const tbody = document.getElementById('cursos-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    listaCursos.forEach(curso => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${curso.id}</strong></td>
            <td>${curso.titulo}</td>
            <td>R$ ${curso.preco.toFixed(2)}</td>
            <td><span class="status-badge active">Ativo</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTurmasTable() {
    const tbody = document.getElementById('turmas-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    turmas.forEach(turma => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${turma.id}</strong></td>
            <td>${turma.nome}</td>
            <td>Curso #${turma.cursoId}</td>
            <td>Prof. #${turma.professorId}</td>
        `;
        tbody.appendChild(tr);
    });
}

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
//  FUNÇÕES DE CADASTRO (POST)
// ══════════════════════════════════════

async function cadastrarCoordenador() {
    const nome = document.getElementById('coordenador-nome').value;
    const email = document.getElementById('coordenador-email').value;
    const cpfRaw = document.getElementById('coordenador-cpf').value;
    const cpfLimpo = cpfRaw.replace(/\D/g, '');

    const novoCoordenador = {
        Nome: nome,
        Email: email,
        Cpf: cpfLimpo,
        TipoUsuario: "Coordenador",
        Ativo: true,
        Telefone: "", Cep: "", Rua: "", Numero: "", Bairro: "", Cidade: "", Estado: ""
    };

    try {
        // Mudamos a rota aqui para /Coordenadores
        const resposta = await fetch(`${API_URL}/Coordenadores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoCoordenador)
        });

        if (resposta.ok) {
            alert("Coordenador registrado com sucesso!");
            document.getElementById('form-coordenador').reset();
            toggleForm('form-container-coordenador');
            carregarDadosDoBanco();
        } else {
            console.error("Erro do servidor:", await resposta.text());
            alert("Erro ao salvar coordenador. Verifique o console.");
        }
    } catch (e) {
        alert("Servidor C# offline ou erro de rede.");
    }
}

// ══════════════════════════════════════
//  CADASTRO DE ALUNOS
// ══════════════════════════════════════
async function cadastrarAluno() {
    // Captura os valores dos inputs (certifique-se que os IDs batem com seu HTML)
    const nome = document.getElementById('aluno-nome').value;
    const email = document.getElementById('aluno-email').value;
    const cpfRaw = document.getElementById('aluno-cpf').value || "";

    // Limpa o CPF para enviar apenas números ao C#
    const cpfLimpo = cpfRaw.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
        alert("O CPF precisa ter exatamente 11 números.");
        return;
    }

    const novoAluno = {
        Nome: nome,
        Email: email,
        Cpf: cpfLimpo,
        TipoUsuario: "Aluno",
        Ativo: true,
        Matricula: `MAT-${Math.floor(1000 + Math.random() * 9000)}`, // Gera uma matrícula simples
        // Campos complementares para evitar erro de validação no C#
        Telefone: "", Cep: "", Rua: "", Numero: "", Bairro: "", Cidade: "", Estado: ""
    };

    try {
        // Rota atualizada para a nova arquitetura do AlunosController
        const resposta = await fetch(`${API_URL}/Alunos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoAluno)
        });

        if (resposta.ok) {
            alert("Aluno registrado com sucesso!");

            // Limpa o formulário e fecha o painel
            const formAluno = document.getElementById('form-aluno');
            if (formAluno) formAluno.reset();

            if (typeof toggleForm === "function") {
                toggleForm('form-container-aluno');
            }

            // Recarrega a tabela para mostrar o novo aluno
            carregarDadosDoBanco();
        } else {
            const erroTexto = await resposta.text();
            console.error("Erro do servidor:", erroTexto);
            alert("Erro ao salvar aluno. Verifique o console.");
        }
    } catch (e) {
        console.error("Erro de rede:", e);
        alert("Servidor C# offline ou erro de conexão.");
    }
}

function preencherSelectCoordenadores() {
    const select = document.getElementById('curso-coordenador');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione um coordenador...</option>';
    coordenadores.forEach(coord => {
        const option = document.createElement('option');
        option.value = coord.id;
        option.textContent = coord.nome;
        select.appendChild(option);
    });
}

function preencherSelectsTurma() {
    const selectCurso = document.getElementById('turma-curso');
    const selectProfessor = document.getElementById('turma-professor');

    if (selectCurso) {
        selectCurso.innerHTML = '<option value="">Selecione um curso...</option>';
        listaCursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.id;
            option.textContent = curso.titulo;
            selectCurso.appendChild(option);
        });
    }

    if (selectProfessor) {
        selectProfessor.innerHTML = '<option value="">Selecione um professor...</option>';
        professores.forEach(prof => {
            const option = document.createElement('option');
            option.value = prof.id;
            option.textContent = `${prof.nome} (${prof.especialidade || 'Geral'})`;
            selectProfessor.appendChild(option);
        });
    }
}

async function cadastrarTurma() {
    const nomeTurma = document.getElementById('turma-nome').value;
    const cursoId = parseInt(document.getElementById('turma-curso').value);
    const professorId = parseInt(document.getElementById('turma-professor').value);

    // Validação: Garante que o utilizador escolheu opções válidas antes de enviar
    if (isNaN(cursoId) || isNaN(professorId)) {
        alert("Por favor, selecione um Curso e um Professor válidos nas listas.");
        return;
    }

    const novaTurma = {
        NomeTurma: nomeTurma,
        CursoId: cursoId,
        ProfessorId: professorId
    };

    try {
        const resposta = await fetch(`${API_URL}/Turmas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaTurma)
        });

        if (resposta.ok) {
            alert("Turma registrada com sucesso!");
            document.getElementById('form-turma').reset();
            toggleForm('form-container-turma');
            carregarDadosDoBanco();
        } else {
            console.error("Erro do servidor:", await resposta.text());
            alert("Erro ao salvar a turma. Verifique a consola (F12).");
        }
    } catch (e) {
        alert("Erro de conexão com o servidor da API.");
    }
}

async function cadastrarProfessor() {
    const nome = document.getElementById('professor-nome').value;
    const email = document.getElementById('professor-email').value;
    const especialidade = document.getElementById('professor-especialidade').value;

    let cpfRaw = document.getElementById('professor-cpf').value || "";
    const cpfLimpo = cpfRaw.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
        alert("O CPF precisa ter exatamente 11 números.");
        return;
    }

    const novoProfessor = {
        Nome: nome,
        Email: email,
        Cpf: cpfLimpo,
        TipoUsuario: "Professor",
        Ativo: true,
        Telefone: "",
        Cep: "",
        Rua: "",
        Numero: "",
        Bairro: "",
        Cidade: "",
        Estado:"",
        Especialidade: especialidade
    };

    try {
        // Mudamos a rota aqui para /Professores
        const resposta = await fetch(`${API_URL}/Professores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoProfessor)
        });

        if (resposta.ok) {
            alert("Professor registado com sucesso!");
            const formProfessor = document.getElementById('form-professor');
            if (formProfessor) formProfessor.reset();
            toggleForm('form-container-professor');
            carregarDadosDoBanco();
        } else {
            const erroJson = await resposta.text();
            console.error("Erro do servidor:", erroJson);
            alert("Erro ao salvar no banco. Abra o F12 para ver o detalhe do erro.");
        }
    } catch (e) {
        alert("Servidor C# offline ou erro de rede.");
    }
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

    const displayEl = document.getElementById('user-display-name');
    if (displayEl) displayEl.innerText = roles[currentRole] || 'Usuário';

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

function toggleForm(id) {
    const form = document.getElementById(id);
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function logout() {
    window.location.reload();
}

// ══════════════════════════════════════
//  5. LÓGICA DE MATRÍCULA E CADASTRO
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
        status: 1,
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
            carregarDadosDoBanco();
            const formMatricula = document.getElementById('form-matricula');
            if (formMatricula) formMatricula.reset();
        } else {
            alert("Erro ao salvar matrícula. Verifique se o aluno e turma existem.");
        }
    } catch (e) {
        alert("Erro de conexão com o servidor.");
    }
}

// ══════════════════════════════════════
//  FUNÇÃO TEMPORÁRIA PARA CRIAR O ADMIN
// ══════════════════════════════════════
async function criarPrimeiroAdmin() {
    const novoAdmin = {
        Nome: "Krigor Admin",
        Email: "admin@plataforma.com",
        Cpf: "00000000000",
        TipoUsuario: "Admin",
        Ativo: true,
        Telefone: "", Cep: "", Rua: "", Numero: "", Bairro: "", Cidade: "", Estado: ""
    };

    try {
        const resposta = await fetch(`${API_URL}/Usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoAdmin)
        });

        if (resposta.ok) {
            alert("Administrador Master criado com sucesso!");
            carregarDadosDoBanco();
        } else {
            console.error("Erro ao criar Admin:", await resposta.text());
            alert("Erro ao criar o Administrador. Verifique a consola.");
        }
    } catch (e) {
        alert("Erro de ligação à API.");
    }
}