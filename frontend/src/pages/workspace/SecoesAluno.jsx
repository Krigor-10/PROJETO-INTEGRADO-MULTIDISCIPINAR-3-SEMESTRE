import { useEffect, useMemo, useState } from "react";
import { DataTable, EmptyState, InlineMessage, PanelCard, RouteLink, StatusPill } from "../../components/Primitives.jsx";
import { ApiError, apiRequest } from "../../lib/api.js";
import { mapById } from "../../lib/dashboard.js";
import {
  compactText,
  formatDate,
  formatGrade,
  formatPercent,
  normalizeContentType,
  normalizePublicationStatus,
  normalizeProgressStatus,
  normalizeStatus,
  parseApiDate,
  progressStatusTone,
  publicationStatusTone,
  timestampFromApiDate
} from "../../lib/format.js";

export function SecaoCursosAluno({ avaliacoes = [], conteudos, cursos, matriculas, onNavigate, progressos = {}, turmas }) {
  const [matriculaEmDetalheId, setMatriculaEmDetalheId] = useState(null);
  const [modulosAbertos, setModulosAbertos] = useState({});
  const cursoPorId = useMemo(() => mapById(cursos), [cursos]);
  const turmaPorId = useMemo(() => mapById(turmas), [turmas]);
  const progressoCursoPorMatricula = useMemo(
    () => new Map((progressos.cursos || []).map((progresso) => [progresso.matriculaId, progresso])),
    [progressos.cursos]
  );
  const progressoModuloPorChave = useMemo(
    () => new Map((progressos.modulos || []).map((progresso) => [`${progresso.matriculaId}-${progresso.moduloId}`, progresso])),
    [progressos.modulos]
  );
  const progressoConteudoPorConteudoId = useMemo(
    () => new Map((progressos.conteudos || []).map((progresso) => [progresso.conteudoDidaticoId, progresso])),
    [progressos.conteudos]
  );

  const resumoConteudosPorTurma = useMemo(() => {
    const resumo = new Map();

    conteudos.forEach((conteudo) => {
      const resumoAtual = resumo.get(conteudo.turmaId) || {
        total: 0,
        modulos: new Set(),
        ultimaPublicacao: null
      };

      resumoAtual.total += 1;
      resumoAtual.modulos.add(conteudo.moduloId);

      const dataCandidata = conteudo.publicadoEm || conteudo.atualizadoEm || conteudo.criadoEm || null;
      if (!resumoAtual.ultimaPublicacao || timestampFromApiDate(dataCandidata) > timestampFromApiDate(resumoAtual.ultimaPublicacao)) {
        resumoAtual.ultimaPublicacao = dataCandidata;
      }

      resumo.set(conteudo.turmaId, resumoAtual);
    });

    return resumo;
  }, [conteudos]);

  const linhasMatriculasAprovadas = useMemo(
    () =>
      [...matriculas]
        .filter((matricula) => normalizeStatus(matricula.status) === "Aprovada")
        .sort((matriculaA, matriculaB) => {
          const tituloCursoA = cursoPorId.get(matriculaA.cursoId)?.titulo || "";
          const tituloCursoB = cursoPorId.get(matriculaB.cursoId)?.titulo || "";
          const comparacaoCurso = tituloCursoA.localeCompare(tituloCursoB, "pt-BR");

          if (comparacaoCurso !== 0) {
            return comparacaoCurso;
          }

          const nomeTurmaA = turmaPorId.get(matriculaA.turmaId)?.nomeTurma || "";
          const nomeTurmaB = turmaPorId.get(matriculaB.turmaId)?.nomeTurma || "";
          return nomeTurmaA.localeCompare(nomeTurmaB, "pt-BR");
        })
        .map((matricula) => {
          const resumoTurma = resumoConteudosPorTurma.get(matricula.turmaId) || null;
          const progressoCurso = progressoCursoPorMatricula.get(matricula.id);

          return {
            id: matricula.id,
            cursoId: matricula.cursoId,
            curso: cursoPorId.get(matricula.cursoId)?.titulo || `Curso #${matricula.cursoId}`,
            turmaId: matricula.turmaId,
            turma: turmaPorId.get(matricula.turmaId)?.nomeTurma || matricula.turma?.nomeTurma || "Turma em definicao",
            materiais: resumoTurma?.total || 0,
            modulos: resumoTurma?.modulos.size || 0,
            progresso: progressoCurso?.percentualConclusao || 0,
            ultimaPublicacao: resumoTurma?.ultimaPublicacao || null,
            notaFinal: matricula.notaFinal ?? 0
          };
        }),
    [cursoPorId, matriculas, progressoCursoPorMatricula, resumoConteudosPorTurma, turmaPorId]
  );

  useEffect(() => {
    if (!linhasMatriculasAprovadas.length) {
      setMatriculaEmDetalheId(null);
      return;
    }

    if (!linhasMatriculasAprovadas.some((linha) => linha.id === matriculaEmDetalheId)) {
      setMatriculaEmDetalheId(linhasMatriculasAprovadas[0].id);
    }
  }, [linhasMatriculasAprovadas, matriculaEmDetalheId]);

  const detalheCursoSelecionado = useMemo(() => {
    const linha = linhasMatriculasAprovadas.find((item) => item.id === matriculaEmDetalheId);
    if (!linha) {
      return null;
    }

    const grupos = new Map();
    const avaliacoesDaTurma = avaliacoes.filter((avaliacao) => avaliacao.turmaId === linha.turmaId);

    function garantirGrupo(moduloId, tituloModulo) {
      const chave = moduloId || `sem-modulo-${tituloModulo || "geral"}`;
      const grupo = grupos.get(chave) || {
        id: chave,
        moduloId,
        titulo: tituloModulo || "Modulo sem titulo",
        conteudos: [],
        avaliacoes: []
      };

      grupos.set(chave, grupo);
      return grupo;
    }

    conteudos
      .filter((conteudo) => conteudo.turmaId === linha.turmaId)
      .sort((conteudoA, conteudoB) => {
        const comparacaoModulo = (conteudoA.moduloTitulo || "").localeCompare(conteudoB.moduloTitulo || "", "pt-BR");
        if (comparacaoModulo !== 0) {
          return comparacaoModulo;
        }

        if ((conteudoA.ordemExibicao ?? 0) !== (conteudoB.ordemExibicao ?? 0)) {
          return (conteudoA.ordemExibicao ?? 0) - (conteudoB.ordemExibicao ?? 0);
        }

        return (conteudoA.titulo || "").localeCompare(conteudoB.titulo || "", "pt-BR");
      })
      .forEach((conteudo) => {
        const grupo = garantirGrupo(conteudo.moduloId, conteudo.moduloTitulo);
        grupo.conteudos.push(conteudo);
      });

    avaliacoesDaTurma.forEach((avaliacao) => {
      const grupo = garantirGrupo(avaliacao.moduloId, avaliacao.moduloTitulo);
      grupo.avaliacoes.push(avaliacao);
    });

    const modulos = [...grupos.values()].map((grupo) => {
      const progressoModulo = progressoModuloPorChave.get(`${linha.id}-${grupo.moduloId}`);
      const concluidos = progressoModulo?.conteudosConcluidos ?? grupo.conteudos.filter((conteudo) => estaConcluido(progressoConteudoPorConteudoId.get(conteudo.id))).length;
      const conteudosComProgresso = grupo.conteudos.map((conteudo) => {
        const progressoConteudo = progressoConteudoPorConteudoId.get(conteudo.id);

        return {
          ...conteudo,
          concluido: estaConcluido(progressoConteudo),
          progresso: progressoConteudo?.percentualConclusao || 0,
          statusProgresso: progressoConteudo?.statusProgresso || 1
        };
      });

      return {
        ...grupo,
        conteudos: conteudosComProgresso,
        avaliacoes: grupo.avaliacoes.sort((avaliacaoA, avaliacaoB) =>
          (avaliacaoA.titulo || "").localeCompare(avaliacaoB.titulo || "", "pt-BR")
        ),
        concluidos,
        progresso: progressoModulo?.percentualConclusao || calcularProgressoModulo(conteudosComProgresso),
        status: progressoModulo?.statusProgresso || 1
      };
    });

    const proximaAcao = obterProximaAcaoCurso(modulos);

    return {
      ...linha,
      modulos,
      proximaAcao
    };
  }, [avaliacoes, conteudos, linhasMatriculasAprovadas, matriculaEmDetalheId, progressoConteudoPorConteudoId, progressoModuloPorChave]);

  useEffect(() => {
    if (!detalheCursoSelecionado?.modulos.length) {
      return;
    }

    const moduloPadrao = detalheCursoSelecionado.proximaAcao?.moduloId || detalheCursoSelecionado.modulos[0].id;

    setModulosAbertos((atuais) => {
      if (atuais[moduloPadrao]) {
        return atuais;
      }

      return {
        ...atuais,
        [moduloPadrao]: true
      };
    });
  }, [detalheCursoSelecionado?.modulos, detalheCursoSelecionado?.proximaAcao?.moduloId]);

  function alternarModuloJornada(moduloId) {
    setModulosAbertos((atuais) => ({
      ...atuais,
      [moduloId]: !atuais[moduloId]
    }));
  }

  return (
    <div className="content-section content-section--student">
      <div className={`module-management-layout${detalheCursoSelecionado ? " module-management-layout--with-detail" : ""}`}>
        <PanelCard
          description="Cursos com matricula aprovada, materiais publicados e progresso consolidado por turma."
          title="Minha jornada ativa"
        >
          <DataTable
            columns={[
              { key: "curso", label: "Curso" },
              { key: "turma", label: "Turma" },
              { key: "materiais", label: "Materiais" },
              { key: "modulos", label: "Modulos" },
              { key: "progresso", label: "Progresso", render: (row) => formatPercent(row.progresso) },
              { key: "ultimaPublicacao", label: "Ultima publicacao", render: (row) => formatDate(row.ultimaPublicacao) },
              { key: "notaFinal", label: "Nota atual", render: (row) => formatGrade(row.notaFinal) },
              {
                key: "detalhe",
                label: "",
                render: (row) => (
                  <button
                    aria-label={`Abrir modulos de ${row.curso}`}
                    className="table-row-arrow"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMatriculaEmDetalheId(row.id);
                    }}
                    type="button"
                  >
                    &gt;
                  </button>
                )
              }
            ]}
            emptyMessage="Assim que uma matricula for aprovada, os seus cursos ativos vao aparecer aqui."
            getRowAriaLabel={(row) => `Abrir modulos de ${row.curso}`}
            getRowClassName={(row) =>
              `table-row--clickable${row.id === matriculaEmDetalheId ? " table-row--selected" : ""}`
            }
            onRowClick={(row) => setMatriculaEmDetalheId(row.id)}
            rows={linhasMatriculasAprovadas}
          />
        </PanelCard>

        {detalheCursoSelecionado ? (
          <aside className="module-detail-column student-course-detail" aria-label="Detalhes do curso selecionado">
            <PanelCard
              description={`${detalheCursoSelecionado.turma} - ${detalheCursoSelecionado.materiais} material(is) publicado(s)`}
              title={detalheCursoSelecionado.curso}
            >
              <div className="student-course-detail__summary">
                <span className="chip">{formatPercent(detalheCursoSelecionado.progresso)} de progresso</span>
                <span className="chip">{detalheCursoSelecionado.modulos.length} modulo(s)</span>
                <span className="chip">{formatGrade(detalheCursoSelecionado.notaFinal)} nota atual</span>
              </div>

              <div className="student-course-detail__next">
                <span>Proxima acao</span>
                <strong>{detalheCursoSelecionado.proximaAcao.titulo}</strong>
                <p>{detalheCursoSelecionado.proximaAcao.descricao}</p>
                {detalheCursoSelecionado.proximaAcao.to ? (
                  <RouteLink className="table-action student-course-detail__action" onNavigate={onNavigate} to={detalheCursoSelecionado.proximaAcao.to}>
                    {detalheCursoSelecionado.proximaAcao.label}
                  </RouteLink>
                ) : (
                  <StatusPill tone={detalheCursoSelecionado.proximaAcao.tone || "success"}>
                    {detalheCursoSelecionado.proximaAcao.label}
                  </StatusPill>
                )}
              </div>

              {detalheCursoSelecionado.modulos.length ? (
                <div className="student-course-detail__journey">
                  {detalheCursoSelecionado.modulos.map((modulo) => (
                    <article className="module-detail-card student-course-detail__module" key={modulo.id}>
                      <button
                        aria-expanded={Boolean(modulosAbertos[modulo.id])}
                        className="student-course-detail__module-toggle"
                        onClick={() => alternarModuloJornada(modulo.id)}
                        type="button"
                      >
                        <div>
                          <span>Modulo</span>
                          <strong>{modulo.titulo}</strong>
                        </div>
                        <div className="student-course-detail__module-status">
                          <StatusPill tone={progressStatusTone(modulo.status)}>{normalizeProgressStatus(modulo.status)}</StatusPill>
                          <span aria-hidden="true">{modulosAbertos[modulo.id] ? "-" : "+"}</span>
                        </div>
                      </button>

                      {modulosAbertos[modulo.id] ? (
                        <div className="student-course-detail__module-body">
                          <div className="student-content-card__progress">
                            <StatusPill tone={progressStatusTone(modulo.status)}>
                              {modulo.concluidos}/{modulo.conteudos.length} conteudo(s)
                            </StatusPill>
                            <div className="student-progress-bar" aria-hidden="true">
                              <span style={{ width: `${Math.max(0, Math.min(modulo.progresso, 100))}%` }} />
                            </div>
                          </div>

                          {modulo.conteudos.length ? (
                            <ul className="student-course-detail__content-list">
                              {modulo.conteudos.map((conteudo) => (
                                <li key={conteudo.id}>
                                  <span>{normalizeContentType(conteudo.tipoConteudo)}</span>
                                  <strong>{conteudo.titulo}</strong>
                                  <StatusPill tone={conteudo.concluido ? "success" : progressStatusTone(conteudo.statusProgresso)}>
                                    {conteudo.concluido ? "Concluido" : normalizeProgressStatus(conteudo.statusProgresso)}
                                  </StatusPill>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="student-course-note">Nenhum conteudo publicado neste modulo.</p>
                          )}

                          {modulo.avaliacoes.length ? (
                            <div className="student-course-detail__evaluation-list">
                              <span>Avaliacoes do modulo</span>
                              {modulo.avaliacoes.map((avaliacao) => {
                                const disponibilidade = obterDisponibilidadeAvaliacao(avaliacao);

                                return (
                                  <article key={avaliacao.id}>
                                    <div>
                                      <strong>{avaliacao.titulo}</strong>
                                      <p>{normalizeEvaluationType(avaliacao.tipoAvaliacao)} - {avaliacao.totalQuestoes || 0} questao(oes)</p>
                                    </div>
                                    <StatusPill tone={disponibilidade.tone}>{disponibilidade.label}</StatusPill>
                                  </article>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState message="Este curso ainda nao possui modulos publicados para a sua turma." />
              )}

              {detalheCursoSelecionado.materiais ? (
                <RouteLink className="table-action student-course-detail__action" onNavigate={onNavigate} to="/app/conteudos">
                  Abrir materiais
                </RouteLink>
              ) : null}
            </PanelCard>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export function SecaoAvaliacoesAluno({ avaliacoes, onRefresh, onSessionExpired }) {
  const [avaliacaoEmExecucao, setAvaliacaoEmExecucao] = useState(null);
  const [questoes, setQuestoes] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [carregandoQuestoes, setCarregandoQuestoes] = useState(false);
  const [enviandoRespostas, setEnviandoRespostas] = useState(false);
  const [mensagem, setMensagem] = useState({ tone: "", message: "" });

  const avaliacoesOrdenadas = useMemo(
    () =>
      [...avaliacoes].sort((avaliacaoA, avaliacaoB) => {
        const cursoA = avaliacaoA.cursoTitulo || "";
        const cursoB = avaliacaoB.cursoTitulo || "";
        const comparacaoCurso = cursoA.localeCompare(cursoB, "pt-BR");

        if (comparacaoCurso !== 0) {
          return comparacaoCurso;
        }

        const aberturaA = timestampFromApiDate(avaliacaoA.dataAbertura || avaliacaoA.publicadoEm);
        const aberturaB = timestampFromApiDate(avaliacaoB.dataAbertura || avaliacaoB.publicadoEm);
        return aberturaA - aberturaB;
      }),
    [avaliacoes]
  );

  useEffect(() => {
    if (!avaliacaoEmExecucao) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !enviandoRespostas) {
        fecharExecucaoAvaliacao();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [avaliacaoEmExecucao, enviandoRespostas]);

  async function abrirExecucaoAvaliacao(avaliacao) {
    const disponibilidade = obterDisponibilidadeAvaliacao(avaliacao);
    if (!disponibilidade.podeRealizar) {
      setMensagem({ tone: "warning", message: disponibilidade.mensagem });
      return;
    }

    setAvaliacaoEmExecucao(avaliacao);
    setQuestoes([]);
    setRespostas({});
    setMensagem({ tone: "", message: "" });
    setCarregandoQuestoes(true);

    try {
      const proximasQuestoes = await apiRequest(`/Avaliacoes/${avaliacao.id}/aluno/questoes`);
      setQuestoes(proximasQuestoes);
      setRespostas(criarRespostasIniciais(proximasQuestoes));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired?.();
        return;
      }

      setMensagem({ tone: "error", message: err.message || "Nao foi possivel carregar as questoes agora." });
    } finally {
      setCarregandoQuestoes(false);
    }
  }

  function fecharExecucaoAvaliacao() {
    if (enviandoRespostas) {
      return;
    }

    setAvaliacaoEmExecucao(null);
    setQuestoes([]);
    setRespostas({});
    setMensagem({ tone: "", message: "" });
  }

  function atualizarAlternativa(questaoId, alternativaId) {
    setRespostas((current) => ({
      ...current,
      [questaoId]: {
        ...(current[questaoId] || { questaoId }),
        alternativaId,
        respostaTexto: ""
      }
    }));
  }

  function atualizarRespostaTexto(questaoId, respostaTexto) {
    setRespostas((current) => ({
      ...current,
      [questaoId]: {
        ...(current[questaoId] || { questaoId }),
        alternativaId: null,
        respostaTexto
      }
    }));
  }

  async function enviarRespostas(event) {
    event.preventDefault();

    if (!avaliacaoEmExecucao || !questoes.length) {
      return;
    }

    const pendente = questoes.find((questao) => {
      const resposta = respostas[questao.id];

      if (Number(questao.tipoQuestao) === 3) {
        return !String(resposta?.respostaTexto || "").trim();
      }

      return !resposta?.alternativaId;
    });

    if (pendente) {
      setMensagem({ tone: "error", message: `Responda a questao ${pendente.ordem} antes de enviar.` });
      return;
    }

    const payload = {
      respostas: questoes.map((questao) => {
        const resposta = respostas[questao.id];

        return {
          questaoId: questao.id,
          alternativaId: resposta?.alternativaId || null,
          respostaTexto: String(resposta?.respostaTexto || "").trim()
        };
      })
    };

    setEnviandoRespostas(true);
    setMensagem({ tone: "", message: "" });

    try {
      const tentativa = await apiRequest(`/Avaliacoes/${avaliacaoEmExecucao.id}/aluno/respostas`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const nota =
        Number(tentativa.statusTentativa) === 3
          ? ` Nota: ${formatScore(tentativa.notaBruta)} de ${formatScore(tentativa.notaMaxima)}.`
          : " Respostas discursivas aguardam correcao do professor.";

      setMensagem({ tone: "success", message: `Avaliacao enviada com sucesso.${nota}` });
      onRefresh?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired?.();
        return;
      }

      setMensagem({ tone: "error", message: err.message || "Nao foi possivel enviar a avaliacao agora." });
    } finally {
      setEnviandoRespostas(false);
    }
  }

  return (
    <div className="content-section content-section--student">
      {!avaliacaoEmExecucao && mensagem.message ? <InlineMessage tone={mensagem.tone}>{mensagem.message}</InlineMessage> : null}

      <PanelCard
        description="Somente avaliacoes publicadas para as suas turmas aprovadas aparecem nesta lista."
        title="Realizar avaliacao"
      >
        <DataTable
          columns={[
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
              key: "turma",
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
              key: "periodo",
              label: "Periodo",
              render: (row) => (
                <div className="table-cell-stack">
                  <strong>{row.dataAbertura ? formatDate(row.dataAbertura) : "Aberta"}</strong>
                  <p>{row.dataFechamento ? `Fecha em ${formatDate(row.dataFechamento)}` : "Sem fechamento"}</p>
                </div>
              )
            },
            {
              key: "tentativas",
              label: "Tentativas",
              render: (row) => `${row.tentativasRealizadas || 0}/${row.tentativasPermitidas || 1}`
            },
            {
              key: "status",
              label: "Status",
              render: (row) => {
                const disponibilidade = obterDisponibilidadeAvaliacao(row);

                return (
                  <div className="table-cell-stack">
                    <StatusPill tone={disponibilidade.tone}>{disponibilidade.label}</StatusPill>
                    <p>{row.ultimaNota !== null && row.ultimaNota !== undefined ? `Ultima nota ${formatScore(row.ultimaNota)}` : `${row.totalQuestoes || 0} questao(oes)`}</p>
                  </div>
                );
              }
            },
            {
              key: "acoes",
              label: "Acao",
              render: (row) => {
                const disponibilidade = obterDisponibilidadeAvaliacao(row);

                return (
                  <button
                    className="table-action"
                    disabled={!disponibilidade.podeRealizar || carregandoQuestoes || enviandoRespostas}
                    onClick={() => abrirExecucaoAvaliacao(row)}
                    type="button"
                  >
                    Realizar avaliacao
                  </button>
                );
              }
            }
          ]}
          emptyMessage="Quando um professor publicar uma avaliacao para sua turma, ela aparecera aqui."
          rows={avaliacoesOrdenadas}
        />
      </PanelCard>

      {avaliacaoEmExecucao ? (
        <div
          className="content-form-modal"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharExecucaoAvaliacao();
            }
          }}
        >
          <div
            aria-label="Realizar avaliacao"
            aria-modal="true"
            className="content-form-modal__card"
            role="dialog"
          >
            <button
              className="content-form-modal__close"
              disabled={enviandoRespostas}
              onClick={fecharExecucaoAvaliacao}
              type="button"
            >
              Fechar
            </button>
            <PanelCard
              description={`${avaliacaoEmExecucao.cursoTitulo || "Curso"} - ${avaliacaoEmExecucao.turmaNome || "Turma"}`}
              title={avaliacaoEmExecucao.titulo}
            >
              {mensagem.message ? <InlineMessage tone={mensagem.tone}>{mensagem.message}</InlineMessage> : null}

              {carregandoQuestoes ? (
                <EmptyState message="Carregando questoes da avaliacao." />
              ) : (
                <form className="student-evaluation-form" onSubmit={enviarRespostas}>
                  {questoes.map((questao) => (
                    <article className="student-evaluation-question" key={questao.id}>
                      <div className="student-evaluation-question__header">
                        <div>
                          <div className="table-badge-list">
                            <span className="chip">Questao {questao.ordem}</span>
                            <span className="chip">{normalizeQuestionType(questao.tipoQuestao)}</span>
                            <span className="chip">{formatScore(questao.pontos)} ponto(s)</span>
                          </div>
                          <h3>{questao.enunciado}</h3>
                        </div>
                      </div>

                      {questao.contexto ? <p className="student-evaluation-question__context">{questao.contexto}</p> : null}

                      {Number(questao.tipoQuestao) === 3 ? (
                        <label className="management-field management-field--wide">
                          <span>Resposta</span>
                          <textarea
                            disabled={enviandoRespostas}
                            onChange={(event) => atualizarRespostaTexto(questao.id, event.target.value)}
                            placeholder="Digite sua resposta."
                            value={respostas[questao.id]?.respostaTexto || ""}
                          />
                        </label>
                      ) : (
                        <div className="student-evaluation-options">
                          {questao.alternativas.map((alternativa) => (
                            <label className="student-evaluation-option" key={alternativa.id}>
                              <input
                                checked={respostas[questao.id]?.alternativaId === alternativa.id}
                                disabled={enviandoRespostas}
                                name={`questao-${questao.id}`}
                                onChange={() => atualizarAlternativa(questao.id, alternativa.id)}
                                type="radio"
                              />
                              <span>{alternativa.letra}</span>
                              <strong>{alternativa.texto}</strong>
                            </label>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}

                  <div className="management-form__actions">
                    <button className="solid-button" disabled={enviandoRespostas || carregandoQuestoes} type="submit">
                      {enviandoRespostas ? "Enviando..." : "Enviar avaliacao"}
                    </button>
                    <button
                      className="button button--secondary exit-button"
                      disabled={enviandoRespostas}
                      onClick={fecharExecucaoAvaliacao}
                      type="button"
                    >
                      Fechar
                    </button>
                  </div>
                </form>
              )}
            </PanelCard>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SecaoConteudosAluno({ conteudos, matriculas, onRefresh, onSessionExpired, progressos = {} }) {
  const [mensagem, setMensagem] = useState({ tone: "info", message: "" });
  const [conteudoProcessando, setConteudoProcessando] = useState(null);

  const matriculasAprovadas = useMemo(
    () =>
      [...matriculas]
        .filter((matricula) => normalizeStatus(matricula.status) === "Aprovada")
        .sort((matriculaA, matriculaB) => {
          const tituloCursoA = matriculaA.curso?.titulo || "";
          const tituloCursoB = matriculaB.curso?.titulo || "";
          const comparacaoCurso = tituloCursoA.localeCompare(tituloCursoB, "pt-BR");

          if (comparacaoCurso !== 0) {
            return comparacaoCurso;
          }

          return (matriculaA.turma?.nomeTurma || "").localeCompare(matriculaB.turma?.nomeTurma || "", "pt-BR");
        }),
    [matriculas]
  );

  const progressosConteudos = progressos.conteudos || [];
  const progressosCursos = progressos.cursos || [];

  const progressoConteudoPorConteudoId = useMemo(
    () => new Map(progressosConteudos.map((progresso) => [progresso.conteudoDidaticoId, progresso])),
    [progressosConteudos]
  );

  const conteudosOrdenados = useMemo(
    () =>
      [...conteudos].sort((conteudoA, conteudoB) => {
        const tituloCursoA = conteudoA.cursoTitulo || "";
        const tituloCursoB = conteudoB.cursoTitulo || "";
        const comparacaoCurso = tituloCursoA.localeCompare(tituloCursoB, "pt-BR");

        if (comparacaoCurso !== 0) {
          return comparacaoCurso;
        }

        const comparacaoTurma = (conteudoA.turmaNome || "").localeCompare(conteudoB.turmaNome || "", "pt-BR");
        if (comparacaoTurma !== 0) {
          return comparacaoTurma;
        }

        const comparacaoModulo = (conteudoA.moduloTitulo || "").localeCompare(conteudoB.moduloTitulo || "", "pt-BR");
        if (comparacaoModulo !== 0) {
          return comparacaoModulo;
        }

        if ((conteudoA.ordemExibicao ?? 0) !== (conteudoB.ordemExibicao ?? 0)) {
          return (conteudoA.ordemExibicao ?? 0) - (conteudoB.ordemExibicao ?? 0);
        }

        return (conteudoA.titulo || "").localeCompare(conteudoB.titulo || "", "pt-BR");
      }),
    [conteudos]
  );

  async function marcarConteudoConcluido(conteudoId) {
    try {
      setMensagem({ tone: "info", message: "" });
      setConteudoProcessando(conteudoId);

      await apiRequest(`/Progressos/conteudos/${conteudoId}/concluir`, { method: "PUT" });
      setMensagem({ tone: "success", message: "Conteudo marcado como concluido." });
      onRefresh?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired?.();
        return;
      }

      setMensagem({ tone: "error", message: err.message || "Nao foi possivel atualizar o progresso." });
    } finally {
      setConteudoProcessando(null);
    }
  }

  const resumoAluno = useMemo(() => {
    const turmasUnicas = new Set(conteudosOrdenados.map((conteudo) => conteudo.turmaId)).size;
    const modulosUnicos = new Set(conteudosOrdenados.map((conteudo) => conteudo.moduloId)).size;
    const totalTextos = conteudosOrdenados.filter((conteudo) => Number(conteudo.tipoConteudo) === 1).length;
    const totalPdfs = conteudosOrdenados.filter((conteudo) => Number(conteudo.tipoConteudo) === 2).length;
    const totalRecursos = conteudosOrdenados.filter((conteudo) => [3, 4].includes(Number(conteudo.tipoConteudo))).length;

    return [
      `${matriculasAprovadas.length} matricula(s) ativa(s)`,
      `${turmasUnicas} turma(s) com material`,
      `${modulosUnicos} modulo(s) liberado(s)`,
      `${formatPercent(calcularMediaProgresso(progressosCursos))} de progresso`,
      `${totalTextos} texto(s)`,
      `${totalPdfs} pdf(s)`,
      `${totalRecursos} recurso(s)`
    ];
  }, [conteudosOrdenados, matriculasAprovadas.length, progressosCursos]);

  return (
    <div className="content-section content-section--student">
      {mensagem.message ? <InlineMessage tone={mensagem.tone}>{mensagem.message}</InlineMessage> : null}

      <PanelCard
        description="Biblioteca organizada por curso, turma e modulo para facilitar a consulta dos materiais mais recentes."
        title="Biblioteca da sua trilha"
      >
        {conteudosOrdenados.length ? (
          <div className="student-content-list">
            {conteudosOrdenados.map((conteudo) => {
              const acao = obterAcaoConteudoAluno(conteudo);
              const progressoConteudo = progressoConteudoPorConteudoId.get(conteudo.id);
              const progressoPercentual = Number(progressoConteudo?.percentualConclusao || 0);
              const concluido = estaConcluido(progressoConteudo);
              const processando = conteudoProcessando === conteudo.id;

              return (
                <article className="student-content-card" key={conteudo.id}>
                  <div className="student-content-card__header">
                    <div className="student-content-card__heading">
                      <div className="table-badge-list">
                        <span className="chip">{conteudo.cursoTitulo || `Curso #${conteudo.cursoId}`}</span>
                        <span className="chip">{conteudo.turmaNome || `Turma #${conteudo.turmaId}`}</span>
                        <span className="chip">{normalizeContentType(conteudo.tipoConteudo)}</span>
                      </div>
                      <h3>{conteudo.titulo}</h3>
                      <p className="student-content-card__meta">
                        {conteudo.moduloTitulo || "Modulo sem titulo"}
                        {typeof conteudo.ordemExibicao === "number" ? ` - Ordem ${conteudo.ordemExibicao}` : ""}
                      </p>
                    </div>
                    <StatusPill tone={publicationStatusTone(conteudo.statusPublicacao)}>
                      {normalizePublicationStatus(conteudo.statusPublicacao)}
                    </StatusPill>
                  </div>

                  <p className="student-content-card__summary">{obterPreviaConteudoAluno(conteudo)}</p>

                  <div className="student-content-card__progress">
                    <StatusPill tone={progressStatusTone(progressoConteudo?.statusProgresso || 1)}>
                      {normalizeProgressStatus(progressoConteudo?.statusProgresso || 1)} - {formatPercent(progressoPercentual)}
                    </StatusPill>
                    <div className="student-progress-bar" aria-hidden="true">
                      <span style={{ width: `${Math.max(0, Math.min(progressoPercentual, 100))}%` }} />
                    </div>
                  </div>

                  <div className="student-content-card__footer">
                    <span>
                      {conteudo.publicadoEm
                        ? `Publicado em ${formatDate(conteudo.publicadoEm)}`
                        : `Atualizado em ${formatDate(conteudo.atualizadoEm || conteudo.criadoEm)}`}
                    </span>

                    <div className="student-content-card__actions">
                      {acao ? (
                        <a className="student-content-card__link" href={acao.href} rel="noreferrer" target="_blank">
                          {acao.label}
                        </a>
                      ) : (
                        <span className="student-content-card__note">Leitura disponivel no proprio painel.</span>
                      )}
                      <button
                        className="table-action"
                        disabled={concluido || processando}
                        onClick={() => marcarConteudoConcluido(conteudo.id)}
                        type="button"
                      >
                        {concluido ? "Ja concluido" : processando ? "Salvando..." : "Marcar concluido"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState message="Nenhum conteudo publicado foi liberado para as suas turmas ate agora." />
        )}
      </PanelCard>

      <section className="content-section__intro">
        <div className="content-section__intro-copy">
          <span className="eyebrow">Experiencia do aluno</span>
          <h2>Materiais liberados para a sua jornada</h2>
          <p>Acompanhe o que ja foi publicado para as suas turmas e avance por curso, modulo e formato de estudo.</p>
        </div>
        <div className="content-section__highlights" aria-label="Resumo da trilha do aluno">
          {resumoAluno.map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function normalizeEvaluationType(type) {
  const labels = {
    1: "Quiz",
    2: "Prova",
    3: "Exercicio"
  };

  if (typeof type === "number") {
    return labels[type] || "Avaliacao";
  }

  return type || "Avaliacao";
}

function calcularProgressoModulo(conteudos) {
  if (!conteudos.length) {
    return 0;
  }

  const concluidos = conteudos.filter((conteudo) => conteudo.concluido).length;
  return (concluidos / conteudos.length) * 100;
}

function obterProximaAcaoCurso(modulos) {
  for (const modulo of modulos) {
    const conteudoPendente = modulo.conteudos.find((conteudo) => !conteudo.concluido);
    if (conteudoPendente) {
      return {
        moduloId: modulo.id,
        titulo: `Continuar ${modulo.titulo}`,
    descricao: `Proximo material: ${conteudoPendente.titulo}.`,
    label: "Abrir materiais",
    tone: "warning",
    to: "/app/conteudos"
  };
    }

    const avaliacaoDisponivel = modulo.avaliacoes.find((avaliacao) => obterDisponibilidadeAvaliacao(avaliacao).podeRealizar);
    if (avaliacaoDisponivel) {
      return {
        moduloId: modulo.id,
        titulo: "Realizar avaliacao",
    descricao: `${avaliacaoDisponivel.titulo} esta disponivel para este modulo.`,
    label: "Realizar avaliacao",
    tone: "warning",
    to: "/app/avaliacoes"
  };
    }
  }

  return {
    moduloId: modulos[0]?.id || null,
    titulo: modulos.length ? "Curso em dia" : "Aguardando publicacoes",
    descricao: modulos.length
      ? "Todos os materiais e avaliacoes disponiveis ja foram encaminhados."
      : "Assim que houver modulo publicado, a proxima etapa aparecera aqui.",
    label: modulos.length ? "Jornada concluida" : "Sem publicacoes",
    tone: modulos.length ? "success" : "info",
    to: null
  };
}

function normalizeQuestionType(type) {
  const labels = {
    1: "Multipla escolha",
    2: "Verdadeiro/Falso",
    3: "Discursiva"
  };

  if (typeof type === "number") {
    return labels[type] || "Questao";
  }

  return type || "Questao";
}

function criarRespostasIniciais(questoes) {
  return Object.fromEntries(
    questoes.map((questao) => [
      questao.id,
      {
        questaoId: questao.id,
        alternativaId: null,
        respostaTexto: ""
      }
    ])
  );
}

function formatScore(value) {
  return Number(value || 0).toFixed(1).replace(".", ",");
}

function obterDisponibilidadeAvaliacao(avaliacao) {
  const agora = new Date();
  const abertura = parseApiDate(avaliacao.dataAbertura);
  const fechamento = parseApiDate(avaliacao.dataFechamento);

  if (!avaliacao.totalQuestoes) {
    return {
      podeRealizar: false,
      label: "Sem questoes",
      mensagem: "Esta avaliacao ainda nao possui questoes publicadas.",
      tone: "warning"
    };
  }

  if (Number(avaliacao.tentativasRestantes || 0) <= 0) {
    return {
      podeRealizar: false,
      label: "Concluida",
      mensagem: "Voce ja usou todas as tentativas desta avaliacao.",
      tone: "success"
    };
  }

  if (abertura && abertura > agora) {
    return {
      podeRealizar: false,
      label: "Agendada",
      mensagem: `Esta avaliacao abre em ${formatDate(avaliacao.dataAbertura)}.`,
      tone: "warning"
    };
  }

  if (fechamento && fechamento < agora) {
    return {
      podeRealizar: false,
      label: "Encerrada",
      mensagem: "O periodo para responder esta avaliacao ja foi encerrado.",
      tone: "danger"
    };
  }

  return {
    podeRealizar: true,
    label: "Disponivel",
    mensagem: "Avaliacao disponivel para resposta.",
    tone: "success"
  };
}

function calcularMediaProgresso(progressosCursos) {
  if (!progressosCursos.length) {
    return 0;
  }

  const total = progressosCursos.reduce((soma, progresso) => soma + Number(progresso.percentualConclusao || 0), 0);
  return total / progressosCursos.length;
}

function estaConcluido(progresso) {
  return Boolean(
    progresso &&
      (Number(progresso.percentualConclusao || 0) >= 100 ||
        normalizeProgressStatus(progresso.statusProgresso) === "Concluido")
  );
}

function obterPreviaConteudoAluno(conteudo) {
  const tipo = Number(conteudo.tipoConteudo);

  if (tipo === 1) {
    return compactText(conteudo.descricao || conteudo.corpoTexto || "Texto liberado para leitura nesta turma.", 260);
  }

  if (tipo === 2) {
    return compactText(conteudo.descricao || conteudo.arquivoUrl || "PDF publicado para consulta ou download.", 220);
  }

  return compactText(
    conteudo.descricao || conteudo.linkUrl || conteudo.arquivoUrl || "Recurso externo liberado para complementar o modulo.",
    220
  );
}

function obterAcaoConteudoAluno(conteudo) {
  const tipo = Number(conteudo.tipoConteudo);

  if (tipo === 2 && conteudo.arquivoUrl) {
    return { href: conteudo.arquivoUrl, label: "Abrir PDF" };
  }

  if (tipo === 3 && conteudo.linkUrl) {
    return { href: conteudo.linkUrl, label: "Abrir video" };
  }

  if (tipo === 4 && conteudo.linkUrl) {
    return { href: conteudo.linkUrl, label: "Abrir recurso" };
  }

  return null;
}
