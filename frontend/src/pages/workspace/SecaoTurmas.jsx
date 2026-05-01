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

function montarNomeTurmaPadrao(curso) {
  const titulo = String(curso?.titulo || "").trim();
  const nome = titulo ? `Turma online - ${titulo}` : "Turma online";
  return nome.length <= 120 ? nome : nome.slice(0, 120).trimEnd();
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
  const turmaPadraoPorCursoId = useMemo(() => {
    const mapa = new Map();

    [...turmas]
      .sort((left, right) => {
        const leftDate = new Date(left.dataCriacao || 0).getTime();
        const rightDate = new Date(right.dataCriacao || 0).getTime();
        return leftDate - rightDate || Number(left.id || 0) - Number(right.id || 0);
      })
      .forEach((turma) => {
        if (!mapa.has(turma.cursoId)) {
          mapa.set(turma.cursoId, turma);
        }
      });

    return mapa;
  }, [turmas]);
  const cursosDisponiveisParaTurma = useMemo(
    () => cursosOrdenados.filter((curso) => !turmaPadraoPorCursoId.has(curso.id)),
    [cursosOrdenados, turmaPadraoPorCursoId]
  );
  const cursoFiltrado = useMemo(
    () => (filtroCurso === "todos" ? null : cursoPorId.get(Number(filtroCurso)) || null),
    [cursoPorId, filtroCurso]
  );
  const professoresOrdenados = useMemo(
    () => [...professores].sort((left, right) => String(left.nome || "").localeCompare(String(right.nome || ""), "pt-BR")),
    [professores]
  );
  const motivoCriacaoTurmaBloqueada = useMemo(() => {
    if (!cursosOrdenados.length) {
      return "Cadastre ao menos um curso antes de criar a turma padrao.";
    }

    if (!professoresOrdenados.length) {
      return "Cadastre ao menos um professor antes de criar a turma padrao.";
    }

    if (!cursosDisponiveisParaTurma.length) {
      return "Todos os cursos ja possuem turma padrao. Para trocar professor, selecione a turma existente.";
    }

    return "";
  }, [cursosDisponiveisParaTurma.length, cursosOrdenados.length, professoresOrdenados.length]);
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
      const campos = [turma.codigoRegistro, turma.nomeTurma, nomeCurso, nomeProfessor, String(totalAlunos)];

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
    if (motivoCriacaoTurmaBloqueada) {
      setMensagem({ tone: "info", message: motivoCriacaoTurmaBloqueada });
      return;
    }

    const cursoInicial =
      filtroCurso !== "todos" && !turmaPadraoPorCursoId.has(Number(filtroCurso))
        ? filtroCurso
        : String(cursosDisponiveisParaTurma[0]?.id || "");
    const curso = cursoPorId.get(Number(cursoInicial));

    setMensagem({ tone: "info", message: "" });
    setMensagemFormularioTurma({ tone: "info", message: "" });
    setDadosFormularioTurma({
      nomeTurma: montarNomeTurmaPadrao(curso),
      cursoId: cursoInicial,
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
    setDadosFormularioTurma((atuais) => {
      const proximos = {
        ...atuais,
        [name]: value
      };

      if (name === "cursoId") {
        proximos.nomeTurma = montarNomeTurmaPadrao(cursoPorId.get(Number(value)));
      }

      return proximos;
    });
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

    const cursoId = Number(dadosFormularioTurma.cursoId);
    const professorId = Number(dadosFormularioTurma.professorId);

    if (!cursoId) {
      setMensagemFormularioTurma({ tone: "error", message: "Selecione o curso da turma padrao." });
      return;
    }

    if (turmaPadraoPorCursoId.has(cursoId)) {
      setMensagemFormularioTurma({
        tone: "error",
        message: "Este curso ja possui uma turma padrao. Use a turma existente para trocar o professor."
      });
      return;
    }

    if (!professorId) {
      setMensagemFormularioTurma({ tone: "error", message: "Selecione o professor responsavel pela turma." });
      return;
    }

    const curso = cursoPorId.get(cursoId);
    const nomeTurma = montarNomeTurmaPadrao(curso);

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

      const professor = professorPorId.get(professorId);

      setFormularioCriacaoAberto(false);
      setDadosFormularioTurma({
        nomeTurma: "",
        cursoId: "",
        professorId: ""
      });
      setMensagem({
        tone: "success",
        message: `Turma padrao criada para ${curso?.titulo || `Curso #${cursoId}`} com ${
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
        <div aria-label="Criar turma padrao" aria-modal="true" className="content-form-modal__card" role="dialog">
          <button
            className="content-form-modal__close"
            disabled={salvandoCriacao}
            onClick={fecharFormularioCriacao}
            type="button"
          >
            Fechar
          </button>

          <PanelCard
            description="Selecione um curso sem turma padrao e atribua o professor responsavel antes de salvar."
            title="Criar turma padrao"
          >
            {!cursosOrdenados.length ? (
              <InlineMessage tone="info">Cadastre ao menos um curso antes de criar a turma padrao.</InlineMessage>
            ) : !professoresOrdenados.length ? (
              <InlineMessage tone="info">Cadastre ao menos um professor antes de criar a turma padrao.</InlineMessage>
            ) : !cursosDisponiveisParaTurma.length ? (
              <InlineMessage tone="info">
                Todos os cursos ja possuem turma padrao. Para trocar professor, selecione a turma existente.
              </InlineMessage>
            ) : (
              <form className="management-form" onSubmit={salvarTurma}>
                <div className="management-form__grid">
                  <label className="management-field management-field--wide">
                    <span>Turma padrao</span>
                    <input
                      autoComplete="off"
                      readOnly
                      maxLength={120}
                      name="nomeTurma"
                      type="text"
                      value={dadosFormularioTurma.nomeTurma}
                    />
                  </label>

                  <label className="management-field">
                    <span>Curso</span>
                    <select
                      disabled={salvandoCriacao || !cursosDisponiveisParaTurma.length}
                      name="cursoId"
                      onChange={atualizarCampoFormularioTurma}
                      value={dadosFormularioTurma.cursoId}
                    >
                      <option value="">Selecionar curso sem turma padrao</option>
                      {cursosDisponiveisParaTurma.map((curso) => (
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
                    disabled={salvandoCriacao || !cursosDisponiveisParaTurma.length || !professoresOrdenados.length}
                    type="submit"
                  >
                    {salvandoCriacao ? "Salvando..." : "Criar turma padrao"}
                  </button>

                  <button
                    className="button button--secondary exit-button"
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
          ? `Visao da turma padrao de ${cursoFiltrado.titulo}, com gestao contextualizada nesse curso.`
          : "Visao das turmas padrao disponiveis para alocacao e acompanhamento."
      }
      title={ehProfessor ? "Turmas ligadas ao seu perfil" : "Turmas padrao dos cursos"}
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
              placeholder="Pesquisar turma padrao"
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
              disabled={Boolean(motivoCriacaoTurmaBloqueada)}
              onClick={abrirFormularioCriacao}
              title={motivoCriacaoTurmaBloqueada || "Criar turma padrao"}
              type="button"
            >
              Criar turma padrao
            </button>
          ) : null}
          <p className="table-toolbar__summary">
            {turmasFiltradas.length} de {turmas.length} turma{turmas.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      {renderBarraAtribuicao()}
      {podeGerenciarTurmas && motivoCriacaoTurmaBloqueada ? (
        <InlineMessage tone="info">{motivoCriacaoTurmaBloqueada}</InlineMessage>
      ) : null}
      {mensagem.message ? <InlineMessage tone={mensagem.tone}>{mensagem.message}</InlineMessage> : null}
      <DataTable
        columns={[
          ...(podeAtribuirProfessor ? [{ key: "selecionar", label: "Selecionar", render: renderSelecao }] : []),
          { key: "codigoRegistro", label: "CODIGO DA TURMA", render: (turma) => turma.codigoRegistro || "Sem codigo" },
          { key: "nomeTurma", label: "Turma padrao" },
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
        emptyMessage={temFiltroAtivo ? "Nenhuma turma padrao encontrada com os filtros aplicados." : "Nenhuma turma padrao encontrada."}
        rows={turmasFiltradas}
      />
      {renderFormularioCriacaoTurma()}
    </PanelCard>
  );
}
