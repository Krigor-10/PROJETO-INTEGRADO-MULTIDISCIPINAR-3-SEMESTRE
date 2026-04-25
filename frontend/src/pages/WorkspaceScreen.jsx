import { useEffect, useMemo, useState } from "react";
import { InlineMessage, PanelCard, RouteLink, StatusPill } from "../components/Primitives.jsx";
import { SecaoAlunos } from "./workspace/SecaoAlunos.jsx";
import { SecaoConteudosProfessor } from "./workspace/SecaoConteudosProfessor.jsx";
import { SecaoCursos } from "./workspace/SecaoCursos.jsx";
import { SecaoModulos } from "./workspace/SecaoModulos.jsx";
import { SecaoConteudosAluno, SecaoCursosAluno } from "./workspace/SecoesAluno.jsx";
import { SecaoMatriculas } from "./workspace/SecaoMatriculas.jsx";
import { SecaoProfessores } from "./workspace/SecaoProfessores.jsx";
import { SecaoTurmas } from "./workspace/SecaoTurmas.jsx";
import { ModalPerfilWorkspace } from "./workspace/ModalPerfilWorkspace.jsx";
import { ResumoWorkspace } from "./workspace/ResumoWorkspace.jsx";
import { APP_SECTIONS, getSectionMeta, MANAGER_ROLES, EMPTY_SNAPSHOT } from "../data/appConfig.js";
import { hasSnapshotData, loadWorkspaceSnapshot, mapById } from "../lib/dashboard.js";
import { ApiError } from "../lib/api.js";
import { formatDate, formatGrade, maskCpf, normalizeStatus } from "../lib/format.js";
import { normalizePath } from "../lib/router.js";

