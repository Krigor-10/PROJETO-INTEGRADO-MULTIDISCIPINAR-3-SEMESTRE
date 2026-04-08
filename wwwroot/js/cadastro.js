const API_URL = window.APP_CONFIG.API_URL;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-cadastro");
    if (form) {
        form.addEventListener("submit", cadastrarAluno);
    }

    carregarCursos();
});

async function carregarCursos() {
    const select = document.getElementById("curso");
    if (!select) return;

    try {
        const resposta = await fetch(`${API_URL}/Cursos`);
        const cursos = await resposta.json();

        select.innerHTML = `<option value="">Selecione um curso</option>`;

        cursos.forEach(curso => {
            select.innerHTML += `<option value="${curso.id}">${curso.nome}</option>`;
        });
    } catch (erro) {
        console.error("Erro ao carregar cursos:", erro);
    }
}

async function cadastrarAluno(event) {
    event.preventDefault();

    const mensagem = document.getElementById("cadastro-mensagem");

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const cpf = document.getElementById("cpf").value.replace(/\D/g, "");
    const telefone = document.getElementById("telefone").value.trim();
    const cursoId = document.getElementById("curso").value;
    const senha = document.getElementById("senha").value.trim();
    const confirmarSenha = document.getElementById("confirmar-senha").value.trim();

    mensagem.textContent = "";

    if (cpf.length !== 11) {
        mensagem.textContent = "CPF inválido.";
        return;
    }

    if (!nome || !email || !cpf || !telefone || !cursoId || !senha || !confirmarSenha) {
        mensagem.textContent = "Preencha todos os campos.";
        return;
    }

    if (senha.length < 6) {
        mensagem.textContent = "A senha deve ter pelo menos 6 caracteres.";
        return;
    }

    if (senha !== confirmarSenha) {
        mensagem.textContent = "As senhas não coincidem.";
        return;
    }

    const payload = {
        nome,
        email,
        cpf,
        telefone,
        cursoId: Number(cursoId),
        senha
    };

    try {
        const resposta = await fetch(`${API_URL}/Alunos/cadastro-completo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        let dados = {};

        try {
            dados = await resposta.json();
        } catch {
            dados = {};
        }

        if (!resposta.ok) {
            mensagem.textContent = dados.mensagem || "Erro ao cadastrar aluno.";
            return;
        }

        mensagem.textContent = "Cadastro realizado com sucesso!";
        mensagem.className = "sucesso";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        document.getElementById("form-cadastro").reset();
    } catch (erro) {
        console.error("Erro no cadastro:", erro);
        mensagem.textContent = "Erro de conexão com o servidor.";
    }
}