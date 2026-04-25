import { useEffect, useMemo, useState } from "react";
import { DataTable, InlineMessage, PanelCard } from "../../components/Primitives.jsx";
import { ApiError, apiRequest } from "../../lib/api.js";
import { mapById } from "../../lib/dashboard.js";
import { formatCep, onlyDigits } from "../../lib/format.js";

const ESTADO_INICIAL_FORMULARIO_PROFESSOR = {
  nome: "",
  email: "",
  cpf: "",
  telefone: "",
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  especialidade: "",
  senha: "",
  confirmarSenha: ""
};

function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SecaoProfessores({ cursos = [], onRefresh, onSessionExpired, professores = [], turmas = [] }) {
  const [buscaProfessor, setBuscaProfessor] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("todos");
  const [formularioProfessorAberto, setFormularioProfessorAberto] = useState(false);
  const [professorCursosSelecionado, setProfessorCursosSelecionado] = useState(null);
  const [dadosFormularioProfessor, setDadosFormularioProfessor] = useState(ESTADO_INICIAL_FORMULARIO_PROFESSOR);
  const [mensagemFormularioProfessor, setMensagemFormularioProfessor] = useState({ tone: "", message: "" });
  const [mensagemTabelaProfessor, setMensagemTabelaProfessor] = useState({ tone: "", message: "" });
  const [salvandoProfessor, setSalvandoProfessor] = useState(false);
  const termoBusca = useMemo(() => normalizarBusca(buscaProfessor), [buscaProfessor]);
  const cursoPorId = useMemo(() => mapById(cursos), [cursos]);
  const cursosPorProfessor = useMemo(() => {
    const cursosMapeados = new Map();

    turmas.forEach((turma) => {
      const professorId = Number(turma.professorId);
      const cursoId = Number(turma.cursoId);

      if (!professorId || !cursoId) {
        return;
      }

      if (!cursosMapeados.has(professorId)) {
        cursosMapeados.set(professorId, new Set());
      }

      cursosMapeados.get(professorId).add(cursoId);
    });

    return cursosMapeados;
  }, [turmas]);
  const cursosComProfessores = useMemo(() => {
    const idsCursos = new Set(turmas.map((turma) => Number(turma.cursoId)).filter(Boolean));

    return [...idsCursos]
      .map((cursoId) => cursoPorId.get(cursoId) || { id: cursoId, titulo: `Curso #${cursoId}` })
      .sort((left, right) => left.titulo.localeCompare(right.titulo, "pt-BR"));
  }, [cursoPorId, turmas]);
  const professoresFiltrados = useMemo(() => {
    let proximosProfessores = professores;

    if (filtroCurso !== "todos") {
      const cursoId = Number(filtroCurso);
      proximosProfessores = proximosProfessores.filter((professor) =>
        cursosPorProfessor.get(Number(professor.id))?.has(cursoId)
      );
    }

    if (!termoBusca) {
      return proximosProfessores;
    }

    return proximosProfessores.filter((professor) => {
      const cursosDoProfessor = [...(cursosPorProfessor.get(Number(professor.id)) || [])];
      const nomesCursos = cursosDoProfessor.map((cursoId) => cursoPorId.get(cursoId)?.titulo || `Curso #${cursoId}`);
      const campos = [professor.nome, professor.email, String(cursosDoProfessor.length), ...nomesCursos];

      return campos.some((campo) => normalizarBusca(campo).includes(termoBusca));
    });
  }, [cursoPorId, cursosPorProfessor, filtroCurso, professores, termoBusca]);
  const temFiltroAtivo = Boolean(termoBusca || filtroCurso !== "todos");

  useEffect(() => {
    if (!formularioProfessorAberto && !professorCursosSelecionado) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key !== "Escape") {
        return;
      }

      if (professorCursosSelecionado) {
        fecharCursosProfessor();
        return;
      }

      if (!salvandoProfessor) {
        fecharFormularioProfessor();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [formularioProfessorAberto, professorCursosSelecionado, salvandoProfessor]);

  function limparFiltros() {
    setBuscaProfessor("");
    setFiltroCurso("todos");
  }

  function abrirFormularioProfessor() {
    setDadosFormularioProfessor(ESTADO_INICIAL_FORMULARIO_PROFESSOR);
    setMensagemFormularioProfessor({ tone: "", message: "" });
    setMensagemTabelaProfessor({ tone: "", message: "" });
    setFormularioProfessorAberto(true);
  }

  function fecharFormularioProfessor() {
    if (salvandoProfessor) {
      return;
    }

    setFormularioProfessorAberto(false);
    setMensagemFormularioProfessor({ tone: "", message: "" });
  }

  function fecharCursosProfessor() {
    setProfessorCursosSelecionado(null);
  }

  function obterCursosDoProfessor(professor) {
    const idsCursos = [...(cursosPorProfessor.get(Number(professor.id)) || [])];

    return idsCursos
      .map((cursoId) => cursoPorId.get(cursoId) || { id: cursoId, titulo: `Curso #${cursoId}` })
      .sort((left, right) => left.titulo.localeCompare(right.titulo, "pt-BR"));
  }

  function abrirCursosProfessor(professor) {
    const cursosDoProfessor = obterCursosDoProfessor(professor);

    if (cursosDoProfessor.length <= 1) {
      return;
    }

    setProfessorCursosSelecionado({
      professor,
      cursos: cursosDoProfessor
    });
  }

  function atualizarCampoFormularioProfessor(event) {
    const { name, value } = event.target;

    setDadosFormularioProfessor((current) => ({
      ...current,
      [name]: value
    }));
  }

  function validarFormularioProfessor() {
    const camposObrigatorios = [
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
      "especialidade",
      "senha",
      "confirmarSenha"
    ];
    const campoVazio = camposObrigatorios.find((campo) => !String(dadosFormularioProfessor[campo] || "").trim());

    if (campoVazio) {
      return "Preencha todos os campos para cadastrar o professor.";
    }

    if (onlyDigits(dadosFormularioProfessor.cpf).length !== 11) {
      return "Informe um CPF com 11 digitos.";
    }

    if (onlyDigits(dadosFormularioProfessor.cep).length !== 8) {
      return "Informe um CEP com 8 digitos.";
    }

    if (dadosFormularioProfessor.estado.trim().length !== 2) {
      return "Informe a UF com 2 letras.";
    }

    if (dadosFormularioProfessor.senha.length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (dadosFormularioProfessor.senha !== dadosFormularioProfessor.confirmarSenha) {
      return "As senhas nao coincidem.";
    }

    return "";
  }

  async function salvarProfessor(event) {
    event.preventDefault();

    const erroValidacao = validarFormularioProfessor();
    if (erroValidacao) {
      setMensagemFormularioProfessor({ tone: "error", message: erroValidacao });
      return;
    }

    setSalvandoProfessor(true);
    setMensagemFormularioProfessor({ tone: "", message: "" });

    try {
      await apiRequest("/Professores", {
        method: "POST",
        body: JSON.stringify({
          nome: dadosFormularioProfessor.nome.trim(),
          email: dadosFormularioProfessor.email.trim(),
          cpf: onlyDigits(dadosFormularioProfessor.cpf),
          telefone: dadosFormularioProfessor.telefone.trim(),
          cep: formatCep(onlyDigits(dadosFormularioProfessor.cep)),
          rua: dadosFormularioProfessor.rua.trim(),
          numero: dadosFormularioProfessor.numero.trim(),
          bairro: dadosFormularioProfessor.bairro.trim(),
          cidade: dadosFormularioProfessor.cidade.trim(),
          estado: dadosFormularioProfessor.estado.trim().toUpperCase(),
          especialidade: dadosFormularioProfessor.especialidade.trim(),
          senha: dadosFormularioProfessor.senha,
          ativo: true
        })
      });

      setDadosFormularioProfessor(ESTADO_INICIAL_FORMULARIO_PROFESSOR);
      setFormularioProfessorAberto(false);
      setMensagemTabelaProfessor({ tone: "success", message: "Professor cadastrado com sucesso." });
      onRefresh?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired?.();
        return;
      }

      setMensagemFormularioProfessor({
        tone: "error",
        message: err.message || "Nao foi possivel cadastrar o professor agora."
      });
    } finally {
      setSalvandoProfessor(false);
    }
  }

  function renderFormularioProfessor() {
    if (!formularioProfessorAberto) {
      return null;
    }

    return (
      <div
        className="content-form-modal"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            fecharFormularioProfessor();
          }
        }}
      >
        <div aria-label="Cadastrar professor" aria-modal="true" className="content-form-modal__card" role="dialog">
          <button
            className="content-form-modal__close"
            disabled={salvandoProfessor}
            onClick={fecharFormularioProfessor}
            type="button"
          >
            Fechar
          </button>

          <PanelCard
            description="Preencha os dados de acesso e identificacao do docente antes de vincula-lo as turmas."
            title="Cadastrar professor"
          >
            <form className="management-form" onSubmit={salvarProfessor}>
              <div className="management-form__grid">
                <label className="management-field management-field--wide">
                  <span>Nome</span>
                  <input
                    autoComplete="name"
                    disabled={salvandoProfessor}
                    maxLength={150}
                    name="nome"
                    onChange={atualizarCampoFormularioProfessor}
                    placeholder="Nome completo"
                    type="text"
                    value={dadosFormularioProfessor.nome}
                  />
                </label>

                <label className="management-field">
                  <span>E-mail</span>
                  <input
                    autoComplete="email"
                    disabled={salvandoProfessor}
                    name="email"
                    onChange={atualizarCampoFormularioProfessor}
                    placeholder="professor@exemplo.com"
                    type="email"
                    value={dadosFormularioProfessor.email}
                  />
                </label>

                <label className="management-field">
                  <span>CPF</span>
                  <input
                    autoComplete="off"
                    disabled={salvandoProfessor}
                    inputMode="numeric"
                    maxLength={14}
                    name="cpf"
                    onChange={atualizarCampoFormularioProfessor}
                    placeholder="Somente numeros"
                    type="text"
                    value={dadosFormularioProfessor.cpf}
                  />
                </label>

                <label className="management-field">
                  <span>Telefone</span>
                  <input
                    autoComplete="tel"
                    disabled={salvandoProfessor}
                    maxLength={20}
                    name="telefone"
                    onChange={atualizarCampoFormularioProfessor}
                    placeholder="(11) 99999-9999"
                    type="text"
                    value={dadosFormularioProfessor.telefone}
                  />
                </label>

                <label className="management-field">
                  <span>CEP</span>
                  <input
                    autoComplete="postal-code"
                    disabled={salvandoProfessor}
                    inputMode="numeric"
                    maxLength={9}
                    name="cep"
                    onChange={atualizarCampoFormularioProfessor}
                    placeholder="00000-000"
                    type="text"
                    value={dadosFormularioProfessor.cep}
                  />
                </label>

                <label className="management-field management-field--wide">
                  <span>Rua</span>
                  <input
                    autoComplete="address-line1"
                    disabled={salvandoProfessor}
                    maxLength={200}
                    name="rua"
                    onChange={atualizarCampoFormularioProfessor}
                    placeholder="Endereco"
                    type="text"
                    value={dadosFormularioProfessor.rua}
                  />
                </label>

                <label className="management-field">
                  <span>Numero</span>
                  <input
                    autoComplete="address-line2"
                    disabled={salvandoProfessor}
                    maxLength={20}
                    name="numero"
                    onChange={atualizarCampoFormularioProfessor}
                    type="text"
                    value={dadosFormularioProfessor.numero}
                  />
                </label>

                <label className="management-field">
                  <span>Bairro</span>
                  <input
                    autoComplete="address-level3"
                    disabled={salvandoProfessor}
                    maxLength={120}
                    name="bairro"
                    onChange={atualizarCampoFormularioProfessor}
                    type="text"
                    value={dadosFormularioProfessor.bairro}
                  />
                </label>

                <label className="management-field">
                  <span>Cidade</span>
                  <input
                    autoComplete="address-level2"
                    disabled={salvandoProfessor}
                    maxLength={120}
                    name="cidade"
                    onChange={atualizarCampoFormularioProfessor}
                    type="text"
                    value={dadosFormularioProfessor.cidade}
                  />
                </label>

                <label className="management-field">
                  <span>UF</span>
                  <input
                    autoComplete="address-level1"
                    disabled={salvandoProfessor}
                    maxLength={2}
                    name="estado"
                    onChange={atualizarCampoFormularioProfessor}
                    placeholder="SP"
                    type="text"
                    value={dadosFormularioProfessor.estado}
                  />
                </label>

                <label className="management-field management-field--wide">
                  <span>Especialidade</span>
                  <input
                    autoComplete="off"
                    disabled={salvandoProfessor}
                    maxLength={120}
                    name="especialidade"
                    onChange={atualizarCampoFormularioProfessor}
                    placeholder="Ex.: Engenharia de Software"
                    type="text"
                    value={dadosFormularioProfessor.especialidade}
                  />
                </label>

                <label className="management-field">
                  <span>Senha</span>
                  <input
                    autoComplete="new-password"
                    disabled={salvandoProfessor}
                    minLength={6}
                    name="senha"
                    onChange={atualizarCampoFormularioProfessor}
                    type="password"
                    value={dadosFormularioProfessor.senha}
                  />
                </label>

                <label className="management-field">
                  <span>Confirmar senha</span>
                  <input
                    autoComplete="new-password"
                    disabled={salvandoProfessor}
                    minLength={6}
                    name="confirmarSenha"
                    onChange={atualizarCampoFormularioProfessor}
                    type="password"
                    value={dadosFormularioProfessor.confirmarSenha}
                  />
                </label>
              </div>

              {mensagemFormularioProfessor.message ? (
                <InlineMessage tone={mensagemFormularioProfessor.tone}>{mensagemFormularioProfessor.message}</InlineMessage>
              ) : null}

              <div className="management-form__actions">
                <button className="solid-button professor-create-button" disabled={salvandoProfessor} type="submit">
                  {salvandoProfessor ? "Salvando..." : "Cadastrar professor"}
                </button>

                <button
                  className="button button--secondary exit-button"
                  disabled={salvandoProfessor}
                  onClick={fecharFormularioProfessor}
                  type="button"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </PanelCard>
        </div>
      </div>
    );
  }

  function renderCursosProfessor(professor) {
    const cursosDoProfessor = obterCursosDoProfessor(professor);

    if (!cursosDoProfessor.length) {
      return <span className="table-muted">Nenhum curso</span>;
    }

    return (
      <div className="course-preview-cell">
        <span className="course-preview-cell__name">{cursosDoProfessor[0].titulo}</span>
        {cursosDoProfessor.length > 1 ? (
          <button
            aria-label={`Ver todos os cursos de ${professor.nome}`}
            className="course-preview-cell__more"
            onClick={() => abrirCursosProfessor(professor)}
            title="Ver cursos"
            type="button"
          >
            +
          </button>
        ) : null}
      </div>
    );
  }

  function renderCursosProfessorPopup() {
    if (!professorCursosSelecionado) {
      return null;
    }

    return (
      <div
        className="content-form-modal"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            fecharCursosProfessor();
          }
        }}
      >
        <div
          aria-label={`Cursos em andamento de ${professorCursosSelecionado.professor.nome}`}
          aria-modal="true"
          className="content-form-modal__card content-form-modal__card--compact"
          role="dialog"
        >
          <button className="content-form-modal__close" onClick={fecharCursosProfessor} type="button">
            Fechar
          </button>

          <PanelCard
            description={professorCursosSelecionado.professor.nome}
            title="Cursos em andamento"
          >
            <ul className="professor-course-list">
              {professorCursosSelecionado.cursos.map((curso) => (
                <li key={curso.id}>{curso.titulo}</li>
              ))}
            </ul>
          </PanelCard>
        </div>
      </div>
    );
  }

  return (
    <PanelCard description="Corpo docente disponivel para composicao das turmas." title="Professores cadastrados">
      {renderFormularioProfessor()}
      {renderCursosProfessorPopup()}

      <div className="table-toolbar table-toolbar--filters">
        <div className="table-filter-group">
          <label className="table-search-control">
            <span aria-hidden="true" className="table-search-control__icon">
              <svg focusable="false" height="18" viewBox="0 0 24 24" width="18">
                <path
                  d="M10.8 5.2a5.6 5.6 0 1 0 0 11.2 5.6 5.6 0 0 0 0-11.2Zm-7.6 5.6a7.6 7.6 0 1 1 13.5 4.8l3.8 3.8a1 1 0 0 1-1.4 1.4l-3.8-3.8A7.6 7.6 0 0 1 3.2 10.8Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <input
              aria-label="Buscar professores"
              className="table-inline-input table-inline-input--search"
              onChange={(event) => setBuscaProfessor(event.target.value)}
              placeholder="Pesquisar professores"
              type="search"
              value={buscaProfessor}
            />
          </label>
          <select
            aria-label="Filtrar professores por curso"
            className="table-inline-select"
            onChange={(event) => setFiltroCurso(event.target.value)}
            value={filtroCurso}
          >
            <option value="todos">Todos os cursos</option>
            {cursosComProfessores.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.titulo}
              </option>
            ))}
          </select>
          <button className="table-action" disabled={!temFiltroAtivo} onClick={limparFiltros} type="button">
            Limpar filtros
          </button>
        </div>
        <div className="table-actions">
          <button
            className="solid-button professor-create-button"
            disabled={salvandoProfessor}
            onClick={abrirFormularioProfessor}
            type="button"
          >
            Cadastrar professor
          </button>
        </div>
        <p className="table-toolbar__summary">
          {professoresFiltrados.length} de {professores.length} professor{professores.length === 1 ? "" : "es"}
        </p>
      </div>

      {mensagemTabelaProfessor.message ? (
        <InlineMessage tone={mensagemTabelaProfessor.tone}>{mensagemTabelaProfessor.message}</InlineMessage>
      ) : null}

      <DataTable
        columns={[
          { key: "nome", label: "Nome" },
          { key: "email", label: "E-mail" },
          {
            key: "cursosEmAndamento",
            label: "Cursos em andamento",
            render: renderCursosProfessor
          }
        ]}
        emptyMessage="Nenhum professor encontrado."
        rows={professoresFiltrados}
      />
    </PanelCard>
  );
}