export default function WorkspaceScreen({
  canDisableDemoMode,
  isDemoMode,
  onDemoModeExit,
  route,
  usuario,
  onNavigate,
  onLogout,
  onSessionExpired
}) {
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [solicitacaoNovoConteudo, setSolicitacaoNovoConteudo] = useState(0);
  const [cursoEmFocoPorSecao, setCursoEmFocoPorSecao] = useState({
    modulos: null,
    turmas: null
  });

  const role = usuario.tipoUsuario || "";
  const isManager = MANAGER_ROLES.has(role);
  const isProfessor = role === "Professor";
  const isStudent = role === "Aluno";

  const sections = useMemo(
    () => APP_SECTIONS.filter((section) => section.roles.includes(role)),
    [role]
  );
  const navSections = useMemo(
    () => sections.filter((section) => section.showInSidebar !== false),
    [sections]
  );

  const activeSection = sections.some((section) => section.key === route.section)
    ? route.section
    : "dashboard";
  const showOverviewCards = isManager
    ? activeSection === "dashboard"
    : !isProfessor && activeSection !== "conteudos" && !(isStudent && activeSection === "matriculas");
  const mostrarAcaoCriarConteudo = isProfessor && activeSection === "conteudos";

  useEffect(() => {
    const canonicalPath = activeSection === "dashboard" ? "/app" : `/app/${activeSection}`;
    const currentPath = window.location.pathname || "/app";

    if (normalizePath(currentPath) !== canonicalPath) {
      onNavigate(canonicalPath, { replace: true });
    }
  }, [activeSection, onNavigate]);

  useEffect(() => {
    if (!isProfileOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    let ignore = false;

    async function loadWorkspace() {
      try {
        setStatus("loading");
        setError("");

        const nextSnapshot = await loadWorkspaceSnapshot(usuario);

        if (ignore) {
          return;
        }

        setSnapshot(nextSnapshot);
        setStatus("ready");
      } catch (err) {
        if (ignore) {
          return;
        }

        if (err instanceof ApiError && err.status === 401) {
          onSessionExpired();
          return;
        }

        setStatus("error");
        setError(err.message || "Nao foi possivel carregar o painel agora.");
      }
    }

    loadWorkspace();

    return () => {
      ignore = true;
    };
  }, [onSessionExpired, refreshKey, role, usuario]);

  const cursoById = useMemo(() => mapById(snapshot.cursos), [snapshot.cursos]);
  const alunoById = useMemo(() => mapById(snapshot.alunos), [snapshot.alunos]);
  const professorById = useMemo(() => mapById(snapshot.professores), [snapshot.professores]);
  const turmaById = useMemo(() => mapById(snapshot.turmas), [snapshot.turmas]);

  const professorTurmas = useMemo(
    () => snapshot.turmas.filter((turma) => turma.professorId === usuario.id),
    [snapshot.turmas, usuario.id]
  );

  const professorCursos = useMemo(() => {
    const ids = new Set(professorTurmas.map((turma) => turma.cursoId));
    return snapshot.cursos.filter((curso) => ids.has(curso.id));
  }, [professorTurmas, snapshot.cursos]);

  const coordenadorCursos = useMemo(() => {
    if (role !== "Coordenador") {
      return snapshot.cursos;
    }

    return snapshot.cursos.filter((curso) => curso.coordenadorId === usuario.id && cursoEstaAtivo(curso));
  }, [role, snapshot.cursos, usuario.id]);

  const visibleCursos = isProfessor ? professorCursos : snapshot.cursos;
  const cursosDaSecaoCursos = role === "Coordenador" ? coordenadorCursos : visibleCursos;
  const visibleTurmas = isProfessor ? professorTurmas : snapshot.turmas;

  const matriculaRows = useMemo(
    () =>
      snapshot.matriculas.map((matricula) => ({
        id: matricula.id,
        alunoId: matricula.alunoId,
        cursoId: matricula.cursoId,
        turmaId: matricula.turmaId,
        aluno: matricula.aluno?.nome || alunoById.get(matricula.alunoId)?.nome || `Aluno #${matricula.alunoId}`,
        curso: matricula.curso?.titulo || cursoById.get(matricula.cursoId)?.titulo || `Curso #${matricula.cursoId}`,
        turma:
          matricula.turma?.nomeTurma ||
          turmaById.get(matricula.turmaId)?.nomeTurma ||
          "Aguardando turma",
        notaFinal: matricula.notaFinal ?? 0,
        status: normalizeStatus(matricula.status),
        dataSolicitacao: matricula.dataSolicitacao
      })),
    [alunoById, cursoById, snapshot.matriculas, turmaById]
  );

  const pendingRows = useMemo(
    () =>
      snapshot.pendentes.map((pendencia) => ({
        id: pendencia.id,
        nomeAluno: pendencia.nomeAluno,
        curso: cursoById.get(pendencia.cursoId)?.titulo || `Curso #${pendencia.cursoId}`,
        cpfMascarado: pendencia.cpfMascarado,
        nomeTurma: pendencia.nomeTurma || "Aguardando turma",
        dataSolicitacao: pendencia.dataSolicitacao
      })),
    [cursoById, snapshot.pendentes]
  );

  const studentApprovedCourseCount = useMemo(
    () =>
      new Set(
        snapshot.matriculas
          .filter((matricula) => normalizeStatus(matricula.status) === "Aprovada")
          .map((matricula) => matricula.cursoId)
      ).size,
    [snapshot.matriculas]
  );

  const approvedStudentRows = useMemo(
    () => matriculaRows.filter((item) => item.status === "Aprovada"),
    [matriculaRows]
  );

  const pendingStudentRows = useMemo(
    () => matriculaRows.filter((item) => item.status === "Pendente"),
    [matriculaRows]
  );

  const latestStudentRequest = useMemo(() => {
    const latest = [...snapshot.matriculas].sort(
      (left, right) => new Date(right.dataSolicitacao || 0).getTime() - new Date(left.dataSolicitacao || 0).getTime()
    )[0];

    return latest?.dataSolicitacao || null;
  }, [snapshot.matriculas]);

  const latestVisibleContent = useMemo(() => {
    const latest = [...snapshot.conteudos]
      .map((conteudo) => conteudo.publicadoEm || conteudo.atualizadoEm || conteudo.criadoEm || null)
      .filter(Boolean)
      .sort((left, right) => new Date(right || 0).getTime() - new Date(left || 0).getTime())[0];

    return latest || null;
  }, [snapshot.conteudos]);

  const overviewCards = useMemo(() => {
    if (isManager) {
      return [
        { label: "Cursos no ar", value: snapshot.cursos.length, detail: "catalogo principal" },
        { label: "Modulos", value: snapshot.modulos.length, detail: "estrutura academica" },
        { label: "Alunos", value: snapshot.alunos.length, detail: "cadastros ativos" },
        { label: "Matriculas", value: snapshot.matriculas.length, detail: "solicitacoes registradas" },
        { label: "Pendentes", value: snapshot.pendentes.length, detail: "pedidos em analise" }
      ];
    }

    if (isProfessor) {
      return [];
    }

    const approvedCount = matriculaRows.filter((item) => item.status === "Aprovada").length;
    const pendingCount = matriculaRows.filter((item) => item.status === "Pendente").length;
    const contentModuleCount = new Set(snapshot.conteudos.map((item) => item.moduloId)).size;

    return [
      { label: "Meus cursos", value: studentApprovedCourseCount, detail: "jornada ativa no momento" },
      { label: "Minhas matriculas", value: snapshot.matriculas.length, detail: "solicitacoes enviadas" },
      {
        label: "Conteudos liberados",
        value: snapshot.conteudos.length,
        detail: contentModuleCount ? `${contentModuleCount} modulos com material` : "aguardando novas publicacoes"
      },
      { label: "Aprovadas", value: approvedCount, detail: "prontas para acompanhamento" },
      { label: "Pendentes", value: pendingCount, detail: "aguardando validacao" }
    ];
  }, [
    isManager,
    isProfessor,
    matriculaRows,
    professorCursos.length,
    professorTurmas.length,
    snapshot.alunos.length,
    snapshot.conteudos,
    snapshot.modulos.length,
    snapshot.matriculas.length,
    snapshot.pendentes.length,
    studentApprovedCourseCount
  ]);

  const sectionMeta = getSectionMeta(activeSection, role);
  const hasData = hasSnapshotData(snapshot);
  const sidebarHeading = isProfessor ? "Painel do professor" : isManager ? "Painel de gestao" : "Painel do aluno";
  const userInitials = useMemo(() => {
    const parts = String(usuario.nome || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return "US";
    }

    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [usuario.nome]);

  const profileFacts = useMemo(() => {
    const baseFacts = [
      { label: "Nome completo", value: usuario.nome || "-" },
      { label: "E-mail", value: usuario.email || "-" },
      { label: "CPF", value: maskCpf(usuario.cpf || "") },
      { label: "Perfil", value: role || "-" }
    ];

    if (isStudent) {
      return [
        ...baseFacts,
        { label: "Ultima solicitacao", value: formatDate(latestStudentRequest) },
        { label: "Ultima liberacao", value: formatDate(latestVisibleContent) }
      ];
    }

    if (isProfessor) {
      return [
        ...baseFacts,
        { label: "Turmas vinculadas", value: `${professorTurmas.length}` },
        { label: "Cursos em foco", value: `${professorCursos.length}` }
      ];
    }

    return [
      ...baseFacts,
      { label: "Cursos no catalogo", value: `${snapshot.cursos.length}` },
      { label: "Pendencias abertas", value: `${snapshot.pendentes.length}` }
    ];
  }, [
    isProfessor,
    isStudent,
    latestStudentRequest,
    latestVisibleContent,
    professorCursos.length,
    professorTurmas.length,
    role,
    snapshot.cursos.length,
    snapshot.pendentes.length,
    usuario.cpf,
    usuario.email,
    usuario.nome
  ]);

  const profileHighlights = useMemo(() => {
    if (isStudent) {
      return [
        `${studentApprovedCourseCount} curso(s) ativo(s)`,
        `${approvedStudentRows.length} matricula(s) aprovada(s)`,
        `${pendingStudentRows.length} solicitacao(oes) pendente(s)`,
        `${snapshot.conteudos.length} material(is) liberado(s)`
      ];
    }

    if (isProfessor) {
      return [
        `${professorTurmas.length} turma(s) vinculada(s)`,
        `${professorCursos.length} curso(s) acompanhados`,
        `${snapshot.conteudos.length} conteudo(s) no workspace`
      ];
    }

    return [
      `${snapshot.cursos.length} curso(s) no catalogo`,
      `${snapshot.alunos.length} aluno(s) ativos`,
      `${snapshot.pendentes.length} pedido(s) em analise`
    ];
  }, [
    approvedStudentRows.length,
    isProfessor,
    isStudent,
    pendingStudentRows.length,
    professorCursos.length,
    professorTurmas.length,
    snapshot.alunos.length,
    snapshot.conteudos.length,
    snapshot.cursos.length,
    snapshot.pendentes.length,
    studentApprovedCourseCount
  ]);

  const profileCourseItems = useMemo(
    () =>
      approvedStudentRows.map((item) => ({
        id: item.id,
        title: item.curso,
        meta: `${item.turma} - solicitada em ${formatDate(item.dataSolicitacao)}`,
        badge: item.notaFinal > 0 ? `Nota ${formatGrade(item.notaFinal)}` : "Ativa"
      })),
    [approvedStudentRows]
  );

  // Mantem a navegacao contextual entre Curso -> Modulos/Turmas sem precisar expandir o roteador agora.
  function abrirSecaoRelacionadaAoCurso(section, curso) {
    setCursoEmFocoPorSecao((atual) => ({
      ...atual,
      [section]: {
        cursoId: Number(curso.id),
        titulo: curso.titulo || `Curso #${curso.id}`
      }
    }));
    onNavigate(`/app/${section}`);
  }

  function limparCursoEmFoco(section) {
    setCursoEmFocoPorSecao((atual) => {
      if (!atual[section]) {
        return atual;
      }

      return {
        ...atual,
        [section]: null
      };
    });
  }

  return (
    <div className="workspace-app">
      <header className="workspace-globalbar">
        <RouteLink className="workspace-brand" onNavigate={onNavigate} to="/app">
          Ed<span>Tech</span>
        </RouteLink>
        <div className="workspace-globalbar__context">
          <span className="workspace-globalbar__eyebrow">{sidebarHeading}</span>
          <strong>{sectionMeta.title}</strong>
        </div>
        {isStudent ? (
          <RouteLink
            className={`workspace-globalbar__shortcut${activeSection === "meus-cursos" ? " workspace-globalbar__shortcut--active" : ""}`}
            onNavigate={onNavigate}
            to="/app/meus-cursos"
          >
            Meus cursos
          </RouteLink>
        ) : null}
        <div className="workspace-globalbar__session" aria-label="Resumo da sessao">
          <div className="workspace-globalbar__identity">
            <button
              aria-expanded={isProfileOpen}
              aria-haspopup="dialog"
              aria-label={`Abrir perfil de ${usuario.nome}`}
              className="workspace-globalbar__avatar"
              onClick={() => setIsProfileOpen(true)}
              type="button"
            >
              {userInitials}
            </button>
            <span className="workspace-globalbar__user-name">{usuario.nome}</span>
          </div>
          <span className="workspace-globalbar__separator" aria-hidden="true">
            |
          </span>
          <span className="workspace-globalbar__role">{role}</span>
          {isDemoMode ? (
            <>
              <span className="workspace-globalbar__separator" aria-hidden="true">
                |
              </span>
              <StatusPill tone="warning">Modo demo</StatusPill>
              {canDisableDemoMode ? (
                <button className="workspace-globalbar__logout" type="button" onClick={() => onDemoModeExit("/login")}>
                  Sair do demo
                </button>
              ) : null}
            </>
          ) : null}
          <span className="workspace-globalbar__separator" aria-hidden="true">
            |
          </span>
          <button className="workspace-globalbar__logout" type="button" onClick={() => onLogout("/")}>
            Sair
          </button>
        </div>
      </header>

      {isProfileOpen ? (
        <ModalPerfilWorkspace
          itensCursos={profileCourseItems}
          fatos={profileFacts}
          destaques={profileHighlights}
          ehAluno={isStudent}
          aoFechar={() => setIsProfileOpen(false)}
          perfil={role}
          iniciaisUsuario={userInitials}
          nomeUsuario={usuario.nome}
        />
      ) : null}

      <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="workspace-sidebar__top">
          <span className="eyebrow">Navegacao lateral</span>
          <p className="workspace-sidebar__subtitle">Acesse as areas do seu workspace e acompanhe o contexto atual.</p>
        </div>

        <div className="workspace-sidebar__card workspace-sidebar__card--session">
          <div className="workspace-sidebar__card-header">
            <span className="eyebrow">Sessao atual</span>
            <span className="workspace-sidebar__badge">{role}</span>
          </div>
          <strong className="workspace-sidebar__user-name">{usuario.nome}</strong>
          <p className="workspace-sidebar__helper">Area aberta: {sectionMeta.title}</p>
        </div>

        <div className="workspace-sidebar__card">
          <div className="workspace-sidebar__card-header">
            <div>
              <span className="eyebrow">Menu do workspace</span>
              <h2 className="workspace-sidebar__card-title">Navegacao</h2>
            </div>
            <span className="workspace-sidebar__badge">{navSections.length} areas</span>
          </div>
          <nav className="workspace-nav" aria-label="Navegacao do painel">
            {navSections.map((section) => {
              const path = section.key === "dashboard" ? "/app" : `/app/${section.key}`;
              const active = section.key === activeSection;

              return (
                <RouteLink
                  className={`workspace-nav__item${active ? " workspace-nav__item--active" : ""}`}
                  key={section.key}
                  onNavigate={onNavigate}
                  to={path}
                >
                  <span>{isProfessor && section.key === "turmas" ? "Minhas Turmas" : section.label}</span>
                </RouteLink>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-hero">
          <div className="workspace-hero__meta">
            <span className="eyebrow">Workspace React</span>
            <h1>{sectionMeta.title}</h1>
            <p>{sectionMeta.description}</p>
          </div>
          {mostrarAcaoCriarConteudo ? (
            <div className="workspace-hero__actions">
              <button
                className="solid-button workspace-hero__primary-action"
                onClick={() => setSolicitacaoNovoConteudo((current) => current + 1)}
                type="button"
              >
                Adicionar novo conteudo
              </button>
            </div>
          ) : null}
        </header>

        {status === "loading" && !hasData ? (
          <PanelCard description="Buscando informacoes da API para montar o painel." title="Carregando workspace" />
        ) : null}

        {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

        {status !== "loading" || hasData ? (
          <>
            {showOverviewCards ? (
              <section className="metric-grid">
                {overviewCards.map((card) => (
                  <article className="metric-card" key={card.label}>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <small>{card.detail}</small>
                  </article>
                ))}
              </section>
            ) : null}

            {activeSection === "dashboard" ? (
              isProfessor ? (
                <SecaoConteudosProfessor
                  conteudos={snapshot.conteudos}
                  cursos={snapshot.cursos}
                  modulos={snapshot.modulos}
                  onRefresh={() => setRefreshKey((current) => current + 1)}
                  onSessionExpired={onSessionExpired}
                  mostrarCardConteudosPublicados={false}
                  turmas={snapshot.turmas}
                  usuario={usuario}
                />
              ) : (
                <ResumoWorkspace
                  conteudos={snapshot.conteudos}
                  cursos={visibleCursos}
                  ehGestor={isManager}
                  ehProfessor={isProfessor}
                  ehAluno={isStudent}
                  matriculas={matriculaRows}
                  pendencias={pendingRows}
                  turmas={visibleTurmas}
                  usuario={usuario}
                />
              )
            ) : null}

            {activeSection === "meus-cursos" ? (
              <SecaoCursosAluno
                conteudos={snapshot.conteudos}
                cursos={snapshot.cursos}
                matriculas={snapshot.matriculas}
                onNavigate={onNavigate}
                progressos={snapshot.progressos}
                turmas={snapshot.turmas}
              />
            ) : null}

            {activeSection === "alunos" ? (
              <SecaoAlunos alunos={snapshot.alunos} matriculas={snapshot.matriculas} />
            ) : null}

            {activeSection === "professores" ? (
              <SecaoProfessores
                cursos={snapshot.cursos}
                onRefresh={() => setRefreshKey((current) => current + 1)}
                onSessionExpired={onSessionExpired}
                professores={snapshot.professores}
                turmas={snapshot.turmas}
              />
            ) : null}

            {activeSection === "cursos" ? (
              <SecaoCursos
                coordenadores={snapshot.coordenadores}
                cursos={cursosDaSecaoCursos}
                ehAdmin={role === "Admin"}
                ehCoordenador={role === "Coordenador"}
                ehProfessor={role === "Professor"}
                matriculas={snapshot.matriculas}
                modulos={snapshot.modulos}
                onAbrirSecaoCurso={abrirSecaoRelacionadaAoCurso}
                onRefresh={() => setRefreshKey((current) => current + 1)}
                onSessionExpired={onSessionExpired}
                turmas={snapshot.turmas}
              />
            ) : null}

            {activeSection === "modulos" ? (
              <SecaoModulos
                alunos={snapshot.alunos}
                cursos={snapshot.cursos}
                cursoEmFoco={cursoEmFocoPorSecao.modulos}
                matriculas={snapshot.matriculas}
                modulos={snapshot.modulos}
                onCursoEmFocoAplicado={() => limparCursoEmFoco("modulos")}
                onRefresh={() => setRefreshKey((current) => current + 1)}
                onSessionExpired={onSessionExpired}
                professores={snapshot.professores}
                turmas={snapshot.turmas}
              />
            ) : null}

            {activeSection === "conteudos" ? (
              isProfessor ? (
                <SecaoConteudosProfessor
                  conteudos={snapshot.conteudos}
                  solicitacaoNovoConteudo={solicitacaoNovoConteudo}
                  cursos={snapshot.cursos}
                  modulos={snapshot.modulos}
                  onRefresh={() => setRefreshKey((current) => current + 1)}
                  onSessionExpired={onSessionExpired}
                  mostrarCardVinculosEnsino={false}
                  turmas={snapshot.turmas}
                  usuario={usuario}
                />
              ) : (
                <SecaoConteudosAluno
                  conteudos={snapshot.conteudos}
                  matriculas={snapshot.matriculas}
                  onRefresh={() => setRefreshKey((current) => current + 1)}
                  onSessionExpired={onSessionExpired}
                  progressos={snapshot.progressos}
                />
              )
            ) : null}

            {activeSection === "matriculas" ? (
              <SecaoMatriculas
                ehAluno={isStudent}
                linhasMatriculas={matriculaRows}
                onRefresh={() => setRefreshKey((current) => current + 1)}
                onSessionExpired={onSessionExpired}
                turmas={snapshot.turmas}
              />
            ) : null}

            {activeSection === "turmas" ? (
              <SecaoTurmas
                cursoPorId={cursoById}
                cursoEmFoco={cursoEmFocoPorSecao.turmas}
                ehGestor={isManager}
                ehProfessor={isProfessor}
                matriculas={snapshot.matriculas}
                onCursoEmFocoAplicado={() => limparCursoEmFoco("turmas")}
                onRefresh={() => setRefreshKey((current) => current + 1)}
                onSessionExpired={onSessionExpired}
                professores={snapshot.professores}
                professorPorId={professorById}
                turmas={visibleTurmas}
              />
            ) : null}
          </>
        ) : null}
      </main>
      </div>
    </div>
  );
}

function cursoEstaAtivo(curso) {
  if (typeof curso.ativo === "boolean") {
    return curso.ativo;
  }

  const status = String(curso.statusCurso ?? curso.status ?? "").trim().toLowerCase();
  if (!status) {
    return true;
  }

  return !["inativo", "inativa", "arquivado", "arquivada", "cancelado", "cancelada"].includes(status);
}
