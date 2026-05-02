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

const ACADEMIC_ACCENTS = [
  { solid: "#22c55e", border: "rgba(143, 179, 154, 0.34)", soft: "rgba(143, 179, 154, 0.07)" },
  { solid: "#38bdf8", border: "rgba(133, 174, 191, 0.34)", soft: "rgba(133, 174, 191, 0.07)" },
  { solid: "#f59e0b", border: "rgba(184, 160, 111, 0.34)", soft: "rgba(184, 160, 111, 0.07)" },
  { solid: "#a78bfa", border: "rgba(156, 145, 184, 0.34)", soft: "rgba(156, 145, 184, 0.07)" },
  { solid: "#fb7185", border: "rgba(181, 139, 150, 0.34)", soft: "rgba(181, 139, 150, 0.07)" },
  { solid: "#14b8a6", border: "rgba(130, 170, 163, 0.34)", soft: "rgba(130, 170, 163, 0.07)" },
  { solid: "#84cc16", border: "rgba(168, 184, 120, 0.34)", soft: "rgba(168, 184, 120, 0.07)" },
  { solid: "#f97316", border: "rgba(187, 146, 114, 0.34)", soft: "rgba(187, 146, 114, 0.07)" },
  { solid: "#6366f1", border: "rgba(134, 141, 183, 0.34)", soft: "rgba(134, 141, 183, 0.07)" },
  { solid: "#ef4444", border: "rgba(185, 135, 135, 0.34)", soft: "rgba(185, 135, 135, 0.07)" },
  { solid: "#06b6d4", border: "rgba(120, 170, 180, 0.34)", soft: "rgba(120, 170, 180, 0.07)" },
  { solid: "#d946ef", border: "rgba(173, 136, 180, 0.34)", soft: "rgba(173, 136, 180, 0.07)" }
];

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
  const [conteudosConcluidosLocais, setConteudosConcluidosLocais] = useState(() => new Set());
  const [conteudoSelecionadoId, setConteudoSelecionadoId] = useState(null);
  const [detalheConteudoAberto, setDetalheConteudoAberto] = useState(true);
  const [modulosAbertos, setModulosAbertos] = useState({});

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

  const progressoConteudoPorConteudoId = useMemo(
    () => new Map(progressosConteudos.map((progresso) => [progresso.conteudoDidaticoId, progresso])),
    [progressosConteudos]
  );

  useEffect(() => {
    const idsConteudosVisiveis = new Set(conteudos.map((conteudo) => conteudo.id));

    setConteudosConcluidosLocais((atuais) => {
      const proximos = new Set([...atuais].filter((conteudoId) => idsConteudosVisiveis.has(conteudoId)));
      return proximos.size === atuais.size ? atuais : proximos;
    });
  }, [conteudos]);

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
  const gruposConteudosPorCurso = useMemo(() => {
    const cursosMapeados = new Map();

    conteudosOrdenados.forEach((conteudo) => {
      const cursoId = Number(conteudo.cursoId);
      const chaveCurso = cursoId || `curso-${conteudo.cursoTitulo || "sem-curso"}`;
      const acentoCurso = obterAcentoAcademico(chaveCurso);
      const curso = cursosMapeados.get(chaveCurso) || {
        id: chaveCurso,
        acento: acentoCurso,
        titulo: conteudo.cursoTitulo || `Curso #${conteudo.cursoId}`,
        turmas: new Set(),
        modulos: new Map(),
        totalConteudos: 0,
        concluidos: 0
      };
      const moduloId = Number(conteudo.moduloId);
      const chaveModulo = moduloId || `modulo-${conteudo.moduloTitulo || "sem-modulo"}`;
      const acentoModulo = obterAcentoAcademicoPorIndice(curso.acento.indice + curso.modulos.size + 1);
      const modulo = curso.modulos.get(chaveModulo) || {
        id: chaveModulo,
        acento: acentoModulo,
        titulo: conteudo.moduloTitulo || "Modulo sem titulo",
        conteudos: [],
        concluidos: 0
      };
      const progressoConteudo = progressoConteudoPorConteudoId.get(conteudo.id);
      const concluido = conteudosConcluidosLocais.has(conteudo.id) || estaConcluido(progressoConteudo);
      const progressoPercentual = concluido ? 100 : Number(progressoConteudo?.percentualConclusao || 0);
      const statusProgresso = concluido ? 3 : progressoConteudo?.statusProgresso || 1;

      curso.turmas.add(conteudo.turmaNome || `Turma #${conteudo.turmaId}`);
      curso.totalConteudos += 1;
      curso.concluidos += concluido ? 1 : 0;

      modulo.concluidos += concluido ? 1 : 0;
      modulo.conteudos.push({
        ...conteudo,
        concluido,
        progressoConteudo,
        progressoPercentual,
        statusProgresso
      });

      curso.modulos.set(chaveModulo, modulo);
      cursosMapeados.set(chaveCurso, curso);
    });

    return [...cursosMapeados.values()].map((curso) => {
      const modulos = [...curso.modulos.values()].map((modulo) => ({
        ...modulo,
        progresso: modulo.conteudos.length ? (modulo.concluidos / modulo.conteudos.length) * 100 : 0
      }));
      const conteudosDoCurso = modulos.flatMap((modulo) => modulo.conteudos);

      return {
        ...curso,
        turmas: [...curso.turmas].sort((left, right) => left.localeCompare(right, "pt-BR")),
        progresso: curso.totalConteudos ? (curso.concluidos / curso.totalConteudos) * 100 : 0,
        modulos,
        proximoConteudo: conteudosDoCurso.find((conteudo) => !conteudo.concluido) || conteudosDoCurso[0] || null
      };
    });
  }, [conteudosConcluidosLocais, conteudosOrdenados, progressoConteudoPorConteudoId]);

  const conteudosDaTrilha = useMemo(
    () =>
      gruposConteudosPorCurso.flatMap((curso) =>
        curso.modulos.flatMap((modulo) =>
          modulo.conteudos.map((conteudo) => ({
            ...conteudo,
            cursoAgrupadoId: curso.id,
            cursoTitulo: curso.titulo,
            cursoTurmas: curso.turmas,
            cursoAcento: curso.acento,
            moduloAgrupadoId: modulo.id,
            moduloChave: obterChaveModuloConteudo(curso.id, modulo.id),
            moduloTitulo: modulo.titulo
          }))
        )
      ),
    [gruposConteudosPorCurso]
  );

  const conteudoSelecionado = useMemo(
    () => conteudosDaTrilha.find((conteudo) => conteudo.id === conteudoSelecionadoId) || null,
    [conteudoSelecionadoId, conteudosDaTrilha]
  );

  useEffect(() => {
    setModulosAbertos((atuais) => {
      const proximos = {};

      gruposConteudosPorCurso.forEach((curso) => {
        curso.modulos.forEach((modulo, index) => {
          const chaveModulo = obterChaveModuloConteudo(curso.id, modulo.id);
          proximos[chaveModulo] = Object.prototype.hasOwnProperty.call(atuais, chaveModulo)
            ? atuais[chaveModulo]
            : modulo.concluidos < modulo.conteudos.length || index === 0;
        });
      });

      const chavesAtuais = Object.keys(atuais);
      const chavesProximas = Object.keys(proximos);
      const semMudancas =
        chavesAtuais.length === chavesProximas.length && chavesProximas.every((chave) => atuais[chave] === proximos[chave]);

      return semMudancas ? atuais : proximos;
    });
  }, [gruposConteudosPorCurso]);

  useEffect(() => {
    if (!conteudosDaTrilha.length) {
      setConteudoSelecionadoId(null);
      return;
    }

    if (!conteudosDaTrilha.some((conteudo) => conteudo.id === conteudoSelecionadoId)) {
      const proximoConteudo = conteudosDaTrilha.find((conteudo) => !conteudo.concluido) || conteudosDaTrilha[0];
      setConteudoSelecionadoId(proximoConteudo.id);
    }
  }, [conteudoSelecionadoId, conteudosDaTrilha]);

  useEffect(() => {
    if (!conteudoSelecionado?.moduloChave) {
      return;
    }

    setModulosAbertos((atuais) => (atuais[conteudoSelecionado.moduloChave] ? atuais : { ...atuais, [conteudoSelecionado.moduloChave]: true }));
  }, [conteudoSelecionado]);

  function alternarModuloConteudos(chaveModulo) {
    setModulosAbertos((atuais) => ({
      ...atuais,
      [chaveModulo]: !atuais[chaveModulo]
    }));
  }

  function selecionarConteudoAluno(conteudoId, chaveModulo) {
    setConteudoSelecionadoId(conteudoId);
    setDetalheConteudoAberto(true);
    setModulosAbertos((atuais) => (atuais[chaveModulo] ? atuais : { ...atuais, [chaveModulo]: true }));
  }

  async function marcarConteudoConcluido(conteudoId) {
    try {
      setMensagem({ tone: "info", message: "" });
      setConteudoProcessando(conteudoId);

      await apiRequest(`/Progressos/conteudos/${conteudoId}/concluir`, { method: "PUT" });
      setConteudosConcluidosLocais((atuais) => {
        const proximos = new Set(atuais);
        proximos.add(conteudoId);
        return proximos;
      });
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
      `${formatPercent(calcularMediaGruposConteudo(gruposConteudosPorCurso))} de progresso`,
      `${totalTextos} texto(s)`,
      `${totalPdfs} pdf(s)`,
      `${totalRecursos} recurso(s)`
    ];
  }, [conteudosOrdenados, gruposConteudosPorCurso, matriculasAprovadas.length]);
  const acaoConteudoSelecionado = conteudoSelecionado ? obterAcaoConteudoAluno(conteudoSelecionado) : null;

  return (
    <div className="content-section content-section--student">
      {mensagem.message ? <InlineMessage tone={mensagem.tone}>{mensagem.message}</InlineMessage> : null}

      <div className={`student-study-layout${conteudoSelecionado && detalheConteudoAberto ? " student-study-layout--with-detail" : ""}`}>
        <PanelCard
          description="Biblioteca em formato de trilha: abra um modulo, escolha um material e acompanhe o detalhe ao lado."
          title="Biblioteca da sua trilha"
        >
          {gruposConteudosPorCurso.length ? (
            <div className="student-content-course-list">
              {gruposConteudosPorCurso.map((curso) => {
                const moduloDoProximo = curso.modulos.find((modulo) => modulo.conteudos.some((conteudo) => conteudo.id === curso.proximoConteudo?.id));
                const chaveModuloProximo = moduloDoProximo ? obterChaveModuloConteudo(curso.id, moduloDoProximo.id) : "";

                return (
                  <section
                    className="student-content-course"
                    key={curso.id}
                    style={{
                      "--course-accent": curso.acento.solid,
                      "--course-accent-border": curso.acento.border,
                      "--course-accent-soft": curso.acento.soft
                    }}
                  >
                    <header className="student-content-course__header">
                      <div>
                        <span className="eyebrow">Curso</span>
                        <h3>{curso.titulo}</h3>
                        <p>{curso.turmas.join(", ")}</p>
                      </div>
                      <div className="student-content-course__summary">
                        <span className="chip">{curso.modulos.length} modulo{curso.modulos.length === 1 ? "" : "s"}</span>
                        <span className="chip">{curso.totalConteudos} material{curso.totalConteudos === 1 ? "" : "s"}</span>
                        <span className="chip">{formatPercent(curso.progresso)} de progresso</span>
                      </div>
                    </header>

                    <div className="student-content-card__progress student-content-course__progress">
                      <div className="student-progress-bar" aria-hidden="true">
                        <span style={{ width: `${Math.max(0, Math.min(curso.progresso, 100))}%` }} />
                      </div>
                    </div>

                    {curso.proximoConteudo ? (
                      <div className="student-content-course__next">
                        <span>Continue de onde parou</span>
                        <strong>{curso.proximoConteudo.titulo}</strong>
                        <button
                          className="table-action"
                          onClick={() => selecionarConteudoAluno(curso.proximoConteudo.id, chaveModuloProximo)}
                          type="button"
                        >
                          Abrir
                        </button>
                      </div>
                    ) : null}

                    <div className="student-content-module-list">
                      {curso.modulos.map((modulo) => {
                        const chaveModulo = obterChaveModuloConteudo(curso.id, modulo.id);
                        const moduloAberto = Boolean(modulosAbertos[chaveModulo]);

                        return (
                          <article
                            className="student-content-module"
                            key={modulo.id}
                            style={{
                              "--module-accent": modulo.acento.solid,
                              "--module-accent-border": modulo.acento.border,
                              "--module-accent-soft": modulo.acento.soft
                            }}
                          >
                            <button
                              aria-expanded={moduloAberto}
                              className="student-content-module__toggle"
                              onClick={() => alternarModuloConteudos(chaveModulo)}
                              type="button"
                            >
                              <span className="student-content-module__copy">
                                <span>Modulo</span>
                                <strong>{modulo.titulo}</strong>
                              </span>
                              <span className="student-content-module__summary">
                                <StatusPill tone={modulo.concluidos === modulo.conteudos.length ? "success" : "warning"}>
                                  {modulo.concluidos}/{modulo.conteudos.length} concluido{modulo.conteudos.length === 1 ? "" : "s"}
                                </StatusPill>
                                <span>{formatPercent(modulo.progresso)}</span>
                                <span className="student-content-module__toggle-symbol" aria-hidden="true">
                                  {moduloAberto ? "-" : "+"}
                                </span>
                              </span>
                            </button>

                            {moduloAberto ? (
                              <div className="student-content-compact-list">
                                {modulo.conteudos.map((conteudo) => {
                                  const acao = obterAcaoConteudoAluno(conteudo);
                                  const processando = conteudoProcessando === conteudo.id;
                                  const conteudoAtivo = conteudoSelecionadoId === conteudo.id;

                                  return (
                                    <article
                                      className={`student-content-item${conteudoAtivo ? " student-content-item--active" : ""}`}
                                      key={conteudo.id}
                                    >
                                      <button
                                        className="student-content-item__main"
                                        onClick={() => selecionarConteudoAluno(conteudo.id, chaveModulo)}
                                        type="button"
                                      >
                                        <span className="student-content-item__order">
                                          {typeof conteudo.ordemExibicao === "number" ? String(conteudo.ordemExibicao).padStart(2, "0") : "--"}
                                        </span>
                                        <span className="student-content-item__copy">
                                          <span>{normalizeContentType(conteudo.tipoConteudo)}</span>
                                          <strong>{conteudo.titulo}</strong>
                                        </span>
                                      </button>

                                      <div className="student-content-item__status">
                                        <StatusPill tone={conteudo.concluido ? "success" : progressStatusTone(conteudo.statusProgresso)}>
                                          {conteudo.concluido ? "Concluido" : normalizeProgressStatus(conteudo.statusProgresso)}
                                        </StatusPill>
                                        <span>{formatPercent(conteudo.progressoPercentual)}</span>
                                      </div>

                                      <div className="student-content-item__actions">
                                        {acao ? (
                                          <a className="student-content-card__link" href={acao.href} rel="noreferrer" target="_blank">
                                            {acao.label}
                                          </a>
                                        ) : null}
                                        {!conteudo.concluido ? (
                                          <button
                                            className="table-action"
                                            disabled={processando}
                                            onClick={() => marcarConteudoConcluido(conteudo.id)}
                                            type="button"
                                          >
                                            {processando ? "Salvando..." : "Concluir"}
                                          </button>
                                        ) : null}
                                      </div>
                                    </article>
                                  );
                                })}
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <EmptyState message="Nenhum conteudo publicado foi liberado para as suas turmas ate agora." />
          )}
        </PanelCard>

        {conteudoSelecionado && detalheConteudoAberto ? (
          <aside
            className="student-content-detail"
            style={{ "--course-accent": conteudoSelecionado.cursoAcento.solid }}
            aria-label="Detalhe do conteudo selecionado"
          >
            <PanelCard description={`${conteudoSelecionado.cursoTitulo} - ${conteudoSelecionado.moduloTitulo}`} title={conteudoSelecionado.titulo}>
              <div className="module-detail-panel-actions">
                <button className="table-action module-detail-close" onClick={() => setDetalheConteudoAberto(false)} type="button">
                  Fechar detalhe
                </button>
              </div>

              <div className="student-content-detail__meta">
                <span className="chip">{normalizeContentType(conteudoSelecionado.tipoConteudo)}</span>
                <StatusPill tone={publicationStatusTone(conteudoSelecionado.statusPublicacao)}>
                  {normalizePublicationStatus(conteudoSelecionado.statusPublicacao)}
                </StatusPill>
                <StatusPill tone={progressStatusTone(conteudoSelecionado.statusProgresso)}>
                  {normalizeProgressStatus(conteudoSelecionado.statusProgresso)}
                </StatusPill>
              </div>

              <div className="student-content-card__progress">
                <span className="student-content-detail__progress-label">{formatPercent(conteudoSelecionado.progressoPercentual)} de progresso</span>
                <div className="student-progress-bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(0, Math.min(conteudoSelecionado.progressoPercentual, 100))}%` }} />
                </div>
              </div>

              <p className="student-content-card__summary">{obterPreviaConteudoAluno(conteudoSelecionado)}</p>

              {conteudoSelecionado.corpoTexto ? (
                <div className="student-content-detail__body">
                  <span>Conteudo</span>
                  <p>{conteudoSelecionado.corpoTexto}</p>
                </div>
              ) : null}

              <div className="student-content-detail__footer">
                <span>
                  {conteudoSelecionado.publicadoEm
                    ? `Publicado em ${formatDate(conteudoSelecionado.publicadoEm)}`
                    : `Atualizado em ${formatDate(conteudoSelecionado.atualizadoEm || conteudoSelecionado.criadoEm)}`}
                </span>

                <div className="student-content-card__actions">
                  {acaoConteudoSelecionado ? (
                    <a className="student-content-card__link" href={acaoConteudoSelecionado.href} rel="noreferrer" target="_blank">
                      {acaoConteudoSelecionado.label}
                    </a>
                  ) : (
                    <span className="student-content-card__note">Leitura disponivel no proprio painel.</span>
                  )}
                  {!conteudoSelecionado.concluido ? (
                    <button
                      className="table-action"
                      disabled={conteudoProcessando === conteudoSelecionado.id}
                      onClick={() => marcarConteudoConcluido(conteudoSelecionado.id)}
                      type="button"
                    >
                      {conteudoProcessando === conteudoSelecionado.id ? "Salvando..." : "Marcar concluido"}
                    </button>
                  ) : null}
                </div>
              </div>
            </PanelCard>
          </aside>
        ) : null}
      </div>

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

function calcularMediaGruposConteudo(gruposConteudosPorCurso) {
  if (!gruposConteudosPorCurso.length) {
    return 0;
  }

  const total = gruposConteudosPorCurso.reduce((soma, curso) => soma + Number(curso.progresso || 0), 0);
  return total / gruposConteudosPorCurso.length;
}

function obterChaveModuloConteudo(cursoId, moduloId) {
  return `${cursoId || "curso"}-${moduloId || "modulo"}`;
}

function obterIndiceAcentoAcademico(valor) {
  const texto = String(valor || "default");
  let hash = 0;

  for (let index = 0; index < texto.length; index += 1) {
    hash = (hash * 31 + texto.charCodeAt(index)) % ACADEMIC_ACCENTS.length;
  }

  return Math.abs(hash);
}

function obterAcentoAcademico(valor, offset = 0) {
  const indiceBase = obterIndiceAcentoAcademico(valor);
  const indice = (indiceBase + offset + ACADEMIC_ACCENTS.length) % ACADEMIC_ACCENTS.length;

  return obterAcentoAcademicoPorIndice(indice);
}

function obterAcentoAcademicoPorIndice(indice) {
  const indiceNormalizado = ((indice % ACADEMIC_ACCENTS.length) + ACADEMIC_ACCENTS.length) % ACADEMIC_ACCENTS.length;

  return {
    ...ACADEMIC_ACCENTS[indiceNormalizado],
    indice: indiceNormalizado
  };
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
