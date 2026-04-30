import { useEffect, useMemo, useState } from "react";
import { DataTable, InlineMessage, PanelCard, StatusPill } from "../../components/Primitives.jsx";
import { ApiError, apiRequest } from "../../lib/api.js";
import { mapById } from "../../lib/dashboard.js";
import {
  compactText,
  formatDate,
  normalizePublicationStatus,
  parseApiDate,
  publicationStatusTone
} from "../../lib/format.js";

const OPCOES_TIPO_AVALIACAO = [
  { value: "1", label: "Quiz" },
  { value: "2", label: "Prova" },
  { value: "3", label: "Exercicio" }
];

const OPCOES_STATUS_PUBLICACAO = [
  { value: "1", label: "Rascunho" },
  { value: "2", label: "Publicado" },
  { value: "3", label: "Arquivado" }
];

const OPCOES_TIPO_QUESTAO = [
  { value: "1", label: "Multipla escolha" },
  { value: "2", label: "Verdadeiro/Falso" },
  { value: "3", label: "Discursiva" }
];

const ALTERNATIVAS_MULTIPLA_ESCOLHA = ["A", "B", "C", "D"];

function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeEvaluationType(type) {
  const labels = {
    1: "Quiz",
    2: "Prova",
    3: "Exercicio"
  };

  if (typeof type === "number") {
    return labels[type] || "Desconhecido";
  }

  return type || "Desconhecido";
}

function normalizeQuestionType(type) {
  const labels = {
    1: "Multipla escolha",
    2: "Verdadeiro/Falso",
    3: "Discursiva"
  };

  if (typeof type === "number") {
    return labels[type] || "Desconhecido";
  }

  return type || "Desconhecido";
}

function formatDecimal(value) {
  return Number(value || 0).toFixed(2).replace(".", ",");
}

function toDatetimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const parsed = parseApiDate(value);
  if (!parsed) {
    return "";
  }

  const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function toIsoOrNull(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function SecaoAvaliacoesProfessor({
  avaliacoes,
  cursos,
  modulos,
  onRefresh,
  onSessionExpired,
  solicitacaoNovaAvaliacao = 0,
  turmas,
  usuario
}) {
  const [dadosFormularioAvaliacao, setDadosFormularioAvaliacao] = useState(() =>
    criarEstadoInicialFormularioAvaliacao([], [])
  );
  const [avaliacaoEmEdicaoId, setAvaliacaoEmEdicaoId] = useState(null);
  const [mensagemFormulario, setMensagemFormulario] = useState({ tone: "", message: "" });
  const [mensagemTabela, setMensagemTabela] = useState({ tone: "", message: "" });
  const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false);
  const [idsAvaliacoesSelecionadas, setIdsAvaliacoesSelecionadas] = useState([]);
  const [formularioAvaliacaoAberto, setFormularioAvaliacaoAberto] = useState(false);
  const [buscaAvaliacao, setBuscaAvaliacao] = useState("");
  const [filtroCursoAvaliacao, setFiltroCursoAvaliacao] = useState("todos");
  const [filtroTurmaAvaliacao, setFiltroTurmaAvaliacao] = useState("todos");
  const [filtroStatusAvaliacao, setFiltroStatusAvaliacao] = useState("todos");
  const [filtroTipoAvaliacao, setFiltroTipoAvaliacao] = useState("todos");
  const [avaliacaoEmMontagem, setAvaliacaoEmMontagem] = useState(null);
  const [questoesAvaliacao, setQuestoesAvaliacao] = useState([]);
  const [dadosFormularioQuestao, setDadosFormularioQuestao] = useState(() => criarEstadoInicialFormularioQuestao());
  const [carregandoQuestoes, setCarregandoQuestoes] = useState(false);
  const [salvandoQuestao, setSalvandoQuestao] = useState(false);
  const [mensagemQuestoes, setMensagemQuestoes] = useState({ tone: "", message: "" });

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

  useEffect(() => {
    if (avaliacaoEmEdicaoId || dadosFormularioAvaliacao.turmaId || !turmasDoProfessor.length) {
      return;
    }

    setDadosFormularioAvaliacao(criarEstadoInicialFormularioAvaliacao(turmasDoProfessor, modulosDoProfessor));
  }, [avaliacaoEmEdicaoId, dadosFormularioAvaliacao.turmaId, modulosDoProfessor, turmasDoProfessor]);

  const turmaSelecionada = useMemo(
    () => turmasDoProfessor.find((turma) => String(turma.id) === dadosFormularioAvaliacao.turmaId) || null,
    [dadosFormularioAvaliacao.turmaId, turmasDoProfessor]
  );

  const modulosDisponiveis = useMemo(() => {
    if (!turmaSelecionada) {
      return [];
    }

    return modulosPorCursoId.get(turmaSelecionada.cursoId) || [];
  }, [modulosPorCursoId, turmaSelecionada]);

  useEffect(() => {
    if (!turmaSelecionada || avaliacaoEmEdicaoId) {
      return;
    }

    if (!modulosDisponiveis.length && dadosFormularioAvaliacao.moduloId) {
      setDadosFormularioAvaliacao((current) => ({
        ...current,
        moduloId: ""
      }));
      return;
    }

    const hasCurrentModule = modulosDisponiveis.some(
      (modulo) => String(modulo.id) === dadosFormularioAvaliacao.moduloId
    );

    if (!hasCurrentModule && modulosDisponiveis[0]) {
      setDadosFormularioAvaliacao((current) => ({
        ...current,
        moduloId: String(modulosDisponiveis[0].id)
      }));
    }
  }, [avaliacaoEmEdicaoId, dadosFormularioAvaliacao.moduloId, modulosDisponiveis, turmaSelecionada]);

  useEffect(() => {
    if (!formularioAvaliacaoAberto) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !salvandoAvaliacao) {
        setFormularioAvaliacaoAberto(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [formularioAvaliacaoAberto, salvandoAvaliacao]);

  useEffect(() => {
    if (!avaliacaoEmMontagem) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !salvandoQuestao) {
        fecharMontagemQuestoes();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [avaliacaoEmMontagem, salvandoQuestao]);

  useEffect(() => {
    if (solicitacaoNovaAvaliacao > 0) {
      abrirFormularioNovaAvaliacao();
    }
  }, [solicitacaoNovaAvaliacao]);

  const tituloCursoSelecionado = turmaSelecionada
    ? cursoPorId.get(turmaSelecionada.cursoId)?.titulo || `Curso #${turmaSelecionada.cursoId}`
    : "";

  const termoBuscaAvaliacao = useMemo(() => normalizarBusca(buscaAvaliacao), [buscaAvaliacao]);

  const linhasAvaliacoesOrdenadas = useMemo(
    () =>
      [...avaliacoes].sort((left, right) => {
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

        return (left.titulo || "").localeCompare(right.titulo || "", "pt-BR");
      }),
    [avaliacoes]
  );

  const cursosDasAvaliacoes = useMemo(() => {
    const cursosMapeados = new Map();

    turmasDoProfessor.forEach((turma) => {
      const curso = cursoPorId.get(turma.cursoId);
      cursosMapeados.set(turma.cursoId, curso || { id: turma.cursoId, titulo: `Curso #${turma.cursoId}` });
    });

    return [...cursosMapeados.values()].sort((left, right) => left.titulo.localeCompare(right.titulo, "pt-BR"));
  }, [cursoPorId, turmasDoProfessor]);

  const turmasFiltradasPorCurso = useMemo(() => {
    if (filtroCursoAvaliacao === "todos") {
      return turmasDoProfessor;
    }

    const cursoId = Number(filtroCursoAvaliacao);
    return turmasDoProfessor.filter((turma) => Number(turma.cursoId) === cursoId);
  }, [filtroCursoAvaliacao, turmasDoProfessor]);

  const linhasAvaliacoes = useMemo(() => {
    let proximasLinhas = linhasAvaliacoesOrdenadas;

    if (filtroCursoAvaliacao !== "todos") {
      const cursoId = Number(filtroCursoAvaliacao);
      proximasLinhas = proximasLinhas.filter((row) => Number(row.cursoId) === cursoId);
    }

    if (filtroTurmaAvaliacao !== "todos") {
      const turmaId = Number(filtroTurmaAvaliacao);
      proximasLinhas = proximasLinhas.filter((row) => Number(row.turmaId) === turmaId);
    }

    if (filtroStatusAvaliacao !== "todos") {
      proximasLinhas = proximasLinhas.filter((row) => String(row.statusPublicacao ?? "") === filtroStatusAvaliacao);
    }

    if (filtroTipoAvaliacao !== "todos") {
      proximasLinhas = proximasLinhas.filter((row) => String(row.tipoAvaliacao ?? "") === filtroTipoAvaliacao);
    }

    if (!termoBuscaAvaliacao) {
      return proximasLinhas;
    }

    return proximasLinhas.filter((row) => {
      const campos = [
        row.titulo,
        row.descricao,
        row.turmaNome,
        row.cursoTitulo,
        row.moduloTitulo,
        normalizeEvaluationType(row.tipoAvaliacao),
        normalizePublicationStatus(row.statusPublicacao),
        formatDate(row.dataAbertura),
        formatDate(row.dataFechamento)
      ];

      return campos.some((campo) => normalizarBusca(campo).includes(termoBuscaAvaliacao));
    });
  }, [
    filtroCursoAvaliacao,
    filtroStatusAvaliacao,
    filtroTipoAvaliacao,
    filtroTurmaAvaliacao,
    linhasAvaliacoesOrdenadas,
    termoBuscaAvaliacao
  ]);

  const temFiltroAvaliacaoAtivo = Boolean(
    termoBuscaAvaliacao ||
      filtroCursoAvaliacao !== "todos" ||
      filtroTurmaAvaliacao !== "todos" ||
      filtroStatusAvaliacao !== "todos" ||
      filtroTipoAvaliacao !== "todos"
  );

  const linhasAvaliacoesSelecionadas = useMemo(
    () => linhasAvaliacoes.filter((row) => idsAvaliacoesSelecionadas.includes(row.id)),
    [idsAvaliacoesSelecionadas, linhasAvaliacoes]
  );

  const todasAvaliacoesSelecionadas =
    linhasAvaliacoes.length > 0 && linhasAvaliacoes.every((row) => idsAvaliacoesSelecionadas.includes(row.id));

  useEffect(() => {
    setIdsAvaliacoesSelecionadas((current) =>
      current.filter((id) => linhasAvaliacoes.some((row) => row.id === id))
    );
  }, [linhasAvaliacoes]);

  const resumoAvaliacoes = useMemo(() => {
    const totalPublicadas = avaliacoes.filter(
      (item) => normalizePublicationStatus(item.statusPublicacao) === "Publicado"
    ).length;
    const totalRascunhos = avaliacoes.filter(
      (item) => normalizePublicationStatus(item.statusPublicacao) === "Rascunho"
    ).length;
    const totalArquivadas = avaliacoes.filter(
      (item) => normalizePublicationStatus(item.statusPublicacao) === "Arquivado"
    ).length;

    return [
      `${turmasDoProfessor.length} turma(s)`,
      `${modulosDoProfessor.length} modulo(s)`,
      `${avaliacoes.length} avaliacao(oes)`,
      `${totalPublicadas} publicada(s)`,
      `${totalRascunhos} rascunho(s)`,
      `${totalArquivadas} arquivada(s)`
    ];
  }, [avaliacoes, modulosDoProfessor.length, turmasDoProfessor.length]);

  function limparFormularioAvaliacao() {
    setAvaliacaoEmEdicaoId(null);
    setDadosFormularioAvaliacao(criarEstadoInicialFormularioAvaliacao(turmasDoProfessor, modulosDoProfessor));
    setMensagemFormulario({ tone: "", message: "" });
  }

  function abrirFormularioNovaAvaliacao() {
    limparFormularioAvaliacao();
    setIdsAvaliacoesSelecionadas([]);
    setMensagemTabela({ tone: "", message: "" });
    setFormularioAvaliacaoAberto(true);
  }

  function fecharFormularioAvaliacao() {
    if (salvandoAvaliacao) {
      return;
    }

    limparFormularioAvaliacao();
    setFormularioAvaliacaoAberto(false);
  }

  function atualizarCampoFormularioAvaliacao(event) {
    const { name, value } = event.target;

    if (name === "turmaId") {
      const nextTurma = turmasDoProfessor.find((turma) => String(turma.id) === value) || null;
      const nextModules = nextTurma ? modulosPorCursoId.get(nextTurma.cursoId) || [] : [];

      setDadosFormularioAvaliacao((current) => ({
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

    setDadosFormularioAvaliacao((current) => ({
      ...current,
      [name]: value
    }));
  }

  function abrirEdicaoAvaliacao(avaliacao) {
    setAvaliacaoEmEdicaoId(avaliacao.id);
    setIdsAvaliacoesSelecionadas([avaliacao.id]);
    setMensagemTabela({ tone: "", message: "" });
    setDadosFormularioAvaliacao({
      turmaId: String(avaliacao.turmaId),
      moduloId: String(avaliacao.moduloId),
      titulo: avaliacao.titulo || "",
      descricao: avaliacao.descricao || "",
      tipoAvaliacao: String(avaliacao.tipoAvaliacao || 1),
      statusPublicacao: String(avaliacao.statusPublicacao || 1),
      dataAbertura: toDatetimeLocalValue(avaliacao.dataAbertura),
      dataFechamento: toDatetimeLocalValue(avaliacao.dataFechamento),
      tentativasPermitidas: String(avaliacao.tentativasPermitidas ?? 1),
      tempoLimiteMinutos: avaliacao.tempoLimiteMinutos ? String(avaliacao.tempoLimiteMinutos) : "",
      notaMaxima: String(avaliacao.notaMaxima ?? 10),
      pesoNota: String(avaliacao.pesoNota ?? 1),
      pesoProgresso: String(avaliacao.pesoProgresso ?? 1)
    });
    setMensagemFormulario({ tone: "", message: "" });
    setFormularioAvaliacaoAberto(true);
  }

  async function salvarAvaliacao(event) {
    event.preventDefault();

    const tituloNormalizado = dadosFormularioAvaliacao.titulo.trim();
    const dadosEnvio = {
      titulo: tituloNormalizado,
      descricao: dadosFormularioAvaliacao.descricao.trim(),
      turmaId: Number(dadosFormularioAvaliacao.turmaId),
      moduloId: Number(dadosFormularioAvaliacao.moduloId),
      tipoAvaliacao: Number(dadosFormularioAvaliacao.tipoAvaliacao),
      statusPublicacao: Number(dadosFormularioAvaliacao.statusPublicacao),
      dataAbertura: toIsoOrNull(dadosFormularioAvaliacao.dataAbertura),
      dataFechamento: toIsoOrNull(dadosFormularioAvaliacao.dataFechamento),
      tentativasPermitidas: Number(dadosFormularioAvaliacao.tentativasPermitidas),
      tempoLimiteMinutos: dadosFormularioAvaliacao.tempoLimiteMinutos
        ? Number(dadosFormularioAvaliacao.tempoLimiteMinutos)
        : null,
      notaMaxima: Number(dadosFormularioAvaliacao.notaMaxima),
      pesoNota: Number(dadosFormularioAvaliacao.pesoNota),
      pesoProgresso: Number(dadosFormularioAvaliacao.pesoProgresso)
    };

    if (!turmasDoProfessor.length) {
      setMensagemFormulario({ tone: "error", message: "Seu perfil ainda nao possui turmas para avaliacao." });
      return;
    }

    if (!modulosDisponiveis.length) {
      setMensagemFormulario({ tone: "error", message: "Nao existem modulos disponiveis para a turma selecionada." });
      return;
    }

    if (!tituloNormalizado) {
      setMensagemFormulario({ tone: "error", message: "Informe o titulo da avaliacao antes de salvar." });
      return;
    }

    if (!dadosEnvio.turmaId) {
      setMensagemFormulario({ tone: "error", message: "Selecione a turma que vai receber a avaliacao." });
      return;
    }

    if (!dadosEnvio.moduloId) {
      setMensagemFormulario({ tone: "error", message: "Selecione um modulo para organizar a avaliacao." });
      return;
    }

    if (!Number.isInteger(dadosEnvio.tentativasPermitidas) || dadosEnvio.tentativasPermitidas <= 0) {
      setMensagemFormulario({ tone: "error", message: "Informe pelo menos uma tentativa permitida." });
      return;
    }

    if (dadosEnvio.tempoLimiteMinutos !== null && (!Number.isInteger(dadosEnvio.tempoLimiteMinutos) || dadosEnvio.tempoLimiteMinutos <= 0)) {
      setMensagemFormulario({ tone: "error", message: "O tempo limite deve ser maior que zero." });
      return;
    }

    if (!Number.isFinite(dadosEnvio.notaMaxima) || dadosEnvio.notaMaxima <= 0) {
      setMensagemFormulario({ tone: "error", message: "A nota maxima deve ser maior que zero." });
      return;
    }

    if (!Number.isFinite(dadosEnvio.pesoNota) || dadosEnvio.pesoNota <= 0) {
      setMensagemFormulario({ tone: "error", message: "O peso de nota deve ser maior que zero." });
      return;
    }

    if (!Number.isFinite(dadosEnvio.pesoProgresso) || dadosEnvio.pesoProgresso <= 0) {
      setMensagemFormulario({ tone: "error", message: "O peso de progresso deve ser maior que zero." });
      return;
    }

    if (dadosEnvio.dataAbertura && dadosEnvio.dataFechamento && new Date(dadosEnvio.dataFechamento) <= new Date(dadosEnvio.dataAbertura)) {
      setMensagemFormulario({ tone: "error", message: "A data de fechamento deve ser posterior a abertura." });
      return;
    }

    setSalvandoAvaliacao(true);
    setMensagemFormulario({ tone: "", message: "" });

    try {
      const mensagemSucesso = avaliacaoEmEdicaoId
        ? "Avaliacao atualizada com sucesso."
        : "Avaliacao criada com sucesso.";

      if (avaliacaoEmEdicaoId) {
        await apiRequest(`/Avaliacoes/${avaliacaoEmEdicaoId}`, {
          method: "PUT",
          body: JSON.stringify(dadosEnvio)
        });
      } else {
        await apiRequest("/Avaliacoes", {
          method: "POST",
          body: JSON.stringify(dadosEnvio)
        });
      }

      setAvaliacaoEmEdicaoId(null);
      setDadosFormularioAvaliacao(criarEstadoInicialFormularioAvaliacao(turmasDoProfessor, modulosDoProfessor));
      setIdsAvaliacoesSelecionadas([]);
      setMensagemFormulario({ tone: "", message: "" });
      setMensagemTabela({ tone: "success", message: mensagemSucesso });
      setFormularioAvaliacaoAberto(false);
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setMensagemFormulario({
        tone: "error",
        message: err.message || "Nao foi possivel salvar a avaliacao agora."
      });
    } finally {
      setSalvandoAvaliacao(false);
    }
  }

  function alternarSelecaoAvaliacao(avaliacaoId) {
    setIdsAvaliacoesSelecionadas((current) =>
      current.includes(avaliacaoId) ? current.filter((id) => id !== avaliacaoId) : [...current, avaliacaoId]
    );
  }

  function alternarSelecaoTodasAvaliacoes() {
    if (salvandoAvaliacao || !linhasAvaliacoes.length) {
      return;
    }

    setIdsAvaliacoesSelecionadas((current) =>
      linhasAvaliacoes.every((row) => current.includes(row.id)) ? [] : linhasAvaliacoes.map((row) => row.id)
    );
  }

  function editarAvaliacaoSelecionada() {
    if (linhasAvaliacoesSelecionadas.length !== 1) {
      return;
    }

    abrirEdicaoAvaliacao(linhasAvaliacoesSelecionadas[0]);
  }

  async function abrirMontagemQuestoesSelecionada() {
    if (linhasAvaliacoesSelecionadas.length !== 1) {
      return;
    }

    const avaliacao = linhasAvaliacoesSelecionadas[0];
    setAvaliacaoEmMontagem(avaliacao);
    setDadosFormularioQuestao(criarEstadoInicialFormularioQuestao());
    setMensagemQuestoes({ tone: "", message: "" });
    await carregarQuestoesAvaliacao(avaliacao.id);
  }

  function fecharMontagemQuestoes() {
    if (salvandoQuestao) {
      return;
    }

    setAvaliacaoEmMontagem(null);
    setQuestoesAvaliacao([]);
    setDadosFormularioQuestao(criarEstadoInicialFormularioQuestao());
    setMensagemQuestoes({ tone: "", message: "" });
  }

  async function carregarQuestoesAvaliacao(avaliacaoId) {
    setCarregandoQuestoes(true);

    try {
      const questoes = await apiRequest(`/Avaliacoes/${avaliacaoId}/questoes`);
      setQuestoesAvaliacao(questoes);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setMensagemQuestoes({
        tone: "error",
        message: err.message || "Nao foi possivel carregar as questoes agora."
      });
    } finally {
      setCarregandoQuestoes(false);
    }
  }

  function atualizarCampoFormularioQuestao(event) {
    const { name, value } = event.target;

    if (name === "tipoQuestao") {
      setDadosFormularioQuestao((current) => ({
        ...current,
        tipoQuestao: value,
        alternativas: criarAlternativasPorTipo(value, current.alternativas)
      }));
      return;
    }

    setDadosFormularioQuestao((current) => ({
      ...current,
      [name]: value
    }));
  }

  function atualizarAlternativaQuestao(index, value) {
    setDadosFormularioQuestao((current) => ({
      ...current,
      alternativas: current.alternativas.map((alternativa, alternativeIndex) =>
        alternativeIndex === index ? { ...alternativa, texto: value } : alternativa
      )
    }));
  }

  function selecionarAlternativaCorreta(index) {
    setDadosFormularioQuestao((current) => ({
      ...current,
      alternativas: current.alternativas.map((alternativa, alternativeIndex) => ({
        ...alternativa,
        ehCorreta: alternativeIndex === index
      }))
    }));
  }

  async function salvarQuestao(event) {
    event.preventDefault();

    if (!avaliacaoEmMontagem) {
      return;
    }

    const tipoQuestao = Number(dadosFormularioQuestao.tipoQuestao);
    const alternativas =
      tipoQuestao === 3
        ? []
        : dadosFormularioQuestao.alternativas.map((alternativa) => ({
            letra: alternativa.letra,
            texto: alternativa.texto.trim(),
            ehCorreta: alternativa.ehCorreta
          }));

    const payload = {
      tituloInterno: dadosFormularioQuestao.tituloInterno.trim(),
      contexto: dadosFormularioQuestao.contexto.trim(),
      enunciado: dadosFormularioQuestao.enunciado.trim(),
      tipoQuestao,
      tema: dadosFormularioQuestao.tema.trim(),
      subtema: dadosFormularioQuestao.subtema.trim(),
      dificuldade: Number(dadosFormularioQuestao.dificuldade),
      explicacaoPosResposta: dadosFormularioQuestao.explicacaoPosResposta.trim(),
      pontos: Number(dadosFormularioQuestao.pontos),
      alternativas
    };

    if (!payload.tituloInterno) {
      setMensagemQuestoes({ tone: "error", message: "Informe um titulo interno para a questao." });
      return;
    }

    if (!payload.enunciado) {
      setMensagemQuestoes({ tone: "error", message: "Informe o enunciado da questao." });
      return;
    }

    if (!Number.isFinite(payload.pontos) || payload.pontos <= 0) {
      setMensagemQuestoes({ tone: "error", message: "Informe uma pontuacao maior que zero." });
      return;
    }

    if (tipoQuestao !== 3 && alternativas.some((alternativa) => !alternativa.texto)) {
      setMensagemQuestoes({ tone: "error", message: "Preencha o texto de todas as alternativas." });
      return;
    }

    if (tipoQuestao !== 3 && alternativas.filter((alternativa) => alternativa.ehCorreta).length !== 1) {
      setMensagemQuestoes({ tone: "error", message: "Marque exatamente uma alternativa correta." });
      return;
    }

    setSalvandoQuestao(true);
    setMensagemQuestoes({ tone: "", message: "" });

    try {
      await apiRequest(`/Avaliacoes/${avaliacaoEmMontagem.id}/questoes`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setDadosFormularioQuestao(criarEstadoInicialFormularioQuestao());
      setMensagemQuestoes({ tone: "success", message: "Questao adicionada a avaliacao." });
      await carregarQuestoesAvaliacao(avaliacaoEmMontagem.id);
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setMensagemQuestoes({
        tone: "error",
        message: err.message || "Nao foi possivel salvar a questao agora."
      });
    } finally {
      setSalvandoQuestao(false);
    }
  }

  async function excluirQuestao(questao) {
    if (!avaliacaoEmMontagem) {
      return;
    }

    const exclusaoConfirmada = window.confirm(`Deseja excluir a questao ${questao.ordem}?`);
    if (!exclusaoConfirmada) {
      return;
    }

    setSalvandoQuestao(true);
    setMensagemQuestoes({ tone: "", message: "" });

    try {
      await apiRequest(`/Avaliacoes/${avaliacaoEmMontagem.id}/questoes/${questao.id}`, { method: "DELETE" });
      setMensagemQuestoes({ tone: "success", message: "Questao removida da avaliacao." });
      await carregarQuestoesAvaliacao(avaliacaoEmMontagem.id);
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setMensagemQuestoes({
        tone: "error",
        message: err.message || "Nao foi possivel excluir a questao agora."
      });
    } finally {
      setSalvandoQuestao(false);
    }
  }

  async function excluirAvaliacoesSelecionadas(linhasParaExcluir = linhasAvaliacoesSelecionadas) {
    if (!linhasParaExcluir.length) {
      return;
    }

    const exclusaoConfirmada = window.confirm(
      linhasParaExcluir.length === 1
        ? `Deseja excluir a avaliacao "${linhasParaExcluir[0].titulo}"?`
        : `Deseja excluir ${linhasParaExcluir.length} avaliacoes selecionadas?`
    );

    if (!exclusaoConfirmada) {
      return;
    }

    setSalvandoAvaliacao(true);
    setMensagemFormulario({ tone: "", message: "" });
    setMensagemTabela({ tone: "", message: "" });

    try {
      for (const avaliacao of linhasParaExcluir) {
        await apiRequest(`/Avaliacoes/${avaliacao.id}`, { method: "DELETE" });
      }

      if (avaliacaoEmEdicaoId && linhasParaExcluir.some((avaliacao) => avaliacao.id === avaliacaoEmEdicaoId)) {
        limparFormularioAvaliacao();
      }

      setIdsAvaliacoesSelecionadas((current) =>
        current.filter((id) => !linhasParaExcluir.some((avaliacao) => avaliacao.id === id))
      );
      setMensagemTabela({
        tone: "success",
        message:
          linhasParaExcluir.length === 1
            ? "Avaliacao excluida com sucesso."
            : `${linhasParaExcluir.length} avaliacoes foram excluidas com sucesso.`
      });
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setMensagemTabela({
        tone: "error",
        message: err.message || "Nao foi possivel excluir as avaliacoes selecionadas agora."
      });
    } finally {
      setSalvandoAvaliacao(false);
    }
  }

  function alterarFiltroCursoAvaliacao(event) {
    setFiltroCursoAvaliacao(event.target.value);
    setFiltroTurmaAvaliacao("todos");
  }

  function limparFiltrosAvaliacoes() {
    setBuscaAvaliacao("");
    setFiltroCursoAvaliacao("todos");
    setFiltroTurmaAvaliacao("todos");
    setFiltroStatusAvaliacao("todos");
    setFiltroTipoAvaliacao("todos");
  }

  function renderBarraFiltrosAvaliacoes() {
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
              aria-label="Buscar avaliacoes"
              className="table-inline-input table-inline-input--search"
              onChange={(event) => setBuscaAvaliacao(event.target.value)}
              placeholder="Pesquisar avaliacoes"
              type="search"
              value={buscaAvaliacao}
            />
          </label>
          <select
            aria-label="Filtrar avaliacoes por curso"
            className="table-inline-select"
            onChange={alterarFiltroCursoAvaliacao}
            value={filtroCursoAvaliacao}
          >
            <option value="todos">Todos os cursos</option>
            {cursosDasAvaliacoes.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.titulo}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar avaliacoes por turma"
            className="table-inline-select"
            onChange={(event) => setFiltroTurmaAvaliacao(event.target.value)}
            value={filtroTurmaAvaliacao}
          >
            <option value="todos">Todas as turmas</option>
            {turmasFiltradasPorCurso.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nomeTurma}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar avaliacoes por tipo"
            className="table-inline-select"
            onChange={(event) => setFiltroTipoAvaliacao(event.target.value)}
            value={filtroTipoAvaliacao}
          >
            <option value="todos">Todos os tipos</option>
            {OPCOES_TIPO_AVALIACAO.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar avaliacoes por status"
            className="table-inline-select"
            onChange={(event) => setFiltroStatusAvaliacao(event.target.value)}
            value={filtroStatusAvaliacao}
          >
            <option value="todos">Todos os status</option>
            {OPCOES_STATUS_PUBLICACAO.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="table-action" disabled={!temFiltroAvaliacaoAtivo} onClick={limparFiltrosAvaliacoes} type="button">
            Limpar filtros
          </button>
        </div>
        <p className="table-toolbar__summary">
          {linhasAvaliacoes.length} de {avaliacoes.length} avaliacao{avaliacoes.length === 1 ? "" : "oes"}
        </p>
      </div>
    );
  }

  return (
    <div className="content-section">
      <section className="content-section__intro">
        <div className="content-section__intro-copy">
          <span className="eyebrow">Operacao de avaliacoes</span>
          <h2>Teste avaliativo por turma e modulo</h2>
          <p>Uma primeira area para o professor preparar provas, quizzes e exercicios dentro da estrutura academica.</p>
        </div>
        <div className="content-section__highlights" aria-label="Resumo de avaliacoes">
          {resumoAvaliacoes.map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      {formularioAvaliacaoAberto ? (
        <div
          className="content-form-modal"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharFormularioAvaliacao();
            }
          }}
        >
          <div
            aria-label={avaliacaoEmEdicaoId ? "Editar avaliacao" : "Nova avaliacao"}
            aria-modal="true"
            className="content-form-modal__card"
            role="dialog"
          >
            <button
              className="content-form-modal__close"
              disabled={salvandoAvaliacao}
              onClick={fecharFormularioAvaliacao}
              type="button"
            >
              Fechar
            </button>
            <PanelCard
              description="Cadastre ou ajuste uma avaliacao ligada a uma turma e a um modulo."
              title={avaliacaoEmEdicaoId ? "Editar avaliacao" : "Nova avaliacao"}
            >
              {!turmasDoProfessor.length ? (
                <InlineMessage tone="info">
                  Seu usuario ainda nao possui turmas atribuidas. Assim que uma turma for vinculada ao seu perfil, a criacao de avaliacoes fica disponivel aqui.
                </InlineMessage>
              ) : !modulosDoProfessor.length ? (
                <InlineMessage tone="info">
                  As suas turmas ja existem, mas ainda nao ha modulos cadastrados nos cursos correspondentes.
                </InlineMessage>
              ) : (
                <form className="management-form" onSubmit={salvarAvaliacao}>
                  <div className="management-form__grid">
                    <label className="management-field">
                      <span>Turma</span>
                      <select
                        disabled={salvandoAvaliacao || !turmasDoProfessor.length}
                        name="turmaId"
                        onChange={atualizarCampoFormularioAvaliacao}
                        value={dadosFormularioAvaliacao.turmaId}
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
                        disabled={salvandoAvaliacao || !modulosDisponiveis.length}
                        key={dadosFormularioAvaliacao.turmaId || "sem-turma"}
                        name="moduloId"
                        onChange={atualizarCampoFormularioAvaliacao}
                        value={dadosFormularioAvaliacao.moduloId}
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
                      <span>Tipo de avaliacao</span>
                      <select
                        disabled={salvandoAvaliacao}
                        name="tipoAvaliacao"
                        onChange={atualizarCampoFormularioAvaliacao}
                        value={dadosFormularioAvaliacao.tipoAvaliacao}
                      >
                        {OPCOES_TIPO_AVALIACAO.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="management-field">
                      <span>Status</span>
                      <select
                        disabled={salvandoAvaliacao}
                        name="statusPublicacao"
                        onChange={atualizarCampoFormularioAvaliacao}
                        value={dadosFormularioAvaliacao.statusPublicacao}
                      >
                        {OPCOES_STATUS_PUBLICACAO.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="management-field management-field--wide">
                      <span>Titulo</span>
                      <input
                        autoComplete="off"
                        disabled={salvandoAvaliacao}
                        maxLength={180}
                        name="titulo"
                        onChange={atualizarCampoFormularioAvaliacao}
                        placeholder="Ex.: Avaliacao final do modulo"
                        type="text"
                        value={dadosFormularioAvaliacao.titulo}
                      />
                    </label>

                    <label className="management-field management-field--wide">
                      <span>Descricao curta</span>
                      <textarea
                        disabled={salvandoAvaliacao}
                        maxLength={500}
                        name="descricao"
                        onChange={atualizarCampoFormularioAvaliacao}
                        placeholder="Explique rapidamente o objetivo da avaliacao."
                        value={dadosFormularioAvaliacao.descricao}
                      />
                    </label>

                    <label className="management-field">
                      <span>Abertura</span>
                      <input
                        disabled={salvandoAvaliacao}
                        name="dataAbertura"
                        onChange={atualizarCampoFormularioAvaliacao}
                        type="datetime-local"
                        value={dadosFormularioAvaliacao.dataAbertura}
                      />
                    </label>

                    <label className="management-field">
                      <span>Fechamento</span>
                      <input
                        disabled={salvandoAvaliacao}
                        name="dataFechamento"
                        onChange={atualizarCampoFormularioAvaliacao}
                        type="datetime-local"
                        value={dadosFormularioAvaliacao.dataFechamento}
                      />
                    </label>

                    <label className="management-field">
                      <span>Tentativas permitidas</span>
                      <input
                        disabled={salvandoAvaliacao}
                        min="1"
                        name="tentativasPermitidas"
                        onChange={atualizarCampoFormularioAvaliacao}
                        type="number"
                        value={dadosFormularioAvaliacao.tentativasPermitidas}
                      />
                    </label>

                    <label className="management-field">
                      <span>Tempo limite</span>
                      <input
                        disabled={salvandoAvaliacao}
                        min="1"
                        name="tempoLimiteMinutos"
                        onChange={atualizarCampoFormularioAvaliacao}
                        placeholder="Sem limite"
                        type="number"
                        value={dadosFormularioAvaliacao.tempoLimiteMinutos}
                      />
                      <small>Informe em minutos ou deixe vazio.</small>
                    </label>

                    <label className="management-field">
                      <span>Nota maxima</span>
                      <input
                        disabled={salvandoAvaliacao}
                        min="0.01"
                        name="notaMaxima"
                        onChange={atualizarCampoFormularioAvaliacao}
                        step="0.01"
                        type="number"
                        value={dadosFormularioAvaliacao.notaMaxima}
                      />
                    </label>

                    <label className="management-field">
                      <span>Peso da nota</span>
                      <input
                        disabled={salvandoAvaliacao}
                        min="0.01"
                        name="pesoNota"
                        onChange={atualizarCampoFormularioAvaliacao}
                        step="0.01"
                        type="number"
                        value={dadosFormularioAvaliacao.pesoNota}
                      />
                    </label>

                    <label className="management-field">
                      <span>Peso de progresso</span>
                      <input
                        disabled={salvandoAvaliacao}
                        min="0.01"
                        name="pesoProgresso"
                        onChange={atualizarCampoFormularioAvaliacao}
                        step="0.01"
                        type="number"
                        value={dadosFormularioAvaliacao.pesoProgresso}
                      />
                    </label>
                  </div>

                  {mensagemFormulario.message ? <InlineMessage tone={mensagemFormulario.tone}>{mensagemFormulario.message}</InlineMessage> : null}

                  <div className="management-form__actions">
                    <button
                      className="solid-button"
                      disabled={salvandoAvaliacao || !turmasDoProfessor.length || !modulosDisponiveis.length}
                      type="submit"
                    >
                      {salvandoAvaliacao ? "Salvando..." : avaliacaoEmEdicaoId ? "Salvar alteracoes" : "Criar avaliacao"}
                    </button>

                    <button
                      className="button button--secondary exit-button"
                      disabled={salvandoAvaliacao}
                      onClick={fecharFormularioAvaliacao}
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

      {avaliacaoEmMontagem ? (
        <div
          className="content-form-modal"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharMontagemQuestoes();
            }
          }}
        >
          <div
            aria-label="Montar questoes da avaliacao"
            aria-modal="true"
            className="content-form-modal__card"
            role="dialog"
          >
            <button
              className="content-form-modal__close"
              disabled={salvandoQuestao}
              onClick={fecharMontagemQuestoes}
              type="button"
            >
              Fechar
            </button>
            <PanelCard
              description={`${avaliacaoEmMontagem.turmaNome || "Turma"} - ${avaliacaoEmMontagem.moduloTitulo || "Modulo"}`}
              title={`Montar questoes: ${avaliacaoEmMontagem.titulo}`}
            >
              <form className="management-form" onSubmit={salvarQuestao}>
                <div className="management-form__grid">
                  <label className="management-field">
                    <span>Tipo da questao</span>
                    <select
                      disabled={salvandoQuestao}
                      name="tipoQuestao"
                      onChange={atualizarCampoFormularioQuestao}
                      value={dadosFormularioQuestao.tipoQuestao}
                    >
                      {OPCOES_TIPO_QUESTAO.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="management-field">
                    <span>Pontos</span>
                    <input
                      disabled={salvandoQuestao}
                      min="0.01"
                      name="pontos"
                      onChange={atualizarCampoFormularioQuestao}
                      step="0.01"
                      type="number"
                      value={dadosFormularioQuestao.pontos}
                    />
                  </label>

                  <label className="management-field">
                    <span>Dificuldade</span>
                    <select
                      disabled={salvandoQuestao}
                      name="dificuldade"
                      onChange={atualizarCampoFormularioQuestao}
                      value={dadosFormularioQuestao.dificuldade}
                    >
                      {[1, 2, 3, 4, 5].map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="management-field">
                    <span>Tema</span>
                    <input
                      autoComplete="off"
                      disabled={salvandoQuestao}
                      maxLength={120}
                      name="tema"
                      onChange={atualizarCampoFormularioQuestao}
                      placeholder="Ex.: Logica"
                      type="text"
                      value={dadosFormularioQuestao.tema}
                    />
                  </label>

                  <label className="management-field management-field--wide">
                    <span>Titulo interno</span>
                    <input
                      autoComplete="off"
                      disabled={salvandoQuestao}
                      maxLength={180}
                      name="tituloInterno"
                      onChange={atualizarCampoFormularioQuestao}
                      placeholder="Ex.: Questao 01 - conceitos iniciais"
                      type="text"
                      value={dadosFormularioQuestao.tituloInterno}
                    />
                  </label>

                  <label className="management-field management-field--wide">
                    <span>Contexto</span>
                    <textarea
                      disabled={salvandoQuestao}
                      name="contexto"
                      onChange={atualizarCampoFormularioQuestao}
                      placeholder="Texto de apoio opcional para a pergunta."
                      value={dadosFormularioQuestao.contexto}
                    />
                  </label>

                  <label className="management-field management-field--wide">
                    <span>Enunciado</span>
                    <textarea
                      disabled={salvandoQuestao}
                      name="enunciado"
                      onChange={atualizarCampoFormularioQuestao}
                      placeholder="Digite a pergunta que o aluno vai responder."
                      value={dadosFormularioQuestao.enunciado}
                    />
                  </label>

                  {Number(dadosFormularioQuestao.tipoQuestao) !== 3 ? (
                    <div className="management-field management-field--wide">
                      <span>Alternativas</span>
                      <div className="mini-list">
                        {dadosFormularioQuestao.alternativas.map((alternativa, index) => (
                          <label className="mini-list__item" key={alternativa.letra}>
                            <div className="table-cell-stack">
                              <strong>{alternativa.letra}</strong>
                              <input
                                autoComplete="off"
                                disabled={salvandoQuestao || Number(dadosFormularioQuestao.tipoQuestao) === 2}
                                onChange={(event) => atualizarAlternativaQuestao(index, event.target.value)}
                                placeholder={`Alternativa ${alternativa.letra}`}
                                type="text"
                                value={alternativa.texto}
                              />
                            </div>
                            <input
                              aria-label={`Marcar alternativa ${alternativa.letra} como correta`}
                              checked={alternativa.ehCorreta}
                              disabled={salvandoQuestao}
                              name="alternativaCorreta"
                              onChange={() => selecionarAlternativaCorreta(index)}
                              type="radio"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <label className="management-field management-field--wide">
                    <span>Explicacao pos-resposta</span>
                    <textarea
                      disabled={salvandoQuestao}
                      name="explicacaoPosResposta"
                      onChange={atualizarCampoFormularioQuestao}
                      placeholder="Opcional: comentario para correcao ou revisao."
                      value={dadosFormularioQuestao.explicacaoPosResposta}
                    />
                  </label>
                </div>

                {mensagemQuestoes.message ? <InlineMessage tone={mensagemQuestoes.tone}>{mensagemQuestoes.message}</InlineMessage> : null}

                <div className="management-form__actions">
                  <button className="solid-button" disabled={salvandoQuestao} type="submit">
                    {salvandoQuestao ? "Salvando..." : "Adicionar questao"}
                  </button>
                  <button
                    className="button button--secondary exit-button"
                    disabled={salvandoQuestao}
                    onClick={fecharMontagemQuestoes}
                    type="button"
                  >
                    Concluir montagem
                  </button>
                </div>
              </form>

              <DataTable
                columns={[
                  { key: "ordem", label: "Ordem" },
                  {
                    key: "enunciado",
                    label: "Questao",
                    render: (row) => (
                      <div className="table-cell-stack">
                        <strong>{compactText(row.enunciado, 84)}</strong>
                        <p>{normalizeQuestionType(row.tipoQuestao)}</p>
                      </div>
                    )
                  },
                  {
                    key: "alternativas",
                    label: "Alternativas",
                    render: (row) =>
                      row.alternativas?.length ? (
                        <div className="table-badge-list">
                          {row.alternativas.map((alternativa) => (
                            <span className="chip" key={alternativa.id || alternativa.letra}>
                              {alternativa.letra}{alternativa.ehCorreta ? " correta" : ""}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span>Discursiva</span>
                      )
                  },
                  {
                    key: "pontos",
                    label: "Pontos",
                    render: (row) => formatDecimal(row.pontos)
                  },
                  {
                    key: "acoes",
                    label: "Acoes",
                    render: (row) => (
                      <button
                        className="table-action table-action--danger"
                        disabled={salvandoQuestao}
                        onClick={() => excluirQuestao(row)}
                        type="button"
                      >
                        Excluir
                      </button>
                    )
                  }
                ]}
                emptyMessage={carregandoQuestoes ? "Carregando questoes..." : "Nenhuma questao cadastrada para esta avaliacao."}
                rows={questoesAvaliacao}
              />
            </PanelCard>
          </div>
        </div>
      ) : null}

      <div className="content-section__block content-section__block--published">
        <PanelCard
          description="Selecione avaliacoes para editar ou excluir e acompanhe o status por turma e modulo."
          title="Avaliacoes do professor"
        >
          {renderBarraFiltrosAvaliacoes()}

          <div className="table-toolbar">
            <div className="table-actions">
              <button
                className="table-action"
                disabled={salvandoAvaliacao || linhasAvaliacoesSelecionadas.length !== 1}
                onClick={editarAvaliacaoSelecionada}
                type="button"
              >
                Editar
              </button>
              <button
                className="table-action"
                disabled={salvandoAvaliacao || linhasAvaliacoesSelecionadas.length !== 1}
                onClick={abrirMontagemQuestoesSelecionada}
                type="button"
              >
                Montar questoes
              </button>
              <button
                className="table-action table-action--danger"
                disabled={salvandoAvaliacao || !linhasAvaliacoesSelecionadas.length}
                onClick={() => excluirAvaliacoesSelecionadas()}
                type="button"
              >
                Excluir
              </button>
            </div>
            <p className="table-toolbar__summary">
              {linhasAvaliacoesSelecionadas.length
                ? `${linhasAvaliacoesSelecionadas.length} avaliacao(oes) selecionada(s).`
                : "Selecione uma ou mais avaliacoes visiveis pela caixa ao lado esquerdo."}
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
                      aria-label={todasAvaliacoesSelecionadas ? "Desmarcar todas as avaliacoes" : "Selecionar todas as avaliacoes"}
                      checked={todasAvaliacoesSelecionadas}
                      className="table-select-input"
                      disabled={salvandoAvaliacao || !linhasAvaliacoes.length}
                      onChange={alternarSelecaoTodasAvaliacoes}
                      type="checkbox"
                    />
                  </div>
                ),
                render: (row) => (
                  <div className="table-select-cell">
                    <input
                      aria-label={`Selecionar avaliacao ${row.titulo}`}
                      checked={idsAvaliacoesSelecionadas.includes(row.id)}
                      className="table-select-input"
                      disabled={salvandoAvaliacao}
                      onChange={() => alternarSelecaoAvaliacao(row.id)}
                      type="checkbox"
                    />
                  </div>
                )
              },
              {
                key: "titulo",
                label: "Avaliacao",
                render: (row) => (
                  <div className="table-cell-stack">
                    <strong>{row.titulo}</strong>
                    <p>{compactText(row.descricao || "-", 88)}</p>
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
                key: "tipoAvaliacao",
                label: "Tipo",
                render: (row) => <span className="chip">{normalizeEvaluationType(row.tipoAvaliacao)}</span>
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
              {
                key: "periodo",
                label: "Periodo",
                render: (row) => (
                  <div className="table-cell-stack">
                    <strong>{row.dataAbertura ? formatDate(row.dataAbertura) : "Sem abertura"}</strong>
                    <p>{row.dataFechamento ? `Fecha em ${formatDate(row.dataFechamento)}` : "Sem fechamento"}</p>
                  </div>
                )
              },
              {
                key: "nota",
                label: "Nota",
                render: (row) => (
                  <div className="table-cell-stack">
                    <strong>{formatDecimal(row.notaMaxima)}</strong>
                    <p>{row.tentativasPermitidas} tentativa(s)</p>
                  </div>
                )
              },
              { key: "totalQuestoes", label: "Questoes" }
            ]}
            emptyMessage={
              temFiltroAvaliacaoAtivo
                ? "Nenhuma avaliacao encontrada com os filtros aplicados."
                : "Nenhuma avaliacao cadastrada ainda."
            }
            rows={linhasAvaliacoes}
          />
        </PanelCard>
      </div>
    </div>
  );
}

function criarEstadoInicialFormularioAvaliacao(turmas, modulos, overrides = {}) {
  const primeiraTurma = turmas[0] || null;
  const modulosDaPrimeiraTurma = primeiraTurma
    ? modulos.filter((modulo) => modulo.cursoId === primeiraTurma.cursoId)
    : [];

  return {
    turmaId: primeiraTurma ? String(primeiraTurma.id) : "",
    moduloId: modulosDaPrimeiraTurma[0] ? String(modulosDaPrimeiraTurma[0].id) : "",
    titulo: "",
    descricao: "",
    tipoAvaliacao: OPCOES_TIPO_AVALIACAO[0].value,
    statusPublicacao: OPCOES_STATUS_PUBLICACAO[0].value,
    dataAbertura: "",
    dataFechamento: "",
    tentativasPermitidas: "1",
    tempoLimiteMinutos: "",
    notaMaxima: "10",
    pesoNota: "1",
    pesoProgresso: "1",
    ...overrides
  };
}

function criarEstadoInicialFormularioQuestao(overrides = {}) {
  return {
    tituloInterno: "",
    contexto: "",
    enunciado: "",
    tipoQuestao: OPCOES_TIPO_QUESTAO[0].value,
    tema: "",
    subtema: "",
    dificuldade: "1",
    explicacaoPosResposta: "",
    pontos: "1",
    alternativas: criarAlternativasPorTipo(OPCOES_TIPO_QUESTAO[0].value),
    ...overrides
  };
}

function criarAlternativasPorTipo(tipoQuestao, alternativasAtuais = []) {
  const tipo = Number(tipoQuestao);

  if (tipo === 3) {
    return [];
  }

  if (tipo === 2) {
    return [
      { letra: "V", texto: "Verdadeiro", ehCorreta: alternativasAtuais[0]?.ehCorreta ?? true },
      { letra: "F", texto: "Falso", ehCorreta: alternativasAtuais[1]?.ehCorreta ?? false }
    ];
  }

  return ALTERNATIVAS_MULTIPLA_ESCOLHA.map((letra, index) => ({
    letra,
    texto: alternativasAtuais[index]?.texto || "",
    ehCorreta: alternativasAtuais[index]?.ehCorreta ?? index === 0
  }));
}
