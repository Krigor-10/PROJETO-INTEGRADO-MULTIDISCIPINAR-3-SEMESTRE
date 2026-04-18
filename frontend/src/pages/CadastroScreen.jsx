import { useEffect, useState } from "react";
import { InlineMessage } from "../components/Primitives.jsx";
import { SIGNUP_INITIAL_STATE } from "../data/appConfig.js";
import { formatCep, onlyDigits } from "../lib/format.js";
import { apiRequest } from "../lib/api.js";

export default function CadastroScreen({ isDemoMode, onNavigate }) {
  const [form, setForm] = useState(SIGNUP_INITIAL_STATE);
  const [cursos, setCursos] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("info");

  useEffect(() => {
    let ignore = false;

    async function loadCourses() {
      try {
        const response = await apiRequest("/Cursos");
        if (ignore) {
          return;
        }

        setCursos(response);
        setCatalogStatus("ready");
      } catch (err) {
        if (ignore) {
          return;
        }

        setCatalogStatus("error");
        setTone("error");
        setMessage(err.message || "Nao foi possivel carregar os cursos agora.");
      }
    }

    loadCourses();

    return () => {
      ignore = true;
    };
  }, []);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateSignup(form);

    if (validationError) {
      setTone("error");
      setMessage(validationError);
      return;
    }

    setStatus("pending");
    setTone("info");
    setMessage("Enviando sua solicitacao de matricula...");

    const cpfDigits = onlyDigits(form.cpf);
    const cepDigits = onlyDigits(form.cep);

    try {
      const response = await apiRequest("/Alunos/cadastro-completo", {
        method: "POST",
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim(),
          cpf: cpfDigits,
          telefone: form.telefone.trim(),
          cep: formatCep(cepDigits),
          rua: form.rua.trim(),
          numero: form.numero.trim(),
          bairro: form.bairro.trim(),
          cidade: form.cidade.trim(),
          estado: form.estado.trim().toUpperCase(),
          cursoId: Number(form.cursoId),
          senha: form.senha
        })
      });

      setStatus("success");
      setTone("success");
      setMessage(response.mensagem || "Cadastro enviado com sucesso.");

      window.setTimeout(() => {
        onNavigate("/login");
      }, 1400);
    } catch (err) {
      setStatus("idle");
      setTone("error");
      setMessage(err.message || "Nao foi possivel concluir o cadastro.");
    }
  }

  return (
    <div className="auth-shell auth-shell--wide">
      <div className="marketing-backdrop" />

      <main className="auth-stage">
        <section className="auth-card auth-card--wide">
          <header className="auth-card__header">
            <button className="back-link back-link--home" type="button" onClick={() => onNavigate("/")}>
              Voltar para a home
            </button>
            <span className="eyebrow">Cadastro do aluno</span>
            <h1>Solicitar matricula na EdTech</h1>
            <p>O formulario React envia o cadastro completo e ja cria a solicitacao de matricula na API.</p>
          </header>

          {isDemoMode ? (
            <InlineMessage tone="info">
              Modo apresentacao ativo: o envio do cadastro sera simulado localmente e depois voce pode entrar com o mesmo e-mail.
            </InlineMessage>
          ) : null}

          <form className="field-grid field-grid--wide" onSubmit={handleSubmit}>
            <label className="field field--full">
              <span>Nome completo</span>
              <input
                name="nome"
                type="text"
                value={form.nome}
                onChange={(event) => updateField("nome", event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>E-mail</span>
              <input
                autoComplete="email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>CPF</span>
              <input
                inputMode="numeric"
                name="cpf"
                type="text"
                value={form.cpf}
                onChange={(event) => updateField("cpf", event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Telefone</span>
              <input
                inputMode="tel"
                name="telefone"
                type="text"
                value={form.telefone}
                onChange={(event) => updateField("telefone", event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>CEP</span>
              <input
                inputMode="numeric"
                name="cep"
                type="text"
                value={form.cep}
                onChange={(event) => updateField("cep", event.target.value)}
                required
              />
            </label>

            <label className="field field--full">
              <span>Rua</span>
              <input
                name="rua"
                type="text"
                value={form.rua}
                onChange={(event) => updateField("rua", event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Numero</span>
              <input
                name="numero"
                type="text"
                value={form.numero}
                onChange={(event) => updateField("numero", event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Bairro</span>
              <input
                name="bairro"
                type="text"
                value={form.bairro}
                onChange={(event) => updateField("bairro", event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Cidade</span>
              <input
                name="cidade"
                type="text"
                value={form.cidade}
                onChange={(event) => updateField("cidade", event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Estado</span>
              <input
                maxLength={2}
                name="estado"
                type="text"
                value={form.estado}
                onChange={(event) => updateField("estado", event.target.value.toUpperCase())}
                required
              />
            </label>

            <label className="field field--full">
              <span>Curso desejado</span>
              <select
                name="cursoId"
                value={form.cursoId}
                onChange={(event) => updateField("cursoId", event.target.value)}
                required
              >
                <option value="">
                  {catalogStatus === "loading" ? "Carregando cursos..." : "Selecione um curso"}
                </option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.titulo}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Senha</span>
              <input
                autoComplete="new-password"
                minLength={6}
                name="senha"
                type="password"
                value={form.senha}
                onChange={(event) => updateField("senha", event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Confirmar senha</span>
              <input
                autoComplete="new-password"
                minLength={6}
                name="confirmarSenha"
                type="password"
                value={form.confirmarSenha}
                onChange={(event) => updateField("confirmarSenha", event.target.value)}
                required
              />
            </label>

            <div className="form-actions field--full">
              <button className="solid-button" disabled={status === "pending" || catalogStatus === "loading"} type="submit">
                {status === "pending" ? "Enviando..." : "Enviar solicitacao"}
              </button>

              <button className="ghost-button" type="button" onClick={() => onNavigate("/login")}>
                Ja tenho acesso
              </button>
            </div>
          </form>

          {message ? <InlineMessage tone={tone}>{message}</InlineMessage> : null}
        </section>
      </main>
    </div>
  );
}

function validateSignup(form) {
  const requiredFields = [
    "nome",
    "email",
    "cpf",
    "telefone",
    "cep",
    "rua",
    "numero",
    "bairro",
    "cidade",
    "estado",
    "cursoId",
    "senha",
    "confirmarSenha"
  ];

  const hasMissingField = requiredFields.some((field) => !String(form[field] || "").trim());

  if (hasMissingField) {
    return "Preencha todos os campos do cadastro.";
  }

  if (onlyDigits(form.cpf).length !== 11) {
    return "Informe um CPF com 11 digitos.";
  }

  if (onlyDigits(form.cep).length !== 8) {
    return "Informe um CEP com 8 digitos.";
  }

  if (form.estado.trim().length !== 2) {
    return "Use a sigla do estado com 2 letras.";
  }

  if (form.senha.length < 6) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  if (form.senha !== form.confirmarSenha) {
    return "As senhas nao coincidem.";
  }

  return "";
}
