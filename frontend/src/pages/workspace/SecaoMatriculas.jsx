import { useEffect, useMemo, useState } from "react";
import { DataTable, InlineMessage, PanelCard, StatusPill } from "../../components/Primitives.jsx";
import { ApiError, apiRequest } from "../../lib/api.js";
import { formatDate, formatGrade, statusTone } from "../../lib/format.js";

export function SecaoMatriculas({ ehAluno, linhasMatriculas, onRefresh, onSessionExpired }) {
  const [mensagem, setMensagem] = useState({ tone: "info", message: "" });
  const [processandoLote, setProcessandoLote] = useState(false);
  const [matriculasSelecionadas, setMatriculasSelecionadas] = useState(() => new Set());
  const [visualizacaoGestor, setVisualizacaoGestor] = useState("pendentes");

  const matriculasPendentes = useMemo(
    () => linhasMatriculas.filter((matricula) => matricula.status === "Pendente"),
    [linhasMatriculas]
  );
  const matriculasAprovadas = useMemo(
    () => linhasMatriculas.filter((matricula) => matricula.status === "Aprovada"),
    [linhasMatriculas]
  );
  const matriculasRejeitadas = useMemo(
    () => linhasMatriculas.filter((matricula) => matricula.status === "Rejeitada"),
    [linhasMatriculas]
  );
  const mostrandoPendentes = ehAluno || visualizacaoGestor === "pendentes";
  const mostrandoAprovadas = !ehAluno && visualizacaoGestor === "aprovadas";
  const mostrandoRejeitadas = !ehAluno && visualizacaoGestor === "rejeitadas";
  const linhasVisiveis = ehAluno
    ? linhasMatriculas
    : mostrandoPendentes
      ? matriculasPendentes
      : mostrandoAprovadas
        ? matriculasAprovadas
        : matriculasRejeitadas;

  const idsPendentes = useMemo(() => new Set(matriculasPendentes.map((matricula) => matricula.id)), [matriculasPendentes]);

  const matriculasPendentesSelecionadas = useMemo(
    () => linhasMatriculas.filter((matricula) => matriculasSelecionadas.has(matricula.id) && matricula.status === "Pendente"),
    [linhasMatriculas, matriculasSelecionadas]
  );

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
    if (ehAluno || mostrandoPendentes) {
      return;
    }

    setMatriculasSelecionadas(new Set());
    setMensagem({ tone: "info", message: "" });
  }, [ehAluno, mostrandoPendentes]);

  async function executarLote(acao, resolverFeedback) {
    try {
      setMensagem({ tone: "info", message: "" });
      setProcessandoLote(true);

      const resultado = await acao();
      const feedback =
        typeof resolverFeedback === "function"
          ? resolverFeedback(resultado)
          : { tone: "success", message: resolverFeedback };

      setMensagem(feedback);
      if (feedback.tone !== "error") {
        setMatriculasSelecionadas(new Set());
      }
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

  function montarFeedbackAprovacao(resultado) {
    const aprovadas = Number(resultado?.totalAprovado ?? resultado?.aprovadas?.length ?? 0);
    const erros = Array.isArray(resultado?.erros) ? resultado.erros : [];
    const resumoErros = erros
      .slice(0, 3)
      .map((erro) => {
        const rotulo = erro.nomeAluno || erro.codigoRegistro || `Matricula #${erro.matriculaId}`;
        return erro.motivo ? `${rotulo} (${erro.motivo})` : rotulo;
      })
      .join(", ");
    const complementoErros =
      erros.length > 3 ? ` e mais ${erros.length - 3}` : "";

    if (aprovadas > 0 && erros.length > 0) {
      return {
        tone: "warning",
        message: `${aprovadas} matricula${aprovadas > 1 ? "s aprovadas" : " aprovada"}. ${erros.length} nao ${erros.length > 1 ? "foram aprovadas" : "foi aprovada"}: ${resumoErros}${complementoErros}.`
      };
    }

    if (aprovadas > 0) {
      return {
        tone: "success",
        message: `${aprovadas} matricula${aprovadas > 1 ? "s aprovadas" : " aprovada"} automaticamente com sucesso.`
      };
    }

    if (erros.length > 0) {
      return {
        tone: "error",
        message: `Nenhuma matricula foi aprovada. Verifique turma padrao cadastrada para: ${resumoErros}${complementoErros}.`
      };
    }

    return { tone: "info", message: "Nenhuma matricula pendente foi alterada." };
  }

  async function aprovarSelecionadas() {
    if (!quantidadeSelecionada) {
      setMensagem({ tone: "error", message: "Selecione ao menos uma matricula pendente." });
      return;
    }

    await executarLote(async () => {
      return apiRequest("/Matriculas/aprovar-lote", {
        method: "PUT",
        body: JSON.stringify({
          matriculaIds: matriculasPendentesSelecionadas.map((matricula) => matricula.id)
        })
      });
    }, montarFeedbackAprovacao);
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
            className={`table-view-toggle__item${mostrandoAprovadas ? " table-view-toggle__item--active" : ""}`}
            onClick={() => setVisualizacaoGestor("aprovadas")}
            type="button"
          >
            Aprovadas ({matriculasAprovadas.length})
          </button>
          <button
            className={`table-view-toggle__item${mostrandoRejeitadas ? " table-view-toggle__item--active" : ""}`}
            onClick={() => setVisualizacaoGestor("rejeitadas")}
            type="button"
          >
            Rejeitadas ({matriculasRejeitadas.length})
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
            : mostrandoAprovadas
              ? `${matriculasAprovadas.length} aprovada${matriculasAprovadas.length === 1 ? "" : "s"}`
              : `${matriculasRejeitadas.length} rejeitada${matriculasRejeitadas.length === 1 ? "" : "s"}`}
        </p>
      </div>
    );
  }

  const colunasPendentesGestor = [
    { key: "selecionar", label: "Selecionar", render: renderSelecao },
    {
      key: "codigoRegistro",
      label: "PROTOCOLO DA SOLICITACAO",
      render: (matricula) => matricula.codigoRegistro || "Sem protocolo"
    },
    { key: "aluno", label: "Aluno" },
    { key: "curso", label: "Curso" },
    { key: "turma", label: "Turma padrao" },
    {
      key: "status",
      label: "Status",
      render: (matricula) => <StatusPill tone={statusTone(matricula.status)}>{matricula.status}</StatusPill>
    },
    { key: "dataSolicitacao", label: "Solicitada em", render: (matricula) => formatDate(matricula.dataSolicitacao) }
  ];

  const colunasAprovadasGestor = [
    {
      key: "codigoRegistro",
      label: "PROTOCOLO DA SOLICITACAO",
      render: (matricula) => matricula.codigoRegistro || "Sem protocolo"
    },
    { key: "aluno", label: "Aluno" },
    { key: "curso", label: "Curso" },
    { key: "turma", label: "Turma padrao" },
    {
      key: "status",
      label: "Status",
      render: (matricula) => <StatusPill tone={statusTone(matricula.status)}>{matricula.status}</StatusPill>
    },
    { key: "dataSolicitacao", label: "Solicitada em", render: (matricula) => formatDate(matricula.dataSolicitacao) }
  ];

  const colunasRejeitadasGestor = [
    {
      key: "codigoRegistro",
      label: "PROTOCOLO DA SOLICITACAO",
      render: (matricula) => matricula.codigoRegistro || "Sem protocolo"
    },
    { key: "aluno", label: "Aluno" },
    { key: "curso", label: "Curso" },
    { key: "turma", label: "Turma padrao" },
    {
      key: "status",
      label: "Status",
      render: (matricula) => <StatusPill tone={statusTone(matricula.status)}>{matricula.status}</StatusPill>
    },
    { key: "dataSolicitacao", label: "Solicitada em", render: (matricula) => formatDate(matricula.dataSolicitacao) }
  ];

  const colunasGestor = mostrandoPendentes
    ? colunasPendentesGestor
    : mostrandoAprovadas
      ? colunasAprovadasGestor
      : colunasRejeitadasGestor;

  return (
    <PanelCard
      description={
        ehAluno
          ? "Suas solicitacoes e vinculacoes atuais."
          : "Acompanhe a fila de alunos pendentes e consulte as matriculas aprovadas ou rejeitadas."
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
                { key: "turma", label: "Turma padrao" },
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
            : mostrandoAprovadas
              ? "Nenhuma matricula aprovada encontrada."
              : "Nenhuma matricula rejeitada encontrada."
        }
        rows={linhasVisiveis}
      />
    </PanelCard>
  );
}
