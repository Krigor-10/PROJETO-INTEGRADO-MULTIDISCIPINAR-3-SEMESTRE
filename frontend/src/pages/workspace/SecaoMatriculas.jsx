import { useEffect, useMemo, useState } from "react";
import { DataTable, InlineMessage, PanelCard, StatusPill } from "../../components/Primitives.jsx";
import { ApiError, apiRequest } from "../../lib/api.js";
import { formatDate, formatGrade, statusTone } from "../../lib/format.js";

export function SecaoMatriculas({ ehAluno, linhasMatriculas, onRefresh, onSessionExpired, turmas = [] }) {
  const [mensagem, setMensagem] = useState({ tone: "info", message: "" });
  const [processandoLote, setProcessandoLote] = useState(false);
  const [matriculasSelecionadas, setMatriculasSelecionadas] = useState(() => new Set());
  const [visualizacaoGestor, setVisualizacaoGestor] = useState("pendentes");
  const [turmaSelecionada, setTurmaSelecionada] = useState("");

  const turmasPorCurso = useMemo(() => {
    const mapa = new Map();

    turmas.forEach((turma) => {
      const cursoId = Number(turma.cursoId);
      const lista = mapa.get(cursoId) || [];
      lista.push(turma);
      mapa.set(cursoId, lista);
    });

    mapa.forEach((lista) => {
      lista.sort((left, right) => String(left.nomeTurma || "").localeCompare(String(right.nomeTurma || ""), "pt-BR"));
    });

    return mapa;
  }, [turmas]);

  const matriculasPendentes = useMemo(
    () => linhasMatriculas.filter((matricula) => matricula.status === "Pendente"),
    [linhasMatriculas]
  );
  const matriculasAprovadas = useMemo(
    () => linhasMatriculas.filter((matricula) => matricula.status === "Aprovada"),
    [linhasMatriculas]
  );
  const mostrandoPendentes = ehAluno || visualizacaoGestor === "pendentes";
  const linhasVisiveis = ehAluno ? linhasMatriculas : mostrandoPendentes ? matriculasPendentes : matriculasAprovadas;

  const idsPendentes = useMemo(() => new Set(matriculasPendentes.map((matricula) => matricula.id)), [matriculasPendentes]);

  const matriculasPendentesSelecionadas = useMemo(
    () => linhasMatriculas.filter((matricula) => matriculasSelecionadas.has(matricula.id) && matricula.status === "Pendente"),
    [linhasMatriculas, matriculasSelecionadas]
  );

  const cursosSelecionados = useMemo(
    () => [...new Set(matriculasPendentesSelecionadas.map((matricula) => Number(matricula.cursoId)))],
    [matriculasPendentesSelecionadas]
  );

  const cursoSelecionadoUnico = cursosSelecionados.length === 1 ? cursosSelecionados[0] : null;

  const turmasDisponiveisParaLote = useMemo(() => {
    if (!cursoSelecionadoUnico) {
      return [];
    }

    return turmasPorCurso.get(cursoSelecionadoUnico) || [];
  }, [cursoSelecionadoUnico, turmasPorCurso]);

  const todasPendentesSelecionadas =
    matriculasPendentes.length > 0 && matriculasPendentes.every((matricula) => matriculasSelecionadas.has(matricula.id));
  const quantidadeSelecionada = matriculasPendentesSelecionadas.length;

  useEffect(() => {
    setMatriculasSelecionadas((atuais) => {
      const proximas = new Set([...atuais].filter((id) => idsPendentes.has(id)));
      return proximas.size === atuais.size ? atuais : proximas;
    });
  }, [idsPendentes]);

  useEffect(() => {
    if (!turmaSelecionada) {
      return;
    }

    const turmaAindaValida = turmasDisponiveisParaLote.some((turma) => String(turma.id) === String(turmaSelecionada));
    if (!turmaAindaValida) {
      setTurmaSelecionada("");
    }
  }, [turmaSelecionada, turmasDisponiveisParaLote]);

  useEffect(() => {
    if (ehAluno || mostrandoPendentes) {
      return;
    }

    setMatriculasSelecionadas(new Set());
    setTurmaSelecionada("");
    setMensagem({ tone: "info", message: "" });
  }, [ehAluno, mostrandoPendentes]);

  async function executarLote(acao, mensagemSucesso) {
    try {
      setMensagem({ tone: "info", message: "" });
      setProcessandoLote(true);

      await acao();
      setMensagem({ tone: "success", message: mensagemSucesso });
      setMatriculasSelecionadas(new Set());
      setTurmaSelecionada("");
      onRefresh?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired?.();
        return;
      }

      setMensagem({ tone: "error", message: err.message || "Nao foi possivel atualizar a matricula." });
    } finally {
      setProcessandoLote(false);
    }
  }

  async function aprovarSelecionadas() {
    if (!quantidadeSelecionada) {
      setMensagem({ tone: "error", message: "Selecione ao menos uma matricula pendente." });
      return;
    }

    if (cursosSelecionados.length !== 1) {
      setMensagem({ tone: "error", message: "Para aprovar em lote, selecione matriculas do mesmo curso." });
      return;
    }

    const turmaId = Number(turmaSelecionada);
    if (!turmaId) {
      setMensagem({ tone: "error", message: "Selecione uma turma para aprovar o lote." });
      return;
    }

    await executarLote(async () => {
      for (const matricula of matriculasPendentesSelecionadas) {
        await apiRequest(`/Matriculas/${matricula.id}/aprovar`, {
          method: "PUT",
          body: JSON.stringify(turmaId)
        });
      }
    }, `${quantidadeSelecionada} matricula${quantidadeSelecionada > 1 ? "s aprovadas" : " aprovada"} com sucesso.`);
  }

  async function rejeitarSelecionadas() {
    if (!quantidadeSelecionada) {
      setMensagem({ tone: "error", message: "Selecione ao menos uma matricula pendente." });
      return;
    }

    await executarLote(async () => {
      for (const matricula of matriculasPendentesSelecionadas) {
        await apiRequest(`/Matriculas/${matricula.id}/rejeitar`, { method: "PUT" });
      }
    }, `${quantidadeSelecionada} matricula${quantidadeSelecionada > 1 ? "s rejeitadas" : " rejeitada"} com sucesso.`);
  }

  function alternarMatricula(matricula) {
    if (matricula.status !== "Pendente" || processandoLote) {
      return;
    }

    setMatriculasSelecionadas((atuais) => {
      const proximas = new Set(atuais);

      if (proximas.has(matricula.id)) {
        proximas.delete(matricula.id);
      } else {
        proximas.add(matricula.id);
      }

      return proximas;
    });
  }

  function alternarTodasPendentes() {
    if (processandoLote || !matriculasPendentes.length) {
      return;
    }

    setMatriculasSelecionadas((atuais) => {
      if (todasPendentesSelecionadas) {
        return new Set();
      }

      const proximas = new Set(atuais);
      matriculasPendentes.forEach((matricula) => proximas.add(matricula.id));
      return proximas;
    });
  }

  function renderSelecao(matricula) {
    const pendente = matricula.status === "Pendente";

    return (
      <label className="table-select-cell">
        <input
          aria-label={`Selecionar matricula de ${matricula.aluno}`}
          checked={pendente && matriculasSelecionadas.has(matricula.id)}
          className="table-select-input"
          disabled={!pendente || processandoLote}
          onChange={() => alternarMatricula(matricula)}
          type="checkbox"
        />
      </label>
    );
  }

  function renderBarraDeLote() {
    if (ehAluno) {
      return null;
    }

    const rotuloTurma =
      quantidadeSelecionada === 0
        ? "Selecione alunos pendentes"
        : cursosSelecionados.length > 1
        ? "Escolha um curso por vez"
        : turmasDisponiveisParaLote.length
        ? "Selecionar turma"
        : "Sem turma disponivel";

    return (
      <div className="table-toolbar table-toolbar--matriculas">
        <div className="table-view-toggle" aria-label="Visualizacao de matriculas">
          <button
            className={`table-view-toggle__item${mostrandoPendentes ? " table-view-toggle__item--active" : ""}`}
            onClick={() => setVisualizacaoGestor("pendentes")}
            type="button"
          >
            Pendentes ({matriculasPendentes.length})
          </button>
          <button
            className={`table-view-toggle__item${!mostrandoPendentes ? " table-view-toggle__item--active" : ""}`}
            onClick={() => setVisualizacaoGestor("aprovadas")}
            type="button"
          >
            Aprovadas ({matriculasAprovadas.length})
          </button>
        </div>
        {mostrandoPendentes ? (
        <div className="table-actions table-actions--bulk">
          <label className="table-bulk-toggle">
            <input
              checked={todasPendentesSelecionadas}
              className="table-select-input"
              disabled={processandoLote || !matriculasPendentes.length}
              onChange={alternarTodasPendentes}
              type="checkbox"
            />
            <span>Selecionar alunos pendentes</span>
          </label>
          <select
            aria-label="Turma para aprovacao em lote"
            className="table-inline-select table-inline-select--bulk"
            disabled={processandoLote || quantidadeSelecionada === 0 || cursosSelecionados.length !== 1 || !turmasDisponiveisParaLote.length}
            onChange={(event) => setTurmaSelecionada(event.target.value)}
            value={turmaSelecionada}
          >
            <option value="">{rotuloTurma}</option>
            {turmasDisponiveisParaLote.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nomeTurma}
              </option>
            ))}
          </select>
          <button className="table-action" disabled={processandoLote} onClick={aprovarSelecionadas} type="button">
            {processandoLote ? "Processando..." : "Aprovar selecionadas"}
          </button>
          <button
            className="table-action table-action--danger"
            disabled={processandoLote}
            onClick={rejeitarSelecionadas}
            type="button"
          >
            Rejeitar selecionadas
          </button>
        </div>
        ) : null}
        <p className="table-toolbar__summary">
          {mostrandoPendentes
            ? quantidadeSelecionada
              ? `${quantidadeSelecionada} selecionada${quantidadeSelecionada > 1 ? "s" : ""}`
              : `${matriculasPendentes.length} pendente${matriculasPendentes.length === 1 ? "" : "s"}`
            : `${matriculasAprovadas.length} aprovada${matriculasAprovadas.length === 1 ? "" : "s"}`}
        </p>
      </div>
    );
  }

  const colunasGestor = mostrandoPendentes
    ? [
        { key: "selecionar", label: "Selecionar", render: renderSelecao },
        { key: "id", label: "ID" },
        { key: "aluno", label: "Aluno" },
        { key: "curso", label: "Curso" },
        { key: "turma", label: "Turma" },
        {
          key: "status",
          label: "Status",
          render: (matricula) => <StatusPill tone={statusTone(matricula.status)}>{matricula.status}</StatusPill>
        },
        { key: "dataSolicitacao", label: "Solicitada em", render: (matricula) => formatDate(matricula.dataSolicitacao) }
      ]
    : [
        { key: "id", label: "ID" },
        { key: "aluno", label: "Aluno" },
        { key: "curso", label: "Curso" },
        { key: "turma", label: "Turma" },
        {
          key: "status",
          label: "Status",
          render: (matricula) => <StatusPill tone={statusTone(matricula.status)}>{matricula.status}</StatusPill>
        },
        { key: "notaFinal", label: "Nota", render: (matricula) => formatGrade(matricula.notaFinal) },
        { key: "dataSolicitacao", label: "Solicitada em", render: (matricula) => formatDate(matricula.dataSolicitacao) }
      ];

  return (
    <PanelCard
      description={
        ehAluno
          ? "Suas solicitacoes e vinculacoes atuais."
          : "Acompanhe a fila de alunos pendentes e consulte as matriculas ja aprovadas."
      }
      title={ehAluno ? "Minhas matriculas" : "Fluxo de matriculas"}
    >
      {renderBarraDeLote()}
      {!ehAluno && mensagem.message ? <InlineMessage tone={mensagem.tone}>{mensagem.message}</InlineMessage> : null}
      <DataTable
        columns={
          ehAluno
            ? [
                { key: "curso", label: "Curso" },
                { key: "turma", label: "Turma" },
                {
                  key: "status",
                  label: "Status",
                  render: (matricula) => <StatusPill tone={statusTone(matricula.status)}>{matricula.status}</StatusPill>
                },
                { key: "notaFinal", label: "Nota", render: (matricula) => formatGrade(matricula.notaFinal) },
                { key: "dataSolicitacao", label: "Solicitada em", render: (matricula) => formatDate(matricula.dataSolicitacao) }
              ]
            : colunasGestor
        }
        emptyMessage={
          ehAluno
            ? "Nenhuma matricula encontrada."
            : mostrandoPendentes
            ? "Nenhum aluno pendente de aprovacao."
            : "Nenhuma matricula aprovada encontrada."
        }
        rows={linhasVisiveis}
      />
    </PanelCard>
  );
}
