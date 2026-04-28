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
  progressStatusTone,
  publicationStatusTone
} from "../../lib/format.js";

export function SecaoCursosAluno({ conteudos, cursos, matriculas, onNavigate, progressos = {}, turmas }) {
  const cursoPorId = useMemo(() => mapById(cursos), [cursos]);
  const turmaPorId = useMemo(() => mapById(turmas), [turmas]);
  const progressoCursoPorMatricula = useMemo(
    () => new Map((progressos.cursos || []).map((progresso) => [progresso.matriculaId, progresso])),
    [progressos.cursos]
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
      if (!resumoAtual.ultimaPublicacao || new Date(dataCandidata || 0).getTime() > new Date(resumoAtual.ultimaPublicacao || 0).getTime()) {
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
            curso: cursoPorId.get(matricula.cursoId)?.titulo || `Curso #${matricula.cursoId}`,
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

  return (
    <div className="content-section content-section--student">
      <PanelCard
        description="Cursos com matricula aprovada e os materiais ja publicados para cada turma."
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
              key: "acoes",
              label: "Acesso",
              render: (row) =>
                row.materiais ? (
                  <RouteLink className="table-action" onNavigate={onNavigate} to="/app/conteudos">
                    Ver materiais
                  </RouteLink>
                ) : (
                  <span className="student-course-note">Sem material ainda</span>
                )
            }
          ]}
          emptyMessage="Assim que uma matricula for aprovada, os seus cursos ativos vao aparecer aqui."
          rows={linhasMatriculasAprovadas}
        />
      </PanelCard>
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

        const aberturaA = new Date(avaliacaoA.dataAbertura || avaliacaoA.publicadoEm || 0).getTime();
        const aberturaB = new Date(avaliacaoB.dataAbertura || avaliacaoB.publicadoEm || 0).getTime();
        return aberturaA - aberturaB;
      }),
    [avaliacoes]
  );

  const resumoAvaliacoes = useMemo(() => {
    const disponiveis = avaliacoesOrdenadas.filter((avaliacao) => obterDisponibilidadeAvaliacao(avaliacao).podeRealizar);
    const concluidas = avaliacoesOrdenadas.filter((avaliacao) => avaliacao.tentativasRealizadas > 0);

    return [
      `${avaliacoesOrdenadas.length} avaliacao(oes) publicada(s)`,
      `${disponiveis.length} disponivel(is) agora`,
      `${concluidas.length} com tentativa registrada`
    ];
  }, [avaliacoesOrdenadas]);

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
      <section className="content-section__intro">
        <div className="content-section__intro-copy">
          <span className="eyebrow">Avaliacoes do aluno</span>
          <h2>Avaliacoes publicadas pelos professores</h2>
          <p>Responda provas, quizzes e exercicios liberados para as turmas em que sua matricula esta aprovada.</p>
        </div>
        <div className="content-section__highlights" aria-label="Resumo de avaliacoes do aluno">
          {resumoAvaliacoes.map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

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

  const matriculaPorTurmaId = useMemo(
    () => new Map(matriculasAprovadas.map((matricula) => [matricula.turmaId, matricula])),
    [matriculasAprovadas]
  );

  const progressosConteudos = progressos.conteudos || [];
  const progressosModulos = progressos.modulos || [];
  const progressosCursos = progressos.cursos || [];

  const progressoConteudoPorConteudoId = useMemo(
    () => new Map(progressosConteudos.map((progresso) => [progresso.conteudoDidaticoId, progresso])),
    [progressosConteudos]
  );

  const progressoModuloPorChave = useMemo(
    () => new Map(progressosModulos.map((progresso) => [`${progresso.matriculaId}-${progresso.moduloId}`, progresso])),
    [progressosModulos]
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

  const totalConteudosPorTurma = useMemo(() => {
    const contagens = new Map();

    conteudosOrdenados.forEach((conteudo) => {
      contagens.set(conteudo.turmaId, (contagens.get(conteudo.turmaId) || 0) + 1);
    });

    return contagens;
  }, [conteudosOrdenados]);

  const ultimaPublicacaoPorTurma = useMemo(() => {
    const datas = new Map();

    conteudosOrdenados.forEach((conteudo) => {
      const dataAtual = datas.get(conteudo.turmaId);
      const novaData = conteudo.publicadoEm || conteudo.atualizadoEm || conteudo.criadoEm;

      if (!dataAtual) {
        datas.set(conteudo.turmaId, novaData);
        return;
      }

      if (new Date(novaData || 0).getTime() > new Date(dataAtual || 0).getTime()) {
        datas.set(conteudo.turmaId, novaData);
      }
    });

    return datas;
  }, [conteudosOrdenados]);

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

  const linhasAcesso = useMemo(
    () =>
      matriculasAprovadas.map((matricula) => ({
        id: matricula.id,
        curso: matricula.curso?.titulo || `Curso #${matricula.cursoId}`,
        turma: matricula.turma?.nomeTurma || "Turma em definicao",
        materiais: totalConteudosPorTurma.get(matricula.turmaId) || 0,
        ultimaPublicacao: ultimaPublicacaoPorTurma.get(matricula.turmaId) || null,
        notaFinal: matricula.notaFinal ?? 0
      })),
    [matriculasAprovadas, totalConteudosPorTurma, ultimaPublicacaoPorTurma]
  );

  const linhasModulos = useMemo(() => {
    const grupos = new Map();

    conteudosOrdenados.forEach((conteudo) => {
      const matricula = matriculaPorTurmaId.get(conteudo.turmaId);
      const matriculaId = matricula?.id || 0;
      const chave = `${matriculaId}-${conteudo.moduloId}`;
      const item = grupos.get(chave) || {
        id: chave,
        curso: conteudo.cursoTitulo || `Curso #${conteudo.cursoId}`,
        turma: conteudo.turmaNome || `Turma #${conteudo.turmaId}`,
        modulo: conteudo.moduloTitulo || "Modulo sem titulo",
        matriculaId,
        moduloId: conteudo.moduloId,
        conteudosIds: []
      };

      item.conteudosIds.push(conteudo.id);
      grupos.set(chave, item);
    });

    return [...grupos.values()].map((item) => {
      const progressoModulo = progressoModuloPorChave.get(`${item.matriculaId}-${item.moduloId}`);
      const concluidos = progressoModulo?.conteudosConcluidos ?? item.conteudosIds.filter((conteudoId) => {
        const progressoConteudo = progressoConteudoPorConteudoId.get(conteudoId);
        return estaConcluido(progressoConteudo);
      }).length;

      return {
        ...item,
        materiais: item.conteudosIds.length,
        concluidos,
        progresso: progressoModulo?.percentualConclusao || 0,
        status: progressoModulo?.statusProgresso || 1
      };
    });
  }, [conteudosOrdenados, matriculaPorTurmaId, progressoConteudoPorConteudoId, progressoModuloPorChave]);

  return (
    <div className="content-section content-section--student">
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

      {mensagem.message ? <InlineMessage tone={mensagem.tone}>{mensagem.message}</InlineMessage> : null}

      <PanelCard
        description="Cada linha mostra as turmas aprovadas no seu perfil e quantos materiais ja estao visiveis nelas."
        title="Acesso por turma"
      >
        <DataTable
          columns={[
            { key: "curso", label: "Curso" },
            { key: "turma", label: "Turma" },
            { key: "materiais", label: "Materiais liberados" },
            { key: "ultimaPublicacao", label: "Ultima publicacao", render: (row) => formatDate(row.ultimaPublicacao) },
            { key: "notaFinal", label: "Nota atual", render: (row) => formatGrade(row.notaFinal) }
          ]}
          emptyMessage="Assim que a sua matricula for aprovada, as turmas com materiais publicados vao aparecer aqui."
          rows={linhasAcesso}
        />
      </PanelCard>

      <PanelCard
        description="Avanco consolidado a partir dos materiais concluidos em cada modulo publicado."
        title="Progresso por modulo"
      >
        <DataTable
          columns={[
            { key: "curso", label: "Curso" },
            { key: "modulo", label: "Modulo" },
            { key: "materiais", label: "Materiais" },
            { key: "concluidos", label: "Concluidos" },
            { key: "progresso", label: "Progresso", render: (row) => formatPercent(row.progresso) },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <StatusPill tone={progressStatusTone(row.status)}>{normalizeProgressStatus(row.status)}</StatusPill>
              )
            }
          ]}
          emptyMessage="Os modulos publicados aparecerao aqui conforme os materiais forem liberados."
          rows={linhasModulos}
        />
      </PanelCard>

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
  const abertura = avaliacao.dataAbertura ? new Date(avaliacao.dataAbertura) : null;
  const fechamento = avaliacao.dataFechamento ? new Date(avaliacao.dataFechamento) : null;

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
