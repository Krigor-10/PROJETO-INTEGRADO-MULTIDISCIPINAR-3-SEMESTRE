import { useEffect, useMemo, useState } from "react";
import { DataTable, InlineMessage, PanelCard, StatusPill } from "../../components/Primitives.jsx";
import { ApiError, apiRequest } from "../../lib/api.js";
import { mapById } from "../../lib/dashboard.js";
import {
  compactText,
  formatDate,
  normalizeContentType,
  normalizePublicationStatus,
  publicationStatusTone
} from "../../lib/format.js";

const OPCOES_TIPO_CONTEUDO = [
  { value: "1", label: "Texto" },
  { value: "2", label: "PDF" },
  { value: "3", label: "Video" },
  { value: "4", label: "Link externo" }
];

const OPCOES_STATUS_PUBLICACAO = [
  { value: "1", label: "Rascunho" },
  { value: "2", label: "Publicado" },
  { value: "3", label: "Arquivado" }
];

function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SecaoConteudosProfessor({
  conteudos,
  solicitacaoNovoConteudo = 0,
  cursos,
  modulos,
  onRefresh,
  onSessionExpired,
  mostrarCardConteudosPublicados = true,
  mostrarCardVinculosEnsino = true,
  turmas,
  usuario
}) {
  const [dadosFormularioConteudo, setDadosFormularioConteudo] = useState(() => criarEstadoInicialFormularioConteudo([], []));
  const [conteudoEmEdicaoId, setConteudoEmEdicaoId] = useState(null);
  const [mensagemFormulario, setMensagemFormulario] = useState({ tone: "", message: "" });
  const [mensagemTabela, setMensagemTabela] = useState({ tone: "", message: "" });
  const [salvandoConteudo, setSalvandoConteudo] = useState(false);
  const [idsConteudosSelecionados, setIdsConteudosSelecionados] = useState([]);
  const [formularioConteudoAberto, setFormularioConteudoAberto] = useState(false);
  const [buscaConteudo, setBuscaConteudo] = useState("");
  const [filtroCursoConteudo, setFiltroCursoConteudo] = useState("todos");
  const [filtroTurmaConteudo, setFiltroTurmaConteudo] = useState("todos");
  const [filtroStatusConteudo, setFiltroStatusConteudo] = useState("todos");

  const cursoPorId = useMemo(() => mapById(cursos), [cursos]);

  const turmasDoProfessor = useMemo(
    () =>
      [...turmas]
        .filter((turma) => turma.professorId === usuario.id)
        .sort((left, right) => {
          const leftCourse = cursoPorId.get(left.cursoId)?.titulo || "";
          const rightCourse = cursoPorId.get(right.cursoId)?.titulo || "";
          const courseComparison = leftCourse.localeCompare(rightCourse, "pt-BR");

          if (courseComparison !== 0) {
            return courseComparison;
          }

          return left.nomeTurma.localeCompare(right.nomeTurma, "pt-BR");
        }),
    [cursoPorId, turmas, usuario.id]
  );

  const modulosDoProfessor = useMemo(
    () =>
      [...modulos]
        .filter((modulo) => turmasDoProfessor.some((turma) => turma.cursoId === modulo.cursoId))
        .sort((left, right) => {
          const leftCourse = cursoPorId.get(left.cursoId)?.titulo || "";
          const rightCourse = cursoPorId.get(right.cursoId)?.titulo || "";
          const courseComparison = leftCourse.localeCompare(rightCourse, "pt-BR");

          if (courseComparison !== 0) {
            return courseComparison;
          }

          return left.titulo.localeCompare(right.titulo, "pt-BR");
        }),
    [cursoPorId, modulos, turmasDoProfessor]
  );

  const modulosPorCursoId = useMemo(() => {
    const modulosAgrupados = new Map();

    modulosDoProfessor.forEach((modulo) => {
      const modulosAtuais = modulosAgrupados.get(modulo.cursoId) || [];
      modulosAtuais.push(modulo);
      modulosAgrupados.set(modulo.cursoId, modulosAtuais);
    });

    return modulosAgrupados;
  }, [modulosDoProfessor]);

  const linhasVinculosEnsino = useMemo(
    () =>
      [...turmasDoProfessor]
        .sort((left, right) => {
          const leftCourse = cursoPorId.get(left.cursoId)?.titulo || "";
          const rightCourse = cursoPorId.get(right.cursoId)?.titulo || "";
          const courseComparison = leftCourse.localeCompare(rightCourse, "pt-BR");

          if (courseComparison !== 0) {
            return courseComparison;
          }

          return (left.nomeTurma || "").localeCompare(right.nomeTurma || "", "pt-BR");
        })
        .map((turma) => {
          const curso = cursoPorId.get(turma.cursoId) || null;
          const modulosDaTurma = modulosPorCursoId.get(turma.cursoId) || [];

          return {
            id: turma.id,
            curso,
            turma,
            modulos: modulosDaTurma
          };
        }),
    [cursoPorId, modulosPorCursoId, turmasDoProfessor]
  );

  useEffect(() => {
    if (conteudoEmEdicaoId || dadosFormularioConteudo.turmaId || !turmasDoProfessor.length) {
      return;
    }

    setDadosFormularioConteudo(criarEstadoInicialFormularioConteudo(turmasDoProfessor, modulosDoProfessor));
  }, [conteudoEmEdicaoId, dadosFormularioConteudo.turmaId, modulosDoProfessor, turmasDoProfessor]);

  const turmaSelecionada = useMemo(
    () => turmasDoProfessor.find((turma) => String(turma.id) === dadosFormularioConteudo.turmaId) || null,
    [dadosFormularioConteudo.turmaId, turmasDoProfessor]
  );

  const modulosDisponiveis = useMemo(() => {
    if (!turmaSelecionada) {
      return [];
    }

    return modulosPorCursoId.get(turmaSelecionada.cursoId) || [];
  }, [modulosPorCursoId, turmaSelecionada]);

  useEffect(() => {
    if (!turmaSelecionada || conteudoEmEdicaoId) {
      return;
    }

    if (!modulosDisponiveis.length && dadosFormularioConteudo.moduloId) {
      setDadosFormularioConteudo((current) => ({
        ...current,
        moduloId: ""
      }));
      return;
    }

    const hasCurrentModule = modulosDisponiveis.some((modulo) => String(modulo.id) === dadosFormularioConteudo.moduloId);
    if (!hasCurrentModule && modulosDisponiveis[0]) {
      setDadosFormularioConteudo((current) => ({
        ...current,
        moduloId: String(modulosDisponiveis[0].id)
      }));
    }
  }, [modulosDisponiveis, conteudoEmEdicaoId, dadosFormularioConteudo.moduloId, turmaSelecionada]);

  const tituloCursoSelecionado = turmaSelecionada
    ? cursoPorId.get(turmaSelecionada.cursoId)?.titulo || `Curso #${turmaSelecionada.cursoId}`
    : "";
  const termoBuscaConteudo = useMemo(() => normalizarBusca(buscaConteudo), [buscaConteudo]);

  const linhasConteudosOrdenadas = useMemo(
    () =>
      [...conteudos].sort((left, right) => {
        const leftCourse = left.cursoTitulo || "";
        const rightCourse = right.cursoTitulo || "";
        const courseComparison = leftCourse.localeCompare(rightCourse, "pt-BR");

        if (courseComparison !== 0) {
          return courseComparison;
        }

        const turmaComparison = (left.turmaNome || "").localeCompare(right.turmaNome || "", "pt-BR");
        if (turmaComparison !== 0) {
          return turmaComparison;
        }

        const moduloComparison = (left.moduloTitulo || "").localeCompare(right.moduloTitulo || "", "pt-BR");
        if (moduloComparison !== 0) {
          return moduloComparison;
        }

        if (left.ordemExibicao !== right.ordemExibicao) {
          return left.ordemExibicao - right.ordemExibicao;
        }

        return left.titulo.localeCompare(right.titulo, "pt-BR");
      }),
    [conteudos]
  );
  const cursosDosConteudos = useMemo(() => {
    const cursosMapeados = new Map();

    turmasDoProfessor.forEach((turma) => {
      const curso = cursoPorId.get(turma.cursoId);
      cursosMapeados.set(turma.cursoId, curso || { id: turma.cursoId, titulo: `Curso #${turma.cursoId}` });
    });

    return [...cursosMapeados.values()].sort((left, right) => left.titulo.localeCompare(right.titulo, "pt-BR"));
  }, [cursoPorId, turmasDoProfessor]);
  const turmasFiltradasPorCurso = useMemo(() => {
    if (filtroCursoConteudo === "todos") {
      return turmasDoProfessor;
    }

    const cursoId = Number(filtroCursoConteudo);
    return turmasDoProfessor.filter((turma) => Number(turma.cursoId) === cursoId);
  }, [filtroCursoConteudo, turmasDoProfessor]);
  const linhasConteudos = useMemo(() => {
    let proximasLinhas = linhasConteudosOrdenadas;

    if (filtroCursoConteudo !== "todos") {
      const cursoId = Number(filtroCursoConteudo);
      proximasLinhas = proximasLinhas.filter((row) => Number(row.cursoId) === cursoId);
    }

    if (filtroTurmaConteudo !== "todos") {
      const turmaId = Number(filtroTurmaConteudo);
      proximasLinhas = proximasLinhas.filter((row) => Number(row.turmaId) === turmaId);
    }

    if (filtroStatusConteudo !== "todos") {
      proximasLinhas = proximasLinhas.filter((row) => String(row.statusPublicacao ?? "") === filtroStatusConteudo);
    }

    if (!termoBuscaConteudo) {
      return proximasLinhas;
    }

    return proximasLinhas.filter((row) => {
      const campos = [
        row.titulo,
        row.descricao,
        row.corpoTexto,
        row.linkUrl,
        row.arquivoUrl,
        row.turmaNome,
        row.cursoTitulo,
        row.moduloTitulo,
        normalizeContentType(row.tipoConteudo),
        normalizePublicationStatus(row.statusPublicacao),
        formatDate(row.publicadoEm)
      ];

      return campos.some((campo) => normalizarBusca(campo).includes(termoBuscaConteudo));
    });
  }, [
    filtroCursoConteudo,
    filtroStatusConteudo,
    filtroTurmaConteudo,
    linhasConteudosOrdenadas,
    termoBuscaConteudo
  ]);
  const temFiltroConteudoAtivo = Boolean(
    termoBuscaConteudo ||
      filtroCursoConteudo !== "todos" ||
      filtroTurmaConteudo !== "todos" ||
      filtroStatusConteudo !== "todos"
  );

  const linhasConteudosSelecionadas = useMemo(
    () => linhasConteudos.filter((row) => idsConteudosSelecionados.includes(row.id)),
    [idsConteudosSelecionados, linhasConteudos]
  );

  const todosConteudosSelecionados =
    linhasConteudos.length > 0 && linhasConteudos.every((row) => idsConteudosSelecionados.includes(row.id));

  useEffect(() => {
    setIdsConteudosSelecionados((current) =>
      current.filter((id) => linhasConteudos.some((row) => row.id === id))
    );
  }, [linhasConteudos]);

  const resumoConteudos = useMemo(() => {
    const totalPublicados = conteudos.filter(
      (item) => normalizePublicationStatus(item.statusPublicacao) === "Publicado"
    ).length;
    const totalRascunhos = conteudos.filter(
      (item) => normalizePublicationStatus(item.statusPublicacao) === "Rascunho"
    ).length;
    const totalArquivados = conteudos.filter(
      (item) => normalizePublicationStatus(item.statusPublicacao) === "Arquivado"
    ).length;

    return [
      `${turmasDoProfessor.length} turma(s)`,
      `${modulosDoProfessor.length} modulo(s)`,
      `${conteudos.length} conteudo(s)`,
      `${totalPublicados} publicado(s)`,
      `${totalRascunhos} rascunho(s)`,
      `${totalArquivados} arquivado(s)`
    ];
  }, [conteudos, modulosDoProfessor.length, turmasDoProfessor.length]);

  const tipoConteudoSelecionado = Number(dadosFormularioConteudo.tipoConteudo || OPCOES_TIPO_CONTEUDO[0].value);
  const exigeTexto = tipoConteudoSelecionado === 1;
  const exigeUrlPdf = tipoConteudoSelecionado === 2;
  const exigeUrlRecurso = tipoConteudoSelecionado === 3 || tipoConteudoSelecionado === 4;

  useEffect(() => {
    if (!formularioConteudoAberto) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !salvandoConteudo) {
        setFormularioConteudoAberto(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [formularioConteudoAberto, salvandoConteudo]);

  useEffect(() => {
    if (solicitacaoNovoConteudo > 0) {
      abrirFormularioNovoConteudo();
    }
  }, [solicitacaoNovoConteudo]);

  function limparFormularioConteudo() {
    setConteudoEmEdicaoId(null);
    setDadosFormularioConteudo(criarEstadoInicialFormularioConteudo(turmasDoProfessor, modulosDoProfessor));
    setMensagemFormulario({ tone: "", message: "" });
  }

  function abrirFormularioNovoConteudo() {
    limparFormularioConteudo();
    setIdsConteudosSelecionados([]);
    setMensagemTabela({ tone: "", message: "" });
    setFormularioConteudoAberto(true);
  }

  function fecharFormularioConteudo() {
    if (salvandoConteudo) {
      return;
    }

    limparFormularioConteudo();
    setFormularioConteudoAberto(false);
  }

  function atualizarCampoFormularioConteudo(event) {
    const { name, value } = event.target;

    if (name === "turmaId") {
      const nextTurma = turmasDoProfessor.find((turma) => String(turma.id) === value) || null;
      const nextModules = nextTurma ? modulosPorCursoId.get(nextTurma.cursoId) || [] : [];

      setDadosFormularioConteudo((current) => ({
        ...current,
        turmaId: value,
        moduloId: nextModules.some((modulo) => String(modulo.id) === current.moduloId)
          ? current.moduloId
          : nextModules[0]
            ? String(nextModules[0].id)
            : ""
      }));
      return;
    }

    setDadosFormularioConteudo((current) => ({
      ...current,
      [name]: value
    }));
  }

  function abrirEdicaoConteudo(conteudo) {
    setConteudoEmEdicaoId(conteudo.id);
    setIdsConteudosSelecionados([conteudo.id]);
    setMensagemTabela({ tone: "", message: "" });
    setDadosFormularioConteudo({
      turmaId: String(conteudo.turmaId),
      moduloId: String(conteudo.moduloId),
      titulo: conteudo.titulo || "",
      descricao: conteudo.descricao || "",
      tipoConteudo: String(conteudo.tipoConteudo || 1),
      corpoTexto: conteudo.corpoTexto || "",
      arquivoUrl: conteudo.arquivoUrl || "",
      linkUrl: conteudo.linkUrl || "",
      statusPublicacao: String(conteudo.statusPublicacao || 1),
      ordemExibicao: String(conteudo.ordemExibicao ?? 0),
      pesoProgresso: String(conteudo.pesoProgresso ?? 1)
    });
    setMensagemFormulario({ tone: "", message: "" });
    setFormularioConteudoAberto(true);
  }

  async function salvarConteudoDidatico(event) {
    event.preventDefault();

    const tituloNormalizado = dadosFormularioConteudo.titulo.trim();
    const dadosEnvio = {
      titulo: tituloNormalizado,
      descricao: dadosFormularioConteudo.descricao.trim(),
      tipoConteudo: Number(dadosFormularioConteudo.tipoConteudo),
      corpoTexto: exigeTexto ? dadosFormularioConteudo.corpoTexto.trim() : "",
      arquivoUrl: exigeUrlPdf ? dadosFormularioConteudo.arquivoUrl.trim() : "",
      linkUrl: exigeUrlRecurso ? dadosFormularioConteudo.linkUrl.trim() : "",
      turmaId: Number(dadosFormularioConteudo.turmaId),
      moduloId: Number(dadosFormularioConteudo.moduloId),
      statusPublicacao: Number(dadosFormularioConteudo.statusPublicacao),
      ordemExibicao: Number(dadosFormularioConteudo.ordemExibicao),
      pesoProgresso: Number(dadosFormularioConteudo.pesoProgresso)
    };

    if (!turmasDoProfessor.length) {
      setMensagemFormulario({ tone: "error", message: "Seu perfil ainda nao possui turmas para publicacao." });
      return;
    }

    if (!modulosDisponiveis.length) {
      setMensagemFormulario({ tone: "error", message: "Nao existem modulos disponiveis para a turma selecionada." });
      return;
    }

    if (!tituloNormalizado) {
      setMensagemFormulario({ tone: "error", message: "Informe o titulo do conteudo antes de salvar." });
      return;
    }

    if (!dadosEnvio.turmaId) {
      setMensagemFormulario({ tone: "error", message: "Selecione a turma que vai receber o conteudo." });
      return;
    }

    if (!dadosEnvio.moduloId) {
      setMensagemFormulario({ tone: "error", message: "Selecione um modulo para organizar a publicacao." });
      return;
    }

    if (!Number.isInteger(dadosEnvio.ordemExibicao) || dadosEnvio.ordemExibicao < 0) {
      setMensagemFormulario({ tone: "error", message: "Use um numero inteiro igual ou maior que zero para a ordem." });
      return;
    }

    if (!Number.isFinite(dadosEnvio.pesoProgresso) || dadosEnvio.pesoProgresso <= 0) {
      setMensagemFormulario({ tone: "error", message: "Informe um peso de progresso maior que zero." });
      return;
    }

    if (exigeTexto && !dadosEnvio.corpoTexto) {
      setMensagemFormulario({ tone: "error", message: "Preencha o texto principal do conteudo." });
      return;
    }

    if (exigeUrlPdf && !dadosEnvio.arquivoUrl) {
      setMensagemFormulario({ tone: "error", message: "Informe a URL do PDF antes de publicar." });
      return;
    }

    if (exigeUrlRecurso && !dadosEnvio.linkUrl) {
      setMensagemFormulario({ tone: "error", message: "Informe a URL do recurso antes de publicar." });
      return;
    }

    setSalvandoConteudo(true);
    setMensagemFormulario({ tone: "", message: "" });

    try {
      const mensagemSucesso = conteudoEmEdicaoId ? "Conteudo atualizado com sucesso." : "Conteudo criado com sucesso.";

      if (conteudoEmEdicaoId) {
        await apiRequest(`/ConteudosDidaticos/${conteudoEmEdicaoId}`, {
          method: "PUT",
          body: JSON.stringify(dadosEnvio)
        });
      } else {
        await apiRequest("/ConteudosDidaticos", {
          method: "POST",
          body: JSON.stringify(dadosEnvio)
        });
      }

      setConteudoEmEdicaoId(null);
      setDadosFormularioConteudo(criarEstadoInicialFormularioConteudo(turmasDoProfessor, modulosDoProfessor));
      setIdsConteudosSelecionados([]);
      setMensagemFormulario({ tone: "", message: "" });
      setMensagemTabela({ tone: "success", message: mensagemSucesso });
      setFormularioConteudoAberto(false);
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setMensagemFormulario({
        tone: "error",
        message: err.message || "Nao foi possivel salvar o conteudo agora."
      });
    } finally {
      setSalvandoConteudo(false);
    }
  }

  function alternarSelecaoConteudo(conteudoId) {
    setIdsConteudosSelecionados((current) =>
      current.includes(conteudoId) ? current.filter((id) => id !== conteudoId) : [...current, conteudoId]
    );
  }

  function alternarSelecaoTodosConteudos() {
    if (salvandoConteudo || !linhasConteudos.length) {
      return;
    }

    setIdsConteudosSelecionados((current) =>
      linhasConteudos.every((row) => current.includes(row.id)) ? [] : linhasConteudos.map((row) => row.id)
    );
  }

  function editarConteudoSelecionado() {
    if (linhasConteudosSelecionadas.length !== 1) {
      return;
    }

    abrirEdicaoConteudo(linhasConteudosSelecionadas[0]);
  }

  async function excluirConteudosSelecionados(linhasParaExcluir = linhasConteudosSelecionadas) {
    if (!linhasParaExcluir.length) {
      return;
    }

    const exclusaoConfirmada = window.confirm(
      linhasParaExcluir.length === 1
        ? `Deseja excluir o conteudo "${linhasParaExcluir[0].titulo}"?`
        : `Deseja excluir ${linhasParaExcluir.length} conteudos selecionados?`
    );

    if (!exclusaoConfirmada) {
      return;
    }

    setSalvandoConteudo(true);
    setMensagemFormulario({ tone: "", message: "" });
    setMensagemTabela({ tone: "", message: "" });

    try {
      for (const conteudo of linhasParaExcluir) {
        await apiRequest(`/ConteudosDidaticos/${conteudo.id}`, { method: "DELETE" });
      }

      if (conteudoEmEdicaoId && linhasParaExcluir.some((conteudo) => conteudo.id === conteudoEmEdicaoId)) {
        limparFormularioConteudo();
      }

      setIdsConteudosSelecionados((current) =>
        current.filter((id) => !linhasParaExcluir.some((conteudo) => conteudo.id === id))
      );
      setMensagemTabela({
        tone: "success",
        message:
          linhasParaExcluir.length === 1
            ? "Conteudo excluido com sucesso."
            : `${linhasParaExcluir.length} conteudos foram excluidos com sucesso.`
      });
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setMensagemTabela({
        tone: "error",
        message: err.message || "Nao foi possivel excluir os conteudos selecionados agora."
      });
    } finally {
      setSalvandoConteudo(false);
    }
  }

  function alterarFiltroCursoConteudo(event) {
    setFiltroCursoConteudo(event.target.value);
    setFiltroTurmaConteudo("todos");
  }

  function limparFiltrosConteudos() {
    setBuscaConteudo("");
    setFiltroCursoConteudo("todos");
    setFiltroTurmaConteudo("todos");
    setFiltroStatusConteudo("todos");
  }

  function renderBarraFiltrosConteudos() {
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
              aria-label="Buscar conteudos"
              className="table-inline-input table-inline-input--search"
              onChange={(event) => setBuscaConteudo(event.target.value)}
              placeholder="Pesquisar conteudos"
              type="search"
              value={buscaConteudo}
            />
          </label>
          <select
            aria-label="Filtrar conteudos por curso"
            className="table-inline-select"
            onChange={alterarFiltroCursoConteudo}
            value={filtroCursoConteudo}
          >
            <option value="todos">Todos os cursos</option>
            {cursosDosConteudos.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.titulo}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar conteudos por turma"
            className="table-inline-select"
            onChange={(event) => setFiltroTurmaConteudo(event.target.value)}
            value={filtroTurmaConteudo}
          >
            <option value="todos">Todas as turmas</option>
            {turmasFiltradasPorCurso.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nomeTurma}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar conteudos por status"
            className="table-inline-select"
            onChange={(event) => setFiltroStatusConteudo(event.target.value)}
            value={filtroStatusConteudo}
          >
            <option value="todos">Todos os status</option>
            {OPCOES_STATUS_PUBLICACAO.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="table-action" disabled={!temFiltroConteudoAtivo} onClick={limparFiltrosConteudos} type="button">
            Limpar filtros
          </button>
        </div>
        <p className="table-toolbar__summary">
          {linhasConteudos.length} de {conteudos.length} conteudo{conteudos.length === 1 ? "" : "s"}
        </p>
      </div>
    );
  }

  return (
    <div className="content-section">
      <section className="content-section__intro">
        <div className="content-section__intro-copy">
          <span className="eyebrow">Operacao de conteudos</span>
          <h2>Publicacao por turma e modulo</h2>
          <p>Uma visao mais direta para consultar vinculos, cadastrar materiais e organizar a trilha do professor.</p>
        </div>
        <div className="content-section__highlights" aria-label="Resumo de conteudos">
          {resumoConteudos.map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      {mostrarCardVinculosEnsino ? (
        <PanelCard
          description="Cursos, turmas padrao e modulos disponiveis para publicacao no seu login."
          title="Seus vinculos de ensino"
        >
          <DataTable
            columns={[
              {
                key: "curso",
                label: "Curso",
                render: (row) => (
                  <div className="table-cell-stack">
                    <strong>{row.curso?.titulo || `Curso #${row.turma.cursoId}`}</strong>
                    <p>{row.modulos.length} modulo(s) disponivel(is) para esta turma</p>
                  </div>
                )
              },
              {
                key: "turma",
                label: "Turma",
                render: (row) => (
                  <div className="table-cell-stack">
                    <strong>{row.turma.nomeTurma}</strong>
                  </div>
                )
              },
              {
                key: "modulos",
                label: "Modulos",
                render: (row) =>
                  row.modulos.length ? (
                    <div className="table-badge-list">
                      {row.modulos.map((modulo) => (
                        <span className="chip" key={modulo.id}>
                          {modulo.titulo}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>-</span>
                  )
              }
            ]}
            emptyMessage="Nenhum vinculo academico encontrado para o professor autenticado."
            rows={linhasVinculosEnsino}
          />
        </PanelCard>
      ) : null}

      {formularioConteudoAberto ? (
        <div
          className="content-form-modal"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharFormularioConteudo();
            }
          }}
        >
          <div
            aria-label={conteudoEmEdicaoId ? "Editar conteudo didatico" : "Novo conteudo didatico"}
            aria-modal="true"
            className="content-form-modal__card"
            role="dialog"
          >
            <button
              className="content-form-modal__close"
              disabled={salvandoConteudo}
              onClick={fecharFormularioConteudo}
              type="button"
            >
              Fechar
            </button>
      <PanelCard
        description="Cadastre ou ajuste materiais ligados a uma turma e a um modulo."
        title={conteudoEmEdicaoId ? "Editar conteudo didatico" : "Novo conteudo didatico"}
      >
        {!turmasDoProfessor.length ? (
          <InlineMessage tone="info">
            Seu usuario ainda nao possui turmas atribuidas. Assim que uma turma for vinculada ao seu perfil, a publicacao fica disponivel aqui.
          </InlineMessage>
        ) : !modulosDoProfessor.length ? (
          <InlineMessage tone="info">
            As suas turmas ja existem, mas ainda nao ha modulos cadastrados nos cursos correspondentes. Peca ao time de coordenacao para estruturar os modulos antes de publicar.
          </InlineMessage>
        ) : (
          <form className="management-form" onSubmit={salvarConteudoDidatico}>
            <div className="management-form__grid">
              <label className="management-field">
                <span>Turma</span>
                <select
                  disabled={salvandoConteudo || !turmasDoProfessor.length}
                  name="turmaId"
                  onChange={atualizarCampoFormularioConteudo}
                  value={dadosFormularioConteudo.turmaId}
                >
                  {turmasDoProfessor.map((turma) => (
                    <option key={turma.id} value={turma.id}>
                      {turma.nomeTurma}
                    </option>
                  ))}
                </select>
                {tituloCursoSelecionado ? <small>Curso vinculado: {tituloCursoSelecionado}</small> : null}
              </label>

              <label className="management-field">
                <span>Modulo</span>
                <select
                  disabled={salvandoConteudo || !modulosDisponiveis.length}
                  key={dadosFormularioConteudo.turmaId || "sem-turma"}
                  name="moduloId"
                  onChange={atualizarCampoFormularioConteudo}
                  value={dadosFormularioConteudo.moduloId}
                >
                  {!modulosDisponiveis.length ? <option value="">Nenhum modulo disponivel</option> : null}
                  {modulosDisponiveis.map((modulo) => (
                    <option key={modulo.id} value={modulo.id}>
                      {modulo.titulo}
                    </option>
                  ))}
                </select>
                {tituloCursoSelecionado ? <small>Mostrando modulos do curso: {tituloCursoSelecionado}</small> : null}
              </label>

              <label className="management-field">
                <span>Tipo de conteudo</span>
                <select
                  disabled={salvandoConteudo}
                  name="tipoConteudo"
                  onChange={atualizarCampoFormularioConteudo}
                  value={dadosFormularioConteudo.tipoConteudo}
                >
                  {OPCOES_TIPO_CONTEUDO.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small>Escolha como esse material sera entregue para a turma.</small>
              </label>

              <label className="management-field">
                <span>Status</span>
                <select
                  disabled={salvandoConteudo}
                  name="statusPublicacao"
                  onChange={atualizarCampoFormularioConteudo}
                  value={dadosFormularioConteudo.statusPublicacao}
                >
                  {OPCOES_STATUS_PUBLICACAO.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small>Defina se o item fica em rascunho, publicado ou arquivado.</small>
              </label>

              <label className="management-field management-field--wide">
                <span>Titulo</span>
                <input
                  autoComplete="off"
                  disabled={salvandoConteudo}
                  maxLength={180}
                  name="titulo"
                  onChange={atualizarCampoFormularioConteudo}
                  placeholder="Ex.: Aula 01 - Panorama do modulo"
                  type="text"
                  value={dadosFormularioConteudo.titulo}
                />
              </label>

              <label className="management-field management-field--wide">
                <span>Descricao curta</span>
                <textarea
                  disabled={salvandoConteudo}
                  maxLength={500}
                  name="descricao"
                  onChange={atualizarCampoFormularioConteudo}
                  placeholder="Explique rapidamente o objetivo desse material para a turma."
                  value={dadosFormularioConteudo.descricao}
                />
              </label>

              {exigeTexto ? (
                <label className="management-field management-field--wide">
                  <span>Corpo do texto</span>
                  <textarea
                    disabled={salvandoConteudo}
                    name="corpoTexto"
                    onChange={atualizarCampoFormularioConteudo}
                    placeholder="Escreva aqui o material principal que sera exibido para os alunos."
                    value={dadosFormularioConteudo.corpoTexto}
                  />
                </label>
              ) : null}

              {exigeUrlPdf ? (
                <label className="management-field management-field--wide">
                  <span>URL do PDF</span>
                  <input
                    autoComplete="off"
                    disabled={salvandoConteudo}
                    name="arquivoUrl"
                    onChange={atualizarCampoFormularioConteudo}
                    placeholder="https://..."
                    type="url"
                    value={dadosFormularioConteudo.arquivoUrl}
                  />
                  <small>Use um link direto para o arquivo que a turma deve abrir ou baixar.</small>
                </label>
              ) : null}

              {exigeUrlRecurso ? (
                <label className="management-field management-field--wide">
                  <span>{tipoConteudoSelecionado === 3 ? "URL do video" : "URL do recurso"}</span>
                  <input
                    autoComplete="off"
                    disabled={salvandoConteudo}
                    name="linkUrl"
                    onChange={atualizarCampoFormularioConteudo}
                    placeholder="https://..."
                    type="url"
                    value={dadosFormularioConteudo.linkUrl}
                  />
                  <small>
                    {tipoConteudoSelecionado === 3
                      ? "Cole o link do video ou da aula gravada."
                      : "Cole o link externo que deve complementar o modulo."}
                  </small>
                </label>
              ) : null}

              <label className="management-field">
                <span>Ordem de exibicao</span>
                <input
                  disabled={salvandoConteudo}
                  min="0"
                  name="ordemExibicao"
                  onChange={atualizarCampoFormularioConteudo}
                  type="number"
                  value={dadosFormularioConteudo.ordemExibicao}
                />
                <small>Controla a sequencia em que o conteudo aparece no modulo.</small>
              </label>

              <label className="management-field">
                <span>Peso de progresso</span>
                <input
                  disabled={salvandoConteudo}
                  min="0.01"
                  name="pesoProgresso"
                  onChange={atualizarCampoFormularioConteudo}
                  step="0.01"
                  type="number"
                  value={dadosFormularioConteudo.pesoProgresso}
                />
                <small>Define quanto este item pesa no avanco pedagogico do aluno.</small>
              </label>
            </div>

            {mensagemFormulario.message ? <InlineMessage tone={mensagemFormulario.tone}>{mensagemFormulario.message}</InlineMessage> : null}

            <div className="management-form__actions">
              <button
                className="solid-button"
                disabled={salvandoConteudo || !turmasDoProfessor.length || !modulosDisponiveis.length}
                type="submit"
              >
                {salvandoConteudo ? "Salvando..." : conteudoEmEdicaoId ? "Salvar alteracoes" : "Criar conteudo"}
              </button>

              <button
                className="button button--secondary exit-button"
                disabled={salvandoConteudo}
                onClick={fecharFormularioConteudo}
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
      ) : null}

      {mostrarCardConteudosPublicados ? (
        <div className="content-section__block content-section__block--published">
        <PanelCard
          description="Selecione itens para editar ou excluir e acompanhe a organizacao por turma e modulo."
          title="Conteudos publicados e rascunhos"
        >
          {renderBarraFiltrosConteudos()}

          <div className="table-toolbar">
            <div className="table-actions">
              <button
                className="table-action"
                disabled={salvandoConteudo || linhasConteudosSelecionadas.length !== 1}
                onClick={editarConteudoSelecionado}
                type="button"
              >
                Editar
              </button>
              <button
                className="table-action table-action--danger"
                disabled={salvandoConteudo || !linhasConteudosSelecionadas.length}
                onClick={() => excluirConteudosSelecionados()}
                type="button"
              >
                Excluir
              </button>
            </div>
            <p className="table-toolbar__summary">
              {linhasConteudosSelecionadas.length
                ? `${linhasConteudosSelecionadas.length} conteudo(s) selecionado(s).`
                : "Selecione um ou mais conteudos visiveis pela caixa ao lado esquerdo."}
            </p>
          </div>

          {mensagemTabela.message ? <InlineMessage tone={mensagemTabela.tone}>{mensagemTabela.message}</InlineMessage> : null}

          <DataTable
            columns={[
              {
                key: "selecionar",
                label: (
                  <div className="table-select-cell">
                    <input
                      aria-label={todosConteudosSelecionados ? "Desmarcar todos os conteudos" : "Selecionar todos os conteudos"}
                      checked={todosConteudosSelecionados}
                      className="table-select-input"
                      disabled={salvandoConteudo || !linhasConteudos.length}
                      onChange={alternarSelecaoTodosConteudos}
                      type="checkbox"
                    />
                  </div>
                ),
                render: (row) => (
                  <div className="table-select-cell">
                    <input
                      aria-label={`Selecionar conteudo ${row.titulo}`}
                      checked={idsConteudosSelecionados.includes(row.id)}
                      className="table-select-input"
                      disabled={salvandoConteudo}
                      onChange={() => alternarSelecaoConteudo(row.id)}
                      type="checkbox"
                    />
                  </div>
                )
              },
              {
                key: "titulo",
                label: "Conteudo",
                render: (row) => (
                  <div className="table-cell-stack">
                    <strong>{row.titulo}</strong>
                    <p>{compactText(row.descricao || row.corpoTexto || row.linkUrl || row.arquivoUrl || "-", 96)}</p>
                  </div>
                )
              },
              {
                key: "turmaNome",
                label: "Turma",
                render: (row) => (
                  <div className="table-cell-stack">
                    <strong>{row.turmaNome || `Turma #${row.turmaId}`}</strong>
                    <p>{row.cursoTitulo || `Curso #${row.cursoId}`}</p>
                  </div>
                )
              },
              { key: "moduloTitulo", label: "Modulo" },
              {
                key: "tipoConteudo",
                label: "Formato",
                render: (row) => <span className="chip">{normalizeContentType(row.tipoConteudo)}</span>
              },
              {
                key: "statusPublicacao",
                label: "Status",
                render: (row) => (
                  <div className="table-cell-stack">
                    <StatusPill tone={publicationStatusTone(row.statusPublicacao)}>
                      {normalizePublicationStatus(row.statusPublicacao)}
                    </StatusPill>
                    <p>{row.publicadoEm ? `Publicado em ${formatDate(row.publicadoEm)}` : "Ainda nao publicado"}</p>
                  </div>
                )
              },
              { key: "ordemExibicao", label: "Ordem" },
              {
                key: "pesoProgresso",
                label: "Progresso",
                render: (row) => Number(row.pesoProgresso || 0).toFixed(2).replace(".", ",")
              }
            ]}
            emptyMessage={
              temFiltroConteudoAtivo
                ? "Nenhum conteudo encontrado com os filtros aplicados."
                : "Nenhum conteudo cadastrado ainda."
            }
            rows={linhasConteudos}
          />
        </PanelCard>
        </div>
      ) : null}
    </div>
  );
}

function criarEstadoInicialFormularioConteudo(turmas, modulos, overrides = {}) {
  const primeiraTurma = turmas[0] || null;
  const modulosDaPrimeiraTurma = primeiraTurma
    ? modulos.filter((modulo) => modulo.cursoId === primeiraTurma.cursoId)
    : [];

  return {
    turmaId: primeiraTurma ? String(primeiraTurma.id) : "",
    moduloId: modulosDaPrimeiraTurma[0] ? String(modulosDaPrimeiraTurma[0].id) : "",
    titulo: "",
    descricao: "",
    tipoConteudo: OPCOES_TIPO_CONTEUDO[0].value,
    corpoTexto: "",
    arquivoUrl: "",
    linkUrl: "",
    statusPublicacao: OPCOES_STATUS_PUBLICACAO[0].value,
    ordemExibicao: "0",
    pesoProgresso: "1",
    ...overrides
  };
}
