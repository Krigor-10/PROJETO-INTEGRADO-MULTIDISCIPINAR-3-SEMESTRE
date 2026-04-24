import { useEffect, useMemo, useState } from "react";
import { DataTable, InlineMessage, PanelCard } from "../../components/Primitives.jsx";
import { ApiError, apiRequest } from "../../lib/api.js";
import { normalizeStatus } from "../../lib/format.js";

function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SecaoTurmas({
  cursoEmFoco,
  ehGestor,
  ehProfessor,
  matriculas = [],
  turmas,
  cursoPorId,
  onCursoEmFocoAplicado,
  professores = [],
  professorPorId,
  onRefresh,
  onSessionExpired
}) {
  const [turmasSelecionadas, setTurmasSelecionadas] = useState(() => new Set());
  const [buscaTurma, setBuscaTurma] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("todos");
  const [filtroProfessor, setFiltroProfessor] = useState("todos");
  const [formularioCriacaoAberto, setFormularioCriacaoAberto] = useState(false);
  const [dadosFormularioTurma, setDadosFormularioTurma] = useState({
    nomeTurma: "",
    cursoId: "",
    professorId: ""
  });
  const [mensagemFormularioTurma, setMensagemFormularioTurma] = useState({ tone: "info", message: "" });
  const [professorSelecionado, setProfessorSelecionado] = useState("");
  const [mensagem, setMensagem] = useState({ tone: "info", message: "" });
  const [salvando, setSalvando] = useState(false);
  const [salvandoCriacao, setSalvandoCriacao] = useState(false);
  const podeGerenciarTurmas = Boolean(ehGestor && !ehProfessor);
  const podeAtribuirProfessor = podeGerenciarTurmas;
  const termoBusca = useMemo(() => normalizarBusca(buscaTurma), [buscaTurma]);
  const cursoEmFocoId = Number(cursoEmFoco?.cursoId || 0);
  const cursosOrdenados = useMemo(
    () => [...cursoPorId.values()].sort((left, right) => String(left.titulo || "").localeCompare(String(right.titulo || ""), "pt-BR")),
    [cursoPorId]
  );
  const cursoFiltrado = useMemo(
    () => (filtroCurso === "todos" ? null : cursoPorId.get(Number(filtroCurso)) || null),
    [cursoPorId, filtroCurso]
  );
  const professoresOrdenados = useMemo(
    () => [...professores].sort((left, right) => String(left.nome || "").localeCompare(String(right.nome || ""), "pt-BR")),
    [professores]
  );
  const cursosDasTurmas = useMemo(() => {
    const cursosPorId = new Map();

    turmas.forEach((turma) => {
      const curso = cursoPorId.get(turma.cursoId);
      cursosPorId.set(turma.cursoId, {
        id: turma.cursoId,
        titulo: curso?.titulo || `Curso #${turma.cursoId}`
      });
    });

    return [...cursosPorId.values()].sort((left, right) => left.titulo.localeCompare(right.titulo, "pt-BR"));
  }, [cursoPorId, turmas]);
  const professoresDasTurmas = useMemo(() => {
    const professores = new Map();

    professoresOrdenados.forEach((professor) => {
      professores.set(professor.id, {
        id: professor.id,
        nome: professor.nome || `Professor #${professor.id}`
      });
    });

    return [...professores.values()].sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));
  }, [professoresOrdenados]);
  const quantidadeAlunosPorTurma = useMemo(() => {
    const alunosPorTurma = new Map();

    matriculas.forEach((matricula) => {
      const turmaId = Number(matricula.turmaId);
      const alunoId = Number(matricula.alunoId);

      if (!turmaId || !alunoId || normalizeStatus(matricula.status) !== "Aprovada") {
        return;
      }

      if (!alunosPorTurma.has(turmaId)) {
        alunosPorTurma.set(turmaId, new Set());
      }

      alunosPorTurma.get(turmaId).add(alunoId);
    });

    return new Map([...alunosPorTurma.entries()].map(([turmaId, alunos]) => [turmaId, alunos.size]));
  }, [matriculas]);
  const turmasFiltradas = useMemo(() => {
    let proximasTurmas = turmas;

    if (filtroCurso !== "todos") {
      const cursoId = Number(filtroCurso);
      proximasTurmas = proximasTurmas.filter((turma) => Number(turma.cursoId) === cursoId);
    }

    if (filtroProfessor === "sem-professor") {
      proximasTurmas = proximasTurmas.filter((turma) => !turma.professorId);
    } else if (filtroProfessor !== "todos") {
      const professorId = Number(filtroProfessor);
      proximasTurmas = proximasTurmas.filter((turma) => Number(turma.professorId) === professorId);
    }

    if (!termoBusca) {
      return proximasTurmas;
    }

    return proximasTurmas.filter((turma) => {
      const curso = cursoPorId.get(turma.cursoId);
      const professor = turma.professorId ? professorPorId.get(turma.professorId) : null;
      const nomeCurso = curso?.titulo || `Curso #${turma.cursoId}`;
      const nomeProfessor = professor?.nome || (turma.professorId ? `Professor #${turma.professorId}` : "Nao definido");
      const totalAlunos = quantidadeAlunosPorTurma.get(turma.id) || 0;
      const campos = [turma.nomeTurma, nomeCurso, nomeProfessor, String(totalAlunos)];

      return campos.some((campo) => normalizarBusca(campo).includes(termoBusca));
    });
  }, [cursoPorId, filtroCurso, filtroProfessor, professorPorId, quantidadeAlunosPorTurma, termoBusca, turmas]);
  const idsTurmasVisiveis = useMemo(() => new Set(turmasFiltradas.map((turma) => turma.id)), [turmasFiltradas]);
  const turmasMarcadas = useMemo(
    () => turmasFiltradas.filter((turma) => turmasSelecionadas.has(turma.id)),
    [turmasFiltradas, turmasSelecionadas]
  );
  const todasTurmasSelecionadas =
    turmasFiltradas.length > 0 && turmasFiltradas.every((turma) => turmasSelecionadas.has(turma.id));
  const quantidadeSelecionada = turmasMarcadas.length;
  const temFiltroAtivo = Boolean(termoBusca || filtroCurso !== "todos" || filtroProfessor !== "todos");

  useEffect(() => {
    setTurmasSelecionadas((atuais) => {
      const proximas = new Set([...atuais].filter((id) => idsTurmasVisiveis.has(id)));
      return proximas.size === atuais.size ? atuais : proximas;
    });
  }, [idsTurmasVisiveis]);

  useEffect(() => {
    if (!cursoEmFocoId) {
      return;
    }

    setBuscaTurma("");
    setFiltroCurso(String(cursoEmFocoId));
    setDadosFormularioTurma((atuais) => ({
      ...atuais,
      cursoId: atuais.cursoId || String(cursoEmFocoId)
    }));
    onCursoEmFocoAplicado?.();
  }, [cursoEmFocoId, onCursoEmFocoAplicado]);

  useEffect(() => {
    if (!formularioCriacaoAberto) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !salvandoCriacao) {
        fecharFormularioCriacao();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [formularioCriacaoAberto, salvandoCriacao]);

  function limparFiltros() {
    setBuscaTurma("");
    setFiltroCurso("todos");
    setFiltroProfessor("todos");
  }

  function abrirFormularioCriacao() {
    setMensagem({ tone: "info", message: "" });
    setMensagemFormularioTurma({ tone: "info", message: "" });
    setDadosFormularioTurma({
      nomeTurma: "",
      cursoId: filtroCurso !== "todos" ? filtroCurso : "",
      professorId: ""
    });
    setFormularioCriacaoAberto(true);
  }

  function fecharFormularioCriacao() {
    if (salvandoCriacao) {
      return;
    }

    setFormularioCriacaoAberto(false);
    setMensagemFormularioTurma({ tone: "info", message: "" });
    setDadosFormularioTurma({
      nomeTurma: "",
      cursoId: "",
      professorId: ""
    });
  }

  function atualizarCampoFormularioTurma(event) {
    const { name, value } = event.target;
    setDadosFormularioTurma((atuais) => ({
      ...atuais,
      [name]: value
    }));
  }

  function alternarTurma(turma) {
    if (!podeAtribuirProfessor || salvando) {
      return;
    }

    setTurmasSelecionadas((atuais) => {
      const proximas = new Set(atuais);

      if (proximas.has(turma.id)) {
        proximas.delete(turma.id);
      } else {
        proximas.add(turma.id);
      }

      return proximas;
    });
  }

  function alternarTodasTurmas() {
    if (!podeAtribuirProfessor || salvando || !turmasFiltradas.length) {
      return;
    }

    setTurmasSelecionadas((atuais) => {
      if (todasTurmasSelecionadas) {
        return new Set();
      }

      const proximas = new Set(atuais);
      turmasFiltradas.forEach((turma) => proximas.add(turma.id));
      return proximas;
    });
  }

  async function atribuirProfessor() {
    const professorId = Number(professorSelecionado);

    if (!quantidadeSelecionada) {
      setMensagem({ tone: "error", message: "Selecione ao menos uma turma para atribuir professor." });
      return;
    }

    if (!professorId) {
      setMensagem({ tone: "error", message: "Selecione um professor para atribuir as turmas." });
      return;
    }

    try {
      setMensagem({ tone: "info", message: "" });
      setSalvando(true);

      for (const turma of turmasMarcadas) {
        await apiRequest(`/Turmas/${turma.id}/professor`, {
          method: "PUT",
          body: JSON.stringify(professorId)
        });
      }

      const professor = professorPorId.get(professorId);
      setMensagem({
        tone: "success",
        message: `${quantidadeSelecionada} turma${quantidadeSelecionada > 1 ? "s vinculadas" : " vinculada"} a ${
          professor?.nome || `Professor #${professorId}`
        }.`
      });
      setTurmasSelecionadas(new Set());
      setProfessorSelecionado("");
      onRefresh?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired?.();
        return;
      }

      setMensagem({ tone: "error", message: err.message || "Nao foi possivel atribuir professor agora." });
      onRefresh?.();
    } finally {
      setSalvando(false);
    }
  }

  async function salvarTurma(event) {
    event.preventDefault();

    const nomeTurma = String(dadosFormularioTurma.nomeTurma || "").trim();
    const cursoId = Number(dadosFormularioTurma.cursoId);
    const professorId = Number(dadosFormularioTurma.professorId);

    if (!nomeTurma) {
      setMensagemFormularioTurma({ tone: "error", message: "Informe um nome para a turma." });
      return;
    }

    if (!cursoId) {
      setMensagemFormularioTurma({ tone: "error", message: "Selecione o curso da nova turma." });
      return;
    }

    if (!professorId) {
      setMensagemFormularioTurma({ tone: "error", message: "Selecione o professor responsavel pela turma." });
      return;
    }

    try {
      setMensagemFormularioTurma({ tone: "info", message: "" });
      setSalvandoCriacao(true);

      await apiRequest("/Turmas", {
        method: "POST",
        body: JSON.stringify({
          nomeTurma,
          cursoId,
          professorId
        })
      });

      const curso = cursoPorId.get(cursoId);
      const professor = professorPorId.get(professorId);

      setFormularioCriacaoAberto(false);
      setDadosFormularioTurma({
        nomeTurma: "",
        cursoId: "",
        professorId: ""
      });
      setMensagem({
        tone: "success",
        message: `Turma "${nomeTurma}" criada com sucesso para ${curso?.titulo || `Curso #${cursoId}`} com ${
          professor?.nome || `Professor #${professorId}`
        }.`
      });
      onRefresh?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired?.();
        return;
      }

      setMensagemFormularioTurma({
        tone: "error",
        message: err.message || "Nao foi possivel criar a turma agora."
      });
    } finally {
      setSalvandoCriacao(false);
    }
  }

  function renderSelecao(turma) {
    return (
      <label className="table-select-cell">
        <input
          aria-label={`Selecionar turma ${turma.nomeTurma}`}
          checked={turmasSelecionadas.has(turma.id)}
          className="table-select-input"
          disabled={!podeAtribuirProfessor || salvando}
          onChange={() => alternarTurma(turma)}
          type="checkbox"
        />
      </label>
    );
  }

  function renderBarraAtribuicao() {
    if (!podeAtribuirProfessor) {
      return null;
    }

    return (
      <div className="table-toolbar table-toolbar--assignment">
        <div className="table-actions table-actions--bulk">
          <label className="table-bulk-toggle">
            <input
              checked={todasTurmasSelecionadas}
              className="table-select-input"
              disabled={salvando || !turmasFiltradas.length}
              onChange={alternarTodasTurmas}
              type="checkbox"
            />
            <span>Selecionar turmas</span>
          </label>
          <select
            aria-label="Professor para atribuir as turmas"
            className="table-inline-select table-inline-select--bulk"
            disabled={salvando || !professoresOrdenados.length}
            onChange={(event) => setProfessorSelecionado(event.target.value)}
            value={professorSelecionado}
          >
            <option value="">Selecionar professor</option>
            {professoresOrdenados.map((professor) => (
              <option key={professor.id} value={professor.id}>
                {professor.nome}
              </option>
            ))}
          </select>
          <button className="table-action" disabled={salvando} onClick={atribuirProfessor} type="button">
            {salvando ? "Salvando..." : "Atribuir professor"}
          </button>
        </div>
        <p className="table-toolbar__summary">
          {quantidadeSelecionada
            ? `${quantidadeSelecionada} turma${quantidadeSelecionada > 1 ? "s selecionadas" : " selecionada"}`
            : `${turmasFiltradas.length} de ${turmas.length} turma${turmas.length === 1 ? "" : "s"}`}
        </p>
      </div>
    );
  }

  function renderFormularioCriacaoTurma() {
    if (!podeGerenciarTurmas || !formularioCriacaoAberto) {
      return null;
    }

    return (
      <div
        className="content-form-modal"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            fecharFormularioCriacao();
          }
        }}
      >
        <div aria-label="Criar nova turma" aria-modal="true" className="content-form-modal__card" role="dialog">
          <button
            className="content-form-modal__close"
            disabled={salvandoCriacao}
            onClick={fecharFormularioCriacao}
            type="button"
          >
            Fechar
          </button>

          <PanelCard
            description="Defina o nome da turma, selecione o curso e atribua o professor responsavel antes de salvar."
            title="Criar turma"
          >
            {!cursosOrdenados.length ? (
              <InlineMessage tone="info">Cadastre ao menos um curso antes de criar novas turmas.</InlineMessage>
            ) : !professoresOrdenados.length ? (
              <InlineMessage tone="info">Cadastre ao menos um professor antes de criar novas turmas.</InlineMessage>
            ) : (
              <form className="management-form" onSubmit={salvarTurma}>
                <div className="management-form__grid">
                  <label className="management-field management-field--wide">
                    <span>Nome da turma</span>
                    <input
                      autoComplete="off"
                      disabled={salvandoCriacao}
                      maxLength={120}
                      name="nomeTurma"
                      onChange={atualizarCampoFormularioTurma}
                      placeholder="Ex.: Programacao Aplicada - Turma B"
                      type="text"
                      value={dadosFormularioTurma.nomeTurma}
                    />
                  </label>

                  <label className="management-field">
                    <span>Curso</span>
                    <select
                      disabled={salvandoCriacao || !cursosOrdenados.length}
                      name="cursoId"
                      onChange={atualizarCampoFormularioTurma}
                      value={dadosFormularioTurma.cursoId}
                    >
                      <option value="">Selecionar curso</option>
                      {cursosOrdenados.map((curso) => (
                        <option key={curso.id} value={curso.id}>
                          {curso.titulo}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="management-field">
                    <span>Professor responsavel</span>
                    <select
                      disabled={salvandoCriacao || !professoresOrdenados.length}
                      name="professorId"
                      onChange={atualizarCampoFormularioTurma}
                      value={dadosFormularioTurma.professorId}
                    >
                      <option value="">Selecionar professor</option>
                      {professoresOrdenados.map((professor) => (
                        <option key={professor.id} value={professor.id}>
                          {professor.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {mensagemFormularioTurma.message ? (
                  <InlineMessage tone={mensagemFormularioTurma.tone}>{mensagemFormularioTurma.message}</InlineMessage>
                ) : null}

                <div className="management-form__actions">
                  <button
                    className="solid-button"
                    disabled={salvandoCriacao || !cursosOrdenados.length || !professoresOrdenados.length}
                    type="submit"
                  >
                    {salvandoCriacao ? "Salvando..." : "Criar turma"}
                  </button>

                  <button
                    className="button button--secondary"
                    disabled={salvandoCriacao}
                    onClick={fecharFormularioCriacao}
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </PanelCard>
        </div>
      </div>
    );
  }

  return (
    <PanelCard
      description={
        cursoFiltrado
          ? `Visao das turmas de ${cursoFiltrado.titulo}, com criacao e filtro contextualizados nesse curso.`
          : "Visao das turmas disponiveis para alocacao e acompanhamento."
      }
      title={ehProfessor ? "Turmas ligadas ao seu perfil" : "Turmas cadastradas"}
    >
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
              aria-label="Buscar turmas"
              className="table-inline-input table-inline-input--search"
              onChange={(event) => setBuscaTurma(event.target.value)}
              placeholder="Pesquisar turmas"
              type="search"
              value={buscaTurma}
            />
          </label>
          <select
            aria-label="Filtrar turmas por curso"
            className="table-inline-select"
            onChange={(event) => setFiltroCurso(event.target.value)}
            value={filtroCurso}
          >
            <option value="todos">Todos os cursos</option>
            {cursosDasTurmas.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.titulo}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar turmas por professor"
            className="table-inline-select"
            onChange={(event) => setFiltroProfessor(event.target.value)}
            value={filtroProfessor}
          >
            <option value="todos">Todos os professores</option>
            <option value="sem-professor">Sem professor</option>
            {professoresDasTurmas.map((professor) => (
              <option key={professor.id} value={professor.id}>
                {professor.nome}
              </option>
            ))}
          </select>
          <button className="table-action" disabled={!temFiltroAtivo} onClick={limparFiltros} type="button">
            Limpar filtros
          </button>
        </div>
        <div className="table-actions">
          {podeGerenciarTurmas ? (
            <button
              className="table-action"
              disabled={!cursosOrdenados.length || !professoresOrdenados.length}
              onClick={abrirFormularioCriacao}
              type="button"
            >
              Criar turma
            </button>
          ) : null}
          <p className="table-toolbar__summary">
            {turmasFiltradas.length} de {turmas.length} turma{turmas.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      {renderBarraAtribuicao()}
      {mensagem.message ? <InlineMessage tone={mensagem.tone}>{mensagem.message}</InlineMessage> : null}
      <DataTable
        columns={[
          ...(podeAtribuirProfessor ? [{ key: "selecionar", label: "Selecionar", render: renderSelecao }] : []),
          { key: "nomeTurma", label: "Turma" },
          {
            key: "cursoId",
            label: "Curso",
            render: (turma) => cursoPorId.get(turma.cursoId)?.titulo || `Curso #${turma.cursoId}`
          },
          {
            key: "professorId",
            label: "Professor",
            render: (turma) =>
              turma.professorId ? professorPorId.get(turma.professorId)?.nome || `Professor #${turma.professorId}` : "Nao definido"
          },
          {
            key: "alunos",
            label: "Alunos",
            render: (turma) => quantidadeAlunosPorTurma.get(turma.id) || 0
          }
        ]}
        emptyMessage={temFiltroAtivo ? "Nenhuma turma encontrada com os filtros aplicados." : "Nenhuma turma encontrada."}
        rows={turmasFiltradas}
      />
      {renderFormularioCriacaoTurma()}
    </PanelCard>
  );
}
