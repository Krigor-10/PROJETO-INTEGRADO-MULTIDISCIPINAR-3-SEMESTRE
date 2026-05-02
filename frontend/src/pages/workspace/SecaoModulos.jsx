import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable, InlineMessage, PanelCard } from "../../components/Primitives.jsx";
import { ApiError, apiRequest } from "../../lib/api.js";
import { mapById } from "../../lib/dashboard.js";
import { normalizeStatus } from "../../lib/format.js";

const ESTADO_INICIAL_FORMULARIO_MODULO = {
  cursoId: "",
  titulo: ""
};

// Mantem a busca consistente com as demais tabelas do workspace.
function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function alunoEstaAtivo(aluno) {
  if (!aluno || typeof aluno.ativo === "undefined") {
    return true;
  }

  if (typeof aluno.ativo === "string") {
    return !["false", "0", "inativo", "inativa"].includes(normalizarBusca(aluno.ativo));
  }

  return Boolean(aluno.ativo);
}

export function SecaoModulos({
  alunos = [],
  cursos,
  cursoEmFoco,
  matriculas = [],
  modulos,
  onCursoEmFocoAplicado,
  onRefresh,
  onSessionExpired,
  professores = [],
  turmas = []
}) {
  const [dadosFormularioModulo, setDadosFormularioModulo] = useState(ESTADO_INICIAL_FORMULARIO_MODULO);
  const [moduloEmEdicaoId, setModuloEmEdicaoId] = useState(null);
  const [mensagemFormularioModulo, setMensagemFormularioModulo] = useState({ tone: "", message: "" });
  const [modulosSelecionados, setModulosSelecionados] = useState(() => new Set());
  const [salvandoModulo, setSalvandoModulo] = useState(false);
  const [buscaModulo, setBuscaModulo] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("todos");
  const [formularioModuloAberto, setFormularioModuloAberto] = useState(false);
  const [moduloDetalhadoId, setModuloDetalhadoId] = useState(null);
  const [cursoModulosSelecionado, setCursoModulosSelecionado] = useState(null);
  const detalheModuloRef = useRef(null);

  const cursosOrdenados = useMemo(
    () => [...cursos].sort((cursoA, cursoB) => cursoA.titulo.localeCompare(cursoB.titulo, "pt-BR")),
    [cursos]
  );
  const termoBusca = useMemo(() => normalizarBusca(buscaModulo), [buscaModulo]);
  const cursoEmFocoId = Number(cursoEmFoco?.cursoId || 0);

  useEffect(() => {
    if (moduloEmEdicaoId || dadosFormularioModulo.cursoId || !cursosOrdenados.length) {
      return;
    }

    // Preenche o curso padrao para agilizar a criacao de um novo modulo.
    setDadosFormularioModulo((dadosAtuais) => ({
      ...dadosAtuais,
      cursoId: filtroCurso !== "todos" ? filtroCurso : String(cursosOrdenados[0].id)
    }));
  }, [moduloEmEdicaoId, dadosFormularioModulo.cursoId, cursosOrdenados, filtroCurso]);

  const cursoPorId = useMemo(() => mapById(cursos), [cursos]);
  const alunoPorId = useMemo(() => mapById(alunos), [alunos]);
  const professorPorId = useMemo(() => mapById(professores), [professores]);
  const cursoFiltrado = useMemo(
    () => (filtroCurso === "todos" ? null : cursoPorId.get(Number(filtroCurso)) || null),
    [cursoPorId, filtroCurso]
  );
  const professoresPorCurso = useMemo(() => {
    const professoresMapeados = new Map();

    turmas.forEach((turma) => {
      const cursoId = Number(turma.cursoId);
      const professorId = Number(turma.professorId);

      if (!cursoId || !professorId) {
        return;
      }

      if (!professoresMapeados.has(cursoId)) {
        professoresMapeados.set(cursoId, new Map());
      }

      professoresMapeados
        .get(cursoId)
        .set(professorId, professorPorId.get(professorId) || { id: professorId, nome: `Professor #${professorId}` });
    });

    return new Map(
      [...professoresMapeados.entries()].map(([cursoId, professoresDoCurso]) => [
        cursoId,
        [...professoresDoCurso.values()].sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"))
      ])
    );
  }, [professorPorId, turmas]);
  const alunosAtivosPorCurso = useMemo(() => {
    const alunosPorCurso = new Map();

    matriculas.forEach((matricula) => {
      const alunoId = Number(matricula.alunoId);
      const cursoId = Number(matricula.cursoId);

      if (!alunoId || !cursoId || normalizeStatus(matricula.status) !== "Aprovada") {
        return;
      }

      const aluno = alunoPorId.get(alunoId) || matricula.aluno;

      if (!alunoEstaAtivo(aluno)) {
        return;
      }

      if (!alunosPorCurso.has(cursoId)) {
        alunosPorCurso.set(cursoId, new Set());
      }

      alunosPorCurso.get(cursoId).add(alunoId);
    });

    return new Map([...alunosPorCurso.entries()].map(([cursoId, idsAlunos]) => [cursoId, idsAlunos.size]));
  }, [alunoPorId, matriculas]);
  const modulosOrdenados = useMemo(
    () =>
      [...modulos].sort((moduloA, moduloB) => {
        const tituloCursoA = cursoPorId.get(moduloA.cursoId)?.titulo || "";
        const tituloCursoB = cursoPorId.get(moduloB.cursoId)?.titulo || "";
        const comparacaoCurso = tituloCursoA.localeCompare(tituloCursoB, "pt-BR");

        if (comparacaoCurso !== 0) {
          return comparacaoCurso;
        }

        return moduloA.titulo.localeCompare(moduloB.titulo, "pt-BR");
      }),
    [cursoPorId, modulos]
  );
  const modulosPorCurso = useMemo(() => {
    const grupos = new Map();

    modulosOrdenados.forEach((modulo) => {
      const cursoId = Number(modulo.cursoId);

      if (!grupos.has(cursoId)) {
        grupos.set(cursoId, []);
      }

      grupos.get(cursoId).push(modulo);
    });

    return grupos;
  }, [modulosOrdenados]);

  // A tabela trabalha sempre em cima do recorte filtrado para que busca, contagem e selecao falem a mesma lingua.
  const linhasModulos = useMemo(
    () => {
      let proximosModulos = modulosOrdenados;

      if (filtroCurso !== "todos") {
        const cursoId = Number(filtroCurso);
        proximosModulos = proximosModulos.filter((modulo) => Number(modulo.cursoId) === cursoId);
      }

      if (!termoBusca) {
        return proximosModulos;
      }

      return proximosModulos.filter((modulo) => {
        const nomeCurso = cursoPorId.get(modulo.cursoId)?.titulo || `Curso #${modulo.cursoId}`;
        const quantidadeAlunosAtivos = alunosAtivosPorCurso.get(modulo.cursoId) || 0;
        const campos = [modulo.codigoRegistro, modulo.titulo, nomeCurso, String(quantidadeAlunosAtivos)];

        return campos.some((campo) => normalizarBusca(campo).includes(termoBusca));
      });
    },
    [alunosAtivosPorCurso, cursoPorId, filtroCurso, modulosOrdenados, termoBusca]
  );
  const idsModulos = useMemo(() => new Set(linhasModulos.map((modulo) => modulo.id)), [linhasModulos]);
  const modulosMarcados = useMemo(
    () => linhasModulos.filter((modulo) => modulosSelecionados.has(modulo.id)),
    [linhasModulos, modulosSelecionados]
  );
  const todosModulosSelecionados =
    linhasModulos.length > 0 && linhasModulos.every((modulo) => modulosSelecionados.has(modulo.id));
  const quantidadeSelecionada = modulosMarcados.length;
  const temFiltroAtivo = Boolean(termoBusca || filtroCurso !== "todos");
  const moduloDetalhado = useMemo(
    () => modulos.find((modulo) => modulo.id === moduloDetalhadoId) || null,
    [moduloDetalhadoId, modulos]
  );

  useEffect(() => {
    // Remove da selecao itens que sumiram da lista visivel apos filtro ou refresh.
    setModulosSelecionados((atuais) => {
      const proximos = new Set([...atuais].filter((id) => idsModulos.has(id)));
      return proximos.size === atuais.size ? atuais : proximos;
    });
  }, [idsModulos]);

  useEffect(() => {
    if (moduloDetalhadoId && !moduloDetalhado) {
      setModuloDetalhadoId(null);
    }
  }, [moduloDetalhado, moduloDetalhadoId]);

  useEffect(() => {
    if (!cursoEmFocoId) {
      return;
    }

    setBuscaModulo("");
    setFiltroCurso(String(cursoEmFocoId));
    setDadosFormularioModulo((dadosAtuais) => ({
      ...dadosAtuais,
      cursoId: moduloEmEdicaoId ? dadosAtuais.cursoId : String(cursoEmFocoId)
    }));
    onCursoEmFocoAplicado?.();
  }, [cursoEmFocoId, moduloEmEdicaoId, onCursoEmFocoAplicado]);

  useEffect(() => {
    if (!formularioModuloAberto) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !salvandoModulo) {
        fecharFormularioModulo();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [formularioModuloAberto, salvandoModulo]);

  useEffect(() => {
    if (!cursoModulosSelecionado) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        fecharModulosCurso();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cursoModulosSelecionado]);

  // Atualiza o estado do formulario sem perder os outros campos em edicao.
  function atualizarCampoFormularioModulo(event) {
    const { name, value } = event.target;

    setDadosFormularioModulo((dadosAtuais) => ({
      ...dadosAtuais,
      [name]: value
    }));
  }

  function limparFormularioModulo() {
    setModuloEmEdicaoId(null);
    setModulosSelecionados(new Set());
    setDadosFormularioModulo({
      cursoId: filtroCurso !== "todos" ? filtroCurso : cursosOrdenados[0] ? String(cursosOrdenados[0].id) : "",
      titulo: ""
    });
  }

  function abrirFormularioNovoModulo() {
    setModuloEmEdicaoId(null);
    setModulosSelecionados(new Set());
    setDadosFormularioModulo({
      cursoId: filtroCurso !== "todos" ? filtroCurso : cursosOrdenados[0] ? String(cursosOrdenados[0].id) : "",
      titulo: ""
    });
    setMensagemFormularioModulo({ tone: "", message: "" });
    setFormularioModuloAberto(true);
  }

  function fecharFormularioModulo() {
    if (salvandoModulo) {
      return;
    }

    setFormularioModuloAberto(false);
    setMensagemFormularioModulo({ tone: "", message: "" });
    limparFormularioModulo();
  }

  // Carrega um unico modulo selecionado no formulario para reaproveitar o mesmo fluxo de criacao/edicao.
  function abrirEdicaoModulo(modulo) {
    setModuloEmEdicaoId(modulo.id);
    setDadosFormularioModulo({
      cursoId: String(modulo.cursoId),
      titulo: modulo.titulo
    });
    setMensagemFormularioModulo({ tone: "", message: "" });
    setFormularioModuloAberto(true);
  }

  function limparFiltros() {
    setBuscaModulo("");
    setFiltroCurso("todos");
  }

  function abrirDetalheModulo(modulo) {
    setModuloDetalhadoId(modulo.id);

    if (window.innerWidth <= 900) {
      window.requestAnimationFrame(() => {
        detalheModuloRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function fecharDetalheModulo() {
    setModuloDetalhadoId(null);
  }

  function abrirModulosCurso(event, modulo) {
    event.stopPropagation();

    const cursoId = Number(modulo.cursoId);
    const modulosDoCurso = modulosPorCurso.get(cursoId) || [];

    if (modulosDoCurso.length <= 1) {
      return;
    }

    setCursoModulosSelecionado({
      curso: cursoPorId.get(cursoId) || { id: cursoId, titulo: `Curso #${cursoId}` },
      modulos: modulosDoCurso
    });
  }

  function fecharModulosCurso() {
    setCursoModulosSelecionado(null);
  }

  // A selecao em lote fica restrita aos modulos visiveis para evitar operacoes escondidas por filtros.
  function alternarModulo(modulo) {
    if (salvandoModulo) {
      return;
    }

    setModulosSelecionados((atuais) => {
      const proximos = new Set(atuais);

      if (proximos.has(modulo.id)) {
        proximos.delete(modulo.id);
      } else {
        proximos.add(modulo.id);
      }

      return proximos;
    });
  }

  function alternarTodosModulos() {
    if (salvandoModulo || !linhasModulos.length) {
      return;
    }

    setModulosSelecionados((atuais) => {
      if (todosModulosSelecionados) {
        return new Set();
      }

      const proximos = new Set(atuais);
      linhasModulos.forEach((modulo) => proximos.add(modulo.id));
      return proximos;
    });
  }

  function editarSelecionado() {
    if (quantidadeSelecionada !== 1) {
      setMensagemFormularioModulo({
        tone: "error",
        message: "Selecione exatamente um modulo para editar."
      });
      return;
    }

    abrirEdicaoModulo(modulosMarcados[0]);
  }

  // Centraliza validacao e chamada da API tanto para criacao quanto para edicao.
  async function salvarModulo(event) {
    event.preventDefault();

    const tituloNormalizado = dadosFormularioModulo.titulo.trim();

    if (!tituloNormalizado) {
      setMensagemFormularioModulo({ tone: "error", message: "Informe o titulo do modulo antes de salvar." });
      return;
    }

    if (!dadosFormularioModulo.cursoId) {
      setMensagemFormularioModulo({ tone: "error", message: "Selecione um curso para vincular o modulo." });
      return;
    }

    setSalvandoModulo(true);
    setMensagemFormularioModulo({ tone: "", message: "" });

    try {
      if (moduloEmEdicaoId) {
        await apiRequest(`/Modulos/${moduloEmEdicaoId}`, {
          method: "PUT",
          body: JSON.stringify({ titulo: tituloNormalizado })
        });

        setMensagemFormularioModulo({ tone: "success", message: "Modulo atualizado com sucesso." });
      } else {
        await apiRequest("/Modulos", {
          method: "POST",
          body: JSON.stringify({
            titulo: tituloNormalizado,
            cursoId: Number(dadosFormularioModulo.cursoId)
          })
        });

        setMensagemFormularioModulo({ tone: "success", message: "Modulo criado com sucesso." });
      }

      limparFormularioModulo();
      setFormularioModuloAberto(false);
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setMensagemFormularioModulo({
        tone: "error",
        message: err.message || "Nao foi possivel salvar o modulo agora."
      });
    } finally {
      setSalvandoModulo(false);
    }
  }

  // Exclui em lote os modulos marcados e reidrata a tabela depois da operacao.
  async function excluirSelecionados() {
    if (!quantidadeSelecionada) {
      setMensagemFormularioModulo({ tone: "error", message: "Selecione ao menos um modulo para excluir." });
      return;
    }

    const rotulo = quantidadeSelecionada === 1 ? `"${modulosMarcados[0].titulo}"` : `${quantidadeSelecionada} modulos`;
    const exclusaoConfirmada = window.confirm(`Deseja excluir ${rotulo}?`);

    if (!exclusaoConfirmada) {
      return;
    }

    setSalvandoModulo(true);
    setMensagemFormularioModulo({ tone: "", message: "" });

    try {
      for (const modulo of modulosMarcados) {
        await apiRequest(`/Modulos/${modulo.id}`, { method: "DELETE" });
      }

      if (modulosMarcados.some((modulo) => modulo.id === moduloEmEdicaoId)) {
        setModuloEmEdicaoId(null);
      }

      if (modulosMarcados.some((modulo) => modulo.id === moduloDetalhadoId)) {
        setModuloDetalhadoId(null);
      }

      setModulosSelecionados(new Set());
      setMensagemFormularioModulo({
        tone: "success",
        message: `${quantidadeSelecionada} modulo${quantidadeSelecionada > 1 ? "s excluidos" : " excluido"} com sucesso.`
      });
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setMensagemFormularioModulo({
        tone: "error",
        message: err.message || "Nao foi possivel excluir os modulos selecionados agora."
      });
      onRefresh();
    } finally {
      setSalvandoModulo(false);
    }
  }

  function renderSelecaoModulo(modulo) {
    return (
      <label className="table-select-cell" onClick={(event) => event.stopPropagation()}>
        <input
          aria-label={`Selecionar modulo ${modulo.titulo}`}
          checked={modulosSelecionados.has(modulo.id)}
          className="table-select-input"
          disabled={salvandoModulo}
          onChange={() => alternarModulo(modulo)}
          type="checkbox"
        />
      </label>
    );
  }

  function renderAcaoDetalheModulo(modulo) {
    return (
      <button
        aria-label={`Ver detalhes do modulo ${modulo.titulo}`}
        className="table-row-arrow"
        onClick={(event) => {
          event.stopPropagation();
          abrirDetalheModulo(modulo);
        }}
        title="Ver detalhes"
        type="button"
      >
        &gt;
      </button>
    );
  }

  function renderTituloModulo(modulo) {
    return (
      <div className="module-title-cell">
        <strong>{modulo.titulo}</strong>
        <span>{modulo.codigoRegistro || "Sem codigo"}</span>
      </div>
    );
  }

  function renderCursoModulo(modulo) {
    const curso = cursoPorId.get(modulo.cursoId);
    const modulosDoCurso = modulosPorCurso.get(Number(modulo.cursoId)) || [];

    return (
      <div className="module-course-cell">
        <div>
          <span className="course-preview-cell__name">{curso?.titulo || `Curso #${modulo.cursoId}`}</span>
          <small>
            {modulosDoCurso.length} modulo{modulosDoCurso.length === 1 ? "" : "s"} no curso
          </small>
        </div>
        {modulosDoCurso.length > 1 ? (
          <button
            aria-label={`Ver todos os modulos de ${curso?.titulo || `Curso #${modulo.cursoId}`}`}
            className="course-preview-cell__more"
            onClick={(event) => abrirModulosCurso(event, modulo)}
            title="Ver modulos do curso"
            type="button"
          >
            +
          </button>
        ) : null}
      </div>
    );
  }

  function renderBarraAcoesModulos() {
    return (
      <div className="table-toolbar table-toolbar--matriculas">
        <div className="table-actions table-actions--bulk">
          <label className="table-bulk-toggle">
            <input
              checked={todosModulosSelecionados}
              className="table-select-input"
              disabled={salvandoModulo || !linhasModulos.length}
              onChange={alternarTodosModulos}
              type="checkbox"
            />
            <span>Selecionar todos</span>
          </label>
          <button
            className="table-action"
            disabled={salvandoModulo || quantidadeSelecionada !== 1}
            onClick={editarSelecionado}
            type="button"
          >
            Editar selecionado
          </button>
          <button
            className="table-action table-action--danger"
            disabled={salvandoModulo || quantidadeSelecionada === 0}
            onClick={excluirSelecionados}
            type="button"
          >
            Excluir selecionados
          </button>
        </div>
        <p className="table-toolbar__summary">
          {quantidadeSelecionada
            ? `${quantidadeSelecionada} selecionado${quantidadeSelecionada > 1 ? "s" : ""}`
            : `${linhasModulos.length} de ${modulos.length} modulo${modulos.length === 1 ? "" : "s"}`}
        </p>
      </div>
    );
  }

  function renderFormularioModulo() {
    if (!formularioModuloAberto) {
      return null;
    }

    return (
      <div
        className="content-form-modal"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            fecharFormularioModulo();
          }
        }}
      >
        <div
          aria-label={moduloEmEdicaoId ? "Editar modulo" : "Criar modulo"}
          aria-modal="true"
          className="content-form-modal__card"
          role="dialog"
        >
          <button
            className="content-form-modal__close"
            disabled={salvandoModulo}
            onClick={fecharFormularioModulo}
            type="button"
          >
            Fechar
          </button>

          <PanelCard
            description={
              cursoFiltrado && !moduloEmEdicaoId
                ? `Crie um modulo para ${cursoFiltrado.titulo} com o curso ja preselecionado.`
                : "Organize a estrutura modular antes de ligar conteudos e avaliacoes."
            }
            title={moduloEmEdicaoId ? "Editar modulo" : "Criar modulo"}
          >
            <form className="management-form" onSubmit={salvarModulo}>
              <div className="management-form__grid">
                <label className="management-field">
                  <span>Curso</span>
                  <select
                    disabled={salvandoModulo || moduloEmEdicaoId !== null || !cursosOrdenados.length}
                    name="cursoId"
                    onChange={atualizarCampoFormularioModulo}
                    value={dadosFormularioModulo.cursoId}
                  >
                    {!cursosOrdenados.length ? <option value="">Nenhum curso disponivel</option> : null}
                    {cursosOrdenados.map((curso) => (
                      <option key={curso.id} value={curso.id}>
                        {curso.titulo}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="management-field management-field--wide">
                  <span>Titulo do modulo</span>
                  <input
                    autoComplete="off"
                    disabled={salvandoModulo}
                    maxLength={150}
                    name="titulo"
                    onChange={atualizarCampoFormularioModulo}
                    placeholder="Ex.: Fundamentos de Programacao"
                    type="text"
                    value={dadosFormularioModulo.titulo}
                  />
                </label>
              </div>

              {moduloEmEdicaoId ? (
                <p className="management-form__hint">
                  O curso fica travado durante a edicao porque a API atual permite atualizar apenas o titulo do modulo.
                </p>
              ) : null}

              {mensagemFormularioModulo.message ? (
                <InlineMessage tone={mensagemFormularioModulo.tone}>{mensagemFormularioModulo.message}</InlineMessage>
              ) : null}

              <div className="management-form__actions">
                <button className="solid-button" disabled={salvandoModulo || !cursosOrdenados.length} type="submit">
                  {salvandoModulo ? "Salvando..." : moduloEmEdicaoId ? "Salvar alteracoes" : "Criar modulo"}
                </button>

                <button
                  className="button button--secondary exit-button"
                  disabled={salvandoModulo}
                  onClick={fecharFormularioModulo}
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

  function renderModulosCursoPopup() {
    if (!cursoModulosSelecionado) {
      return null;
    }

    return (
      <div
        className="content-form-modal"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            fecharModulosCurso();
          }
        }}
      >
        <div
          aria-label={`Modulos de ${cursoModulosSelecionado.curso.titulo}`}
          aria-modal="true"
          className="content-form-modal__card content-form-modal__card--compact"
          role="dialog"
        >
          <button className="content-form-modal__close" onClick={fecharModulosCurso} type="button">
            Fechar
          </button>

          <PanelCard description={cursoModulosSelecionado.curso.titulo} title="Modulos do curso">
            <ul className="student-course-list module-popup-list">
              {cursoModulosSelecionado.modulos.map((modulo) => (
                <li key={modulo.id}>
                  <strong>{modulo.titulo}</strong>
                  <span>{modulo.codigoRegistro || "Sem codigo"}</span>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      </div>
    );
  }

  // Replica o toolbar de filtros usado nas outras secoes administrativas.
  function renderBarraFiltrosModulos() {
    return (
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
              aria-label="Buscar modulos"
              className="table-inline-input table-inline-input--search"
              onChange={(event) => setBuscaModulo(event.target.value)}
              placeholder="Pesquisar modulos"
              type="search"
              value={buscaModulo}
            />
          </label>
          <select
            aria-label="Filtrar modulos por curso"
            className="table-inline-select"
            onChange={(event) => setFiltroCurso(event.target.value)}
            value={filtroCurso}
          >
            <option value="todos">Todos os cursos</option>
            {cursosOrdenados.map((curso) => (
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
            className="solid-button"
            disabled={salvandoModulo || !cursosOrdenados.length}
            onClick={abrirFormularioNovoModulo}
            type="button"
          >
            Criar modulo
          </button>
        </div>
      </div>
    );
  }

  function renderDetalheModulo() {
    if (!moduloDetalhado) {
      return null;
    }

    const curso = cursoPorId.get(Number(moduloDetalhado.cursoId));
    const professoresDoCurso = professoresPorCurso.get(Number(moduloDetalhado.cursoId)) || [];
    const nomesProfessores = professoresDoCurso.length
      ? professoresDoCurso.map((professor) => professor.nome).join(", ")
      : "Sem professor vinculado";
    const alunosAtivos = alunosAtivosPorCurso.get(Number(moduloDetalhado.cursoId)) || 0;

    return (
      <aside className="module-detail-column" ref={detalheModuloRef}>
        <PanelCard
          description="Resumo academico do modulo selecionado."
          title="Informacoes do modulo"
        >
          <div className="module-detail-panel-actions">
            <button className="table-action module-detail-close" onClick={fecharDetalheModulo} type="button">
              Fechar detalhe
            </button>
          </div>
          <div className="module-detail-grid">
            <article className="module-detail-card">
              <span>Codigo do modulo</span>
              <strong>{moduloDetalhado.codigoRegistro || "Sem codigo"}</strong>
            </article>
            <article className="module-detail-card">
              <span>Modulo</span>
              <strong>{moduloDetalhado.titulo}</strong>
            </article>
            <article className="module-detail-card">
              <span>Curso</span>
              <strong>{curso?.titulo || `Curso #${moduloDetalhado.cursoId}`}</strong>
            </article>
            <article className="module-detail-card">
              <span>Professor</span>
              <strong>{nomesProfessores}</strong>
            </article>
            <article className="module-detail-card">
              <span>Quantidade de alunos ativos</span>
              <strong>{alunosAtivos}</strong>
            </article>
          </div>
        </PanelCard>
      </aside>
    );
  }

  return (
    <div className={`module-management-layout${moduloDetalhado ? " module-management-layout--with-detail" : ""}`}>
      {renderFormularioModulo()}
      {renderModulosCursoPopup()}

      <PanelCard
        description={
          cursoFiltrado
            ? `Mostrando apenas os modulos de ${cursoFiltrado.titulo}. Use Limpar filtros para voltar ao catalogo completo.`
            : "Lista consolidada dos modulos cadastrados, com vinculo direto ao curso correspondente."
        }
        title="Modulos cadastrados"
      >
        {renderBarraFiltrosModulos()}
        {renderBarraAcoesModulos()}
        {!formularioModuloAberto && mensagemFormularioModulo.message ? (
          <InlineMessage tone={mensagemFormularioModulo.tone}>{mensagemFormularioModulo.message}</InlineMessage>
        ) : null}
        <DataTable
          columns={[
            { key: "selecionar", label: "Selecionar", render: renderSelecaoModulo },
            { key: "codigoRegistro", label: "CODIGO DO MODULO", render: (row) => row.codigoRegistro || "Sem codigo" },
            { key: "titulo", label: "Modulo", render: renderTituloModulo },
            {
              key: "cursoId",
              label: "Curso",
              render: renderCursoModulo
            },
            {
              key: "alunosAtivos",
              label: "Alunos ativos",
              render: (row) => alunosAtivosPorCurso.get(row.cursoId) || 0
            },
            { key: "detalhes", label: "", render: renderAcaoDetalheModulo }
          ]}
          emptyMessage={temFiltroAtivo ? "Nenhum modulo encontrado com os filtros aplicados." : "Nenhum modulo cadastrado ainda."}
          getRowAriaLabel={(row) => `Ver detalhes do modulo ${row.titulo}`}
          getRowClassName={(row) =>
            `table-row--clickable${row.id === moduloDetalhadoId ? " table-row--selected" : ""}`
          }
          onRowClick={abrirDetalheModulo}
          rows={linhasModulos}
        />
      </PanelCard>
      {renderDetalheModulo()}
    </div>
  );
}
