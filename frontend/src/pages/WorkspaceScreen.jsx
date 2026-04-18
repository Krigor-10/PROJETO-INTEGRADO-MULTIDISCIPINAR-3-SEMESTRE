import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable, EmptyState, InlineMessage, MiniList, PanelCard, RouteLink, StatusPill } from "../components/Primitives.jsx";
import { APP_SECTIONS, getSectionMeta, MANAGER_ROLES, EMPTY_SNAPSHOT } from "../data/appConfig.js";
import { hasSnapshotData, loadWorkspaceSnapshot, mapById } from "../lib/dashboard.js";
import { ApiError, apiRequest } from "../lib/api.js";
import {
  compactText,
  describeCourse,
  formatDate,
  formatGrade,
  formatMoney,
  maskCpf,
  normalizeContentType,
  normalizePublicationStatus,
  normalizeStatus,
  publicationStatusTone,
  statusTone
} from "../lib/format.js";
import { normalizePath } from "../lib/router.js";

const MODULE_FORM_INITIAL_STATE = {
  cursoId: "",
  titulo: ""
};

const CONTENT_TYPE_OPTIONS = [
  { value: "1", label: "Texto" },
  { value: "2", label: "PDF" },
  { value: "3", label: "Video" },
  { value: "4", label: "Link externo" }
];

const PUBLICATION_STATUS_OPTIONS = [
  { value: "1", label: "Rascunho" },
  { value: "2", label: "Publicado" },
  { value: "3", label: "Arquivado" }
];

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
  const showOverviewCards = activeSection !== "conteudos" && !(isStudent && activeSection === "matriculas");

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

  const visibleCursos = isProfessor ? professorCursos : snapshot.cursos;
  const visibleTurmas = isProfessor ? professorTurmas : snapshot.turmas;

  const matriculaRows = useMemo(
    () =>
      snapshot.matriculas.map((matricula) => ({
        id: matricula.id,
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
      const publishedCount = snapshot.conteudos.filter(
        (item) => normalizePublicationStatus(item.statusPublicacao) === "Publicado"
      ).length;
      const draftCount = snapshot.conteudos.filter(
        (item) => normalizePublicationStatus(item.statusPublicacao) === "Rascunho"
      ).length;

      return [
        { label: "Turmas ligadas", value: professorTurmas.length, detail: "sob sua responsabilidade" },
        { label: "Cursos em foco", value: professorCursos.length, detail: "com alguma turma associada" },
        { label: "Conteudos", value: snapshot.conteudos.length, detail: "materiais sob sua autoria" },
        { label: "Publicados", value: publishedCount, detail: "ja visiveis para as turmas" },
        { label: "Rascunhos", value: draftCount, detail: "ainda em preparo" }
      ];
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
        <ProfileModal
          courseItems={profileCourseItems}
          facts={profileFacts}
          highlights={profileHighlights}
          isStudent={isStudent}
          onClose={() => setIsProfileOpen(false)}
          role={role}
          userInitials={userInitials}
          userName={usuario.nome}
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
                  <span>{section.label}</span>
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
              <DashboardOverview
                conteudos={snapshot.conteudos}
                cursos={visibleCursos}
                isManager={isManager}
                isProfessor={isProfessor}
                isStudent={isStudent}
                matriculas={matriculaRows}
                pendencias={pendingRows}
                turmas={visibleTurmas}
                usuario={usuario}
              />
            ) : null}

            {activeSection === "meus-cursos" ? (
              <StudentCoursesSection
                conteudos={snapshot.conteudos}
                cursos={snapshot.cursos}
                matriculas={snapshot.matriculas}
                onNavigate={onNavigate}
                turmas={snapshot.turmas}
              />
            ) : null}

            {activeSection === "alunos" ? (
              <PanelCard description="Lista vinda da API protegida para administracao e coordenacao." title="Base de alunos">
                <DataTable
                  columns={[
                    { key: "nome", label: "Nome" },
                    { key: "email", label: "E-mail" },
                    { key: "cpf", label: "CPF", render: (row) => maskCpf(row.cpf) },
                    { key: "cidade", label: "Cidade" },
                    {
                      key: "ativo",
                      label: "Status",
                      render: (row) => <StatusPill tone={row.ativo ? "success" : "danger"}>{row.ativo ? "Ativo" : "Inativo"}</StatusPill>
                    }
                  ]}
                  emptyMessage="Nenhum aluno encontrado."
                  rows={snapshot.alunos}
                />
              </PanelCard>
            ) : null}

            {activeSection === "professores" ? (
              <PanelCard description="Corpo docente disponivel para composicao das turmas." title="Professores cadastrados">
                <DataTable
                  columns={[
                    { key: "nome", label: "Nome" },
                    { key: "email", label: "E-mail" },
                    { key: "especialidade", label: "Especialidade" }
                  ]}
                  emptyMessage="Nenhum professor encontrado."
                  rows={snapshot.professores}
                />
              </PanelCard>
            ) : null}

            {activeSection === "cursos" ? (
              <PanelCard description="Catalogo de cursos reutilizado na home publica e no ambiente autenticado." title="Cursos ativos">
                <DataTable
                  columns={[
                    { key: "titulo", label: "Titulo" },
                    { key: "descricao", label: "Descricao", render: (row) => compactText(row.descricao, 90) },
                    { key: "preco", label: "Preco", render: (row) => formatMoney(row.preco) },
                    {
                      key: "coordenacao",
                      label: "Coordenacao",
                      render: (row) => (row.coordenadorId ? `Usuario #${row.coordenadorId}` : "Nao atribuida")
                    }
                  ]}
                  emptyMessage="Nenhum curso encontrado."
                  rows={visibleCursos}
                />
              </PanelCard>
            ) : null}

            {activeSection === "modulos" ? (
              <ModuleManagementSection
                cursos={snapshot.cursos}
                modulos={snapshot.modulos}
                onRefresh={() => setRefreshKey((current) => current + 1)}
                onSessionExpired={onSessionExpired}
              />
            ) : null}

            {activeSection === "conteudos" ? (
              isProfessor ? (
                <ContentManagementSection
                  conteudos={snapshot.conteudos}
                  cursos={snapshot.cursos}
                  modulos={snapshot.modulos}
                  onRefresh={() => setRefreshKey((current) => current + 1)}
                  onSessionExpired={onSessionExpired}
                  turmas={snapshot.turmas}
                  usuario={usuario}
                />
              ) : (
                <StudentContentSection conteudos={snapshot.conteudos} matriculas={snapshot.matriculas} />
              )
            ) : null}

            {activeSection === "matriculas" ? (
              <PanelCard
                description={isStudent ? "Suas solicitacoes e vinculacoes atuais." : "Panorama das matriculas registradas no sistema."}
                title={isStudent ? "Minhas matriculas" : "Matriculas do sistema"}
              >
                <DataTable
                  columns={
                    isStudent
                      ? [
                          { key: "curso", label: "Curso" },
                          { key: "turma", label: "Turma" },
                          {
                            key: "status",
                            label: "Status",
                            render: (row) => <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                          },
                          { key: "notaFinal", label: "Nota", render: (row) => formatGrade(row.notaFinal) },
                          { key: "dataSolicitacao", label: "Solicitada em", render: (row) => formatDate(row.dataSolicitacao) }
                        ]
                      : [
                          { key: "id", label: "ID" },
                          { key: "aluno", label: "Aluno" },
                          { key: "curso", label: "Curso" },
                          { key: "turma", label: "Turma" },
                          {
                            key: "status",
                            label: "Status",
                            render: (row) => <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                          },
                          { key: "dataSolicitacao", label: "Solicitada em", render: (row) => formatDate(row.dataSolicitacao) }
                        ]
                  }
                  emptyMessage="Nenhuma matricula encontrada."
                  rows={matriculaRows}
                />
              </PanelCard>
            ) : null}

            {activeSection === "turmas" ? (
              <PanelCard description="Visao das turmas disponiveis para alocacao e acompanhamento." title={isProfessor ? "Turmas ligadas ao seu perfil" : "Turmas cadastradas"}>
                <DataTable
                  columns={[
                    { key: "nomeTurma", label: "Turma" },
                    {
                      key: "cursoId",
                      label: "Curso",
                      render: (row) => cursoById.get(row.cursoId)?.titulo || `Curso #${row.cursoId}`
                    },
                    {
                      key: "professorId",
                      label: "Professor",
                      render: (row) =>
                        row.professorId
                          ? professorById.get(row.professorId)?.nome || `Professor #${row.professorId}`
                          : "Nao definido"
                    },
                    { key: "dataCriacao", label: "Criada em", render: (row) => formatDate(row.dataCriacao) }
                  ]}
                  emptyMessage="Nenhuma turma encontrada."
                  rows={visibleTurmas}
                />
              </PanelCard>
            ) : null}
          </>
        ) : null}
      </main>
      </div>
    </div>
  );
}

function ModuleManagementSection({ cursos, modulos, onRefresh, onSessionExpired }) {
  const [formState, setFormState] = useState(MODULE_FORM_INITIAL_STATE);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [feedback, setFeedback] = useState({ tone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedCourses = useMemo(
    () => [...cursos].sort((left, right) => left.titulo.localeCompare(right.titulo, "pt-BR")),
    [cursos]
  );

  useEffect(() => {
    if (editingModuleId || formState.cursoId || !sortedCourses.length) {
      return;
    }

    setFormState((current) => ({
      ...current,
      cursoId: String(sortedCourses[0].id)
    }));
  }, [editingModuleId, formState.cursoId, sortedCourses]);

  const cursoById = useMemo(() => mapById(cursos), [cursos]);

  const moduleRows = useMemo(
    () =>
      [...modulos].sort((left, right) => {
        const leftCurso = cursoById.get(left.cursoId)?.titulo || "";
        const rightCurso = cursoById.get(right.cursoId)?.titulo || "";
        const courseComparison = leftCurso.localeCompare(rightCurso, "pt-BR");

        if (courseComparison !== 0) {
          return courseComparison;
        }

        return left.titulo.localeCompare(right.titulo, "pt-BR");
      }),
    [cursoById, modulos]
  );

  function handleFieldChange(event) {
    const { name, value } = event.target;

    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  }

  function resetForm() {
    setEditingModuleId(null);
    setFormState({
      cursoId: sortedCourses[0] ? String(sortedCourses[0].id) : "",
      titulo: ""
    });
  }

  function startEditing(modulo) {
    setEditingModuleId(modulo.id);
    setFormState({
      cursoId: String(modulo.cursoId),
      titulo: modulo.titulo
    });
    setFeedback({ tone: "", message: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedTitle = formState.titulo.trim();

    if (!normalizedTitle) {
      setFeedback({ tone: "error", message: "Informe o titulo do modulo antes de salvar." });
      return;
    }

    if (!formState.cursoId) {
      setFeedback({ tone: "error", message: "Selecione um curso para vincular o modulo." });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ tone: "", message: "" });

    try {
      if (editingModuleId) {
        await apiRequest(`/Modulos/${editingModuleId}`, {
          method: "PUT",
          body: JSON.stringify({ titulo: normalizedTitle })
        });

        setFeedback({ tone: "success", message: "Modulo atualizado com sucesso." });
      } else {
        await apiRequest("/Modulos", {
          method: "POST",
          body: JSON.stringify({
            titulo: normalizedTitle,
            cursoId: Number(formState.cursoId)
          })
        });

        setFeedback({ tone: "success", message: "Modulo criado com sucesso." });
      }

      resetForm();
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setFeedback({
        tone: "error",
        message: err.message || "Nao foi possivel salvar o modulo agora."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(modulo) {
    const confirmed = window.confirm(`Deseja excluir o modulo "${modulo.titulo}"?`);

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setFeedback({ tone: "", message: "" });

    try {
      await apiRequest(`/Modulos/${modulo.id}`, { method: "DELETE" });

      if (editingModuleId === modulo.id) {
        resetForm();
      }

      setFeedback({ tone: "success", message: "Modulo excluido com sucesso." });
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setFeedback({
        tone: "error",
        message: err.message || "Nao foi possivel excluir o modulo agora."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="panel-grid panel-grid--stacked">
      <PanelCard
        description="Crie e mantenha a estrutura modular dos cursos antes de ligar conteudos e avaliacoes."
        title={editingModuleId ? "Editar modulo" : "Novo modulo"}
      >
        <form className="management-form" onSubmit={handleSubmit}>
          <div className="management-form__grid">
            <label className="management-field">
              <span>Curso</span>
              <select
                disabled={isSubmitting || editingModuleId !== null || !sortedCourses.length}
                name="cursoId"
                onChange={handleFieldChange}
                value={formState.cursoId}
              >
                {!sortedCourses.length ? <option value="">Nenhum curso disponivel</option> : null}
                {sortedCourses.map((curso) => (
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
                disabled={isSubmitting}
                maxLength={150}
                name="titulo"
                onChange={handleFieldChange}
                placeholder="Ex.: Fundamentos de Programacao"
                type="text"
                value={formState.titulo}
              />
            </label>
          </div>

          {editingModuleId ? (
            <p className="management-form__hint">
              O curso fica travado durante a edicao porque a API atual permite atualizar apenas o titulo do modulo.
            </p>
          ) : null}

          {feedback.message ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}

          <div className="management-form__actions">
            <button className="solid-button" disabled={isSubmitting || !sortedCourses.length} type="submit">
              {isSubmitting ? "Salvando..." : editingModuleId ? "Salvar alteracoes" : "Criar modulo"}
            </button>

            <button className="ghost-button" disabled={isSubmitting} onClick={resetForm} type="button">
              {editingModuleId ? "Cancelar edicao" : "Limpar campos"}
            </button>
          </div>
        </form>
      </PanelCard>

      <PanelCard
        description="Lista consolidada dos modulos cadastrados, com vinculo direto ao curso correspondente."
        title="Modulos cadastrados"
      >
        <DataTable
          columns={[
            { key: "titulo", label: "Modulo" },
            {
              key: "cursoId",
              label: "Curso",
              render: (row) => cursoById.get(row.cursoId)?.titulo || `Curso #${row.cursoId}`
            },
            { key: "dataCriacao", label: "Criado em", render: (row) => formatDate(row.dataCriacao) },
            {
              key: "acoes",
              label: "Acoes",
              render: (row) => (
                <div className="table-actions">
                  <button
                    className="table-action"
                    disabled={isSubmitting}
                    onClick={() => startEditing(row)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className="table-action table-action--danger"
                    disabled={isSubmitting}
                    onClick={() => handleDelete(row)}
                    type="button"
                  >
                    Excluir
                  </button>
                </div>
              )
            }
          ]}
          emptyMessage="Nenhum modulo cadastrado ainda."
          rows={moduleRows}
        />
      </PanelCard>
    </div>
  );
}

function ContentManagementSection({ conteudos, cursos, modulos, onRefresh, onSessionExpired, turmas, usuario }) {
  const [formState, setFormState] = useState(() => createContentFormState([], []));
  const [editingContentId, setEditingContentId] = useState(null);
  const [feedback, setFeedback] = useState({ tone: "", message: "" });
  const [tableFeedback, setTableFeedback] = useState({ tone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContentIds, setSelectedContentIds] = useState([]);
  const formSectionRef = useRef(null);

  const courseById = useMemo(() => mapById(cursos), [cursos]);

  const teacherTurmas = useMemo(
    () =>
      [...turmas]
        .filter((turma) => turma.professorId === usuario.id)
        .sort((left, right) => {
          const leftCourse = courseById.get(left.cursoId)?.titulo || "";
          const rightCourse = courseById.get(right.cursoId)?.titulo || "";
          const courseComparison = leftCourse.localeCompare(rightCourse, "pt-BR");

          if (courseComparison !== 0) {
            return courseComparison;
          }

          return left.nomeTurma.localeCompare(right.nomeTurma, "pt-BR");
        }),
    [courseById, turmas, usuario.id]
  );

  const teacherModules = useMemo(
    () =>
      [...modulos]
        .filter((modulo) => teacherTurmas.some((turma) => turma.cursoId === modulo.cursoId))
        .sort((left, right) => {
          const leftCourse = courseById.get(left.cursoId)?.titulo || "";
          const rightCourse = courseById.get(right.cursoId)?.titulo || "";
          const courseComparison = leftCourse.localeCompare(rightCourse, "pt-BR");

          if (courseComparison !== 0) {
            return courseComparison;
          }

          return left.titulo.localeCompare(right.titulo, "pt-BR");
        }),
    [courseById, modulos, teacherTurmas]
  );

  const modulesByCourseId = useMemo(() => {
    const groupedModules = new Map();

    teacherModules.forEach((modulo) => {
      const currentModules = groupedModules.get(modulo.cursoId) || [];
      currentModules.push(modulo);
      groupedModules.set(modulo.cursoId, currentModules);
    });

    return groupedModules;
  }, [teacherModules]);

  const teacherContextRows = useMemo(
    () =>
      [...teacherTurmas]
        .sort((left, right) => {
          const leftCourse = courseById.get(left.cursoId)?.titulo || "";
          const rightCourse = courseById.get(right.cursoId)?.titulo || "";
          const courseComparison = leftCourse.localeCompare(rightCourse, "pt-BR");

          if (courseComparison !== 0) {
            return courseComparison;
          }

          return (left.nomeTurma || "").localeCompare(right.nomeTurma || "", "pt-BR");
        })
        .map((turma) => {
          const curso = courseById.get(turma.cursoId) || null;
          const modulosDaTurma = modulesByCourseId.get(turma.cursoId) || [];

          return {
            id: turma.id,
            curso,
            turma,
            modulos: modulosDaTurma
          };
        }),
    [courseById, modulesByCourseId, teacherTurmas]
  );

  useEffect(() => {
    if (editingContentId || formState.turmaId || !teacherTurmas.length) {
      return;
    }

    setFormState(createContentFormState(teacherTurmas, teacherModules));
  }, [editingContentId, formState.turmaId, teacherModules, teacherTurmas]);

  const selectedTurma = useMemo(
    () => teacherTurmas.find((turma) => String(turma.id) === formState.turmaId) || null,
    [formState.turmaId, teacherTurmas]
  );

  const availableModules = useMemo(() => {
    if (!selectedTurma) {
      return [];
    }

    return modulesByCourseId.get(selectedTurma.cursoId) || [];
  }, [modulesByCourseId, selectedTurma]);

  useEffect(() => {
    if (!selectedTurma || editingContentId) {
      return;
    }

    if (!availableModules.length && formState.moduloId) {
      setFormState((current) => ({
        ...current,
        moduloId: ""
      }));
      return;
    }

    const hasCurrentModule = availableModules.some((modulo) => String(modulo.id) === formState.moduloId);
    if (!hasCurrentModule && availableModules[0]) {
      setFormState((current) => ({
        ...current,
        moduloId: String(availableModules[0].id)
      }));
    }
  }, [availableModules, editingContentId, formState.moduloId, selectedTurma]);

  const selectedCourseTitle = selectedTurma
    ? courseById.get(selectedTurma.cursoId)?.titulo || `Curso #${selectedTurma.cursoId}`
    : "";

  const sortedContentRows = useMemo(
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

  const selectedContentRows = useMemo(
    () => sortedContentRows.filter((row) => selectedContentIds.includes(row.id)),
    [selectedContentIds, sortedContentRows]
  );

  const allContentRowsSelected =
    sortedContentRows.length > 0 && selectedContentIds.length === sortedContentRows.length;

  useEffect(() => {
    setSelectedContentIds((current) =>
      current.filter((id) => sortedContentRows.some((row) => row.id === id))
    );
  }, [sortedContentRows]);

  const contentOverview = useMemo(() => {
    const publishedCount = conteudos.filter(
      (item) => normalizePublicationStatus(item.statusPublicacao) === "Publicado"
    ).length;
    const draftCount = conteudos.filter(
      (item) => normalizePublicationStatus(item.statusPublicacao) === "Rascunho"
    ).length;
    const archivedCount = conteudos.filter(
      (item) => normalizePublicationStatus(item.statusPublicacao) === "Arquivado"
    ).length;

    return [
      `${teacherTurmas.length} turma(s)`,
      `${teacherModules.length} modulo(s)`,
      `${conteudos.length} conteudo(s)`,
      `${publishedCount} publicado(s)`,
      `${draftCount} rascunho(s)`,
      `${archivedCount} arquivado(s)`
    ];
  }, [conteudos, teacherModules.length, teacherTurmas.length]);

  const selectedType = Number(formState.tipoConteudo || CONTENT_TYPE_OPTIONS[0].value);
  const needsBodyText = selectedType === 1;
  const needsFileUrl = selectedType === 2;
  const needsLinkUrl = selectedType === 3 || selectedType === 4;

  useEffect(() => {
    if (!editingContentId || !formSectionRef.current) {
      return;
    }

    formSectionRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, [editingContentId]);

  function resetForm() {
    setEditingContentId(null);
    setFormState(createContentFormState(teacherTurmas, teacherModules));
    setFeedback({ tone: "", message: "" });
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;

    if (name === "turmaId") {
      const nextTurma = teacherTurmas.find((turma) => String(turma.id) === value) || null;
      const nextModules = nextTurma ? modulesByCourseId.get(nextTurma.cursoId) || [] : [];

      setFormState((current) => ({
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

    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  }

  function startEditing(conteudo) {
    setEditingContentId(conteudo.id);
    setSelectedContentIds([conteudo.id]);
    setTableFeedback({ tone: "", message: "" });
    setFormState({
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
    setFeedback({ tone: "", message: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedTitle = formState.titulo.trim();
    const payload = {
      titulo: normalizedTitle,
      descricao: formState.descricao.trim(),
      tipoConteudo: Number(formState.tipoConteudo),
      corpoTexto: needsBodyText ? formState.corpoTexto.trim() : "",
      arquivoUrl: needsFileUrl ? formState.arquivoUrl.trim() : "",
      linkUrl: needsLinkUrl ? formState.linkUrl.trim() : "",
      turmaId: Number(formState.turmaId),
      moduloId: Number(formState.moduloId),
      statusPublicacao: Number(formState.statusPublicacao),
      ordemExibicao: Number(formState.ordemExibicao),
      pesoProgresso: Number(formState.pesoProgresso)
    };

    if (!teacherTurmas.length) {
      setFeedback({ tone: "error", message: "Seu perfil ainda nao possui turmas para publicacao." });
      return;
    }

    if (!availableModules.length) {
      setFeedback({ tone: "error", message: "Nao existem modulos disponiveis para a turma selecionada." });
      return;
    }

    if (!normalizedTitle) {
      setFeedback({ tone: "error", message: "Informe o titulo do conteudo antes de salvar." });
      return;
    }

    if (!payload.turmaId) {
      setFeedback({ tone: "error", message: "Selecione a turma que vai receber o conteudo." });
      return;
    }

    if (!payload.moduloId) {
      setFeedback({ tone: "error", message: "Selecione um modulo para organizar a publicacao." });
      return;
    }

    if (!Number.isInteger(payload.ordemExibicao) || payload.ordemExibicao < 0) {
      setFeedback({ tone: "error", message: "Use um numero inteiro igual ou maior que zero para a ordem." });
      return;
    }

    if (!Number.isFinite(payload.pesoProgresso) || payload.pesoProgresso <= 0) {
      setFeedback({ tone: "error", message: "Informe um peso de progresso maior que zero." });
      return;
    }

    if (needsBodyText && !payload.corpoTexto) {
      setFeedback({ tone: "error", message: "Preencha o texto principal do conteudo." });
      return;
    }

    if (needsFileUrl && !payload.arquivoUrl) {
      setFeedback({ tone: "error", message: "Informe a URL do PDF antes de publicar." });
      return;
    }

    if (needsLinkUrl && !payload.linkUrl) {
      setFeedback({ tone: "error", message: "Informe a URL do recurso antes de publicar." });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ tone: "", message: "" });

    try {
      if (editingContentId) {
        await apiRequest(`/ConteudosDidaticos/${editingContentId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });

        setFeedback({ tone: "success", message: "Conteudo atualizado com sucesso." });
      } else {
        await apiRequest("/ConteudosDidaticos", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        setFeedback({ tone: "success", message: "Conteudo criado com sucesso." });
      }

      setEditingContentId(null);
      setFormState(createContentFormState(teacherTurmas, teacherModules));
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setFeedback({
        tone: "error",
        message: err.message || "Nao foi possivel salvar o conteudo agora."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleContentSelection(contentId) {
    setSelectedContentIds((current) =>
      current.includes(contentId) ? current.filter((id) => id !== contentId) : [...current, contentId]
    );
  }

  function toggleAllContentSelection() {
    setSelectedContentIds((current) =>
      current.length === sortedContentRows.length ? [] : sortedContentRows.map((row) => row.id)
    );
  }

  function handleEditSelected() {
    if (selectedContentRows.length !== 1) {
      return;
    }

    startEditing(selectedContentRows[0]);
  }

  async function handleDeleteSelected(rowsToDelete = selectedContentRows) {
    if (!rowsToDelete.length) {
      return;
    }

    const confirmed = window.confirm(
      rowsToDelete.length === 1
        ? `Deseja excluir o conteudo "${rowsToDelete[0].titulo}"?`
        : `Deseja excluir ${rowsToDelete.length} conteudos selecionados?`
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setFeedback({ tone: "", message: "" });
    setTableFeedback({ tone: "", message: "" });

    try {
      for (const conteudo of rowsToDelete) {
        await apiRequest(`/ConteudosDidaticos/${conteudo.id}`, { method: "DELETE" });
      }

      if (editingContentId && rowsToDelete.some((conteudo) => conteudo.id === editingContentId)) {
        resetForm();
      }

      setSelectedContentIds((current) =>
        current.filter((id) => !rowsToDelete.some((conteudo) => conteudo.id === id))
      );
      setTableFeedback({
        tone: "success",
        message:
          rowsToDelete.length === 1
            ? "Conteudo excluido com sucesso."
            : `${rowsToDelete.length} conteudos foram excluidos com sucesso.`
      });
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setTableFeedback({
        tone: "error",
        message: err.message || "Nao foi possivel excluir os conteudos selecionados agora."
      });
    } finally {
      setIsSubmitting(false);
    }
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
          {contentOverview.map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <PanelCard
        description="Cursos, turmas e modulos disponiveis para publicacao no seu login."
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
          rows={teacherContextRows}
        />
      </PanelCard>

      <div className="content-section__block content-section__block--form" ref={formSectionRef}>
      <PanelCard
        description="Cadastre ou ajuste materiais ligados a uma turma e a um modulo."
        title={editingContentId ? "Editar conteudo didatico" : "Novo conteudo didatico"}
      >
        {!teacherTurmas.length ? (
          <InlineMessage tone="info">
            Seu usuario ainda nao possui turmas atribuidas. Assim que uma turma for vinculada ao seu perfil, a publicacao fica disponivel aqui.
          </InlineMessage>
        ) : !teacherModules.length ? (
          <InlineMessage tone="info">
            As suas turmas ja existem, mas ainda nao ha modulos cadastrados nos cursos correspondentes. Peca ao time de coordenacao para estruturar os modulos antes de publicar.
          </InlineMessage>
        ) : (
          <form className="management-form" onSubmit={handleSubmit}>
            <div className="management-form__grid">
              <label className="management-field">
                <span>Turma</span>
                <select
                  disabled={isSubmitting || !teacherTurmas.length}
                  name="turmaId"
                  onChange={handleFieldChange}
                  value={formState.turmaId}
                >
                  {teacherTurmas.map((turma) => (
                    <option key={turma.id} value={turma.id}>
                      {turma.nomeTurma}
                    </option>
                  ))}
                </select>
                {selectedCourseTitle ? <small>Curso vinculado: {selectedCourseTitle}</small> : null}
              </label>

              <label className="management-field">
                <span>Modulo</span>
                <select
                  disabled={isSubmitting || !availableModules.length}
                  key={formState.turmaId || "sem-turma"}
                  name="moduloId"
                  onChange={handleFieldChange}
                  value={formState.moduloId}
                >
                  {!availableModules.length ? <option value="">Nenhum modulo disponivel</option> : null}
                  {availableModules.map((modulo) => (
                    <option key={modulo.id} value={modulo.id}>
                      {modulo.titulo}
                    </option>
                  ))}
                </select>
                {selectedCourseTitle ? <small>Mostrando modulos do curso: {selectedCourseTitle}</small> : null}
              </label>

              <label className="management-field">
                <span>Tipo de conteudo</span>
                <select
                  disabled={isSubmitting}
                  name="tipoConteudo"
                  onChange={handleFieldChange}
                  value={formState.tipoConteudo}
                >
                  {CONTENT_TYPE_OPTIONS.map((option) => (
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
                  disabled={isSubmitting}
                  name="statusPublicacao"
                  onChange={handleFieldChange}
                  value={formState.statusPublicacao}
                >
                  {PUBLICATION_STATUS_OPTIONS.map((option) => (
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
                  disabled={isSubmitting}
                  maxLength={180}
                  name="titulo"
                  onChange={handleFieldChange}
                  placeholder="Ex.: Aula 01 - Panorama do modulo"
                  type="text"
                  value={formState.titulo}
                />
              </label>

              <label className="management-field management-field--wide">
                <span>Descricao curta</span>
                <textarea
                  disabled={isSubmitting}
                  maxLength={500}
                  name="descricao"
                  onChange={handleFieldChange}
                  placeholder="Explique rapidamente o objetivo desse material para a turma."
                  value={formState.descricao}
                />
              </label>

              {needsBodyText ? (
                <label className="management-field management-field--wide">
                  <span>Corpo do texto</span>
                  <textarea
                    disabled={isSubmitting}
                    name="corpoTexto"
                    onChange={handleFieldChange}
                    placeholder="Escreva aqui o material principal que sera exibido para os alunos."
                    value={formState.corpoTexto}
                  />
                </label>
              ) : null}

              {needsFileUrl ? (
                <label className="management-field management-field--wide">
                  <span>URL do PDF</span>
                  <input
                    autoComplete="off"
                    disabled={isSubmitting}
                    name="arquivoUrl"
                    onChange={handleFieldChange}
                    placeholder="https://..."
                    type="url"
                    value={formState.arquivoUrl}
                  />
                  <small>Use um link direto para o arquivo que a turma deve abrir ou baixar.</small>
                </label>
              ) : null}

              {needsLinkUrl ? (
                <label className="management-field management-field--wide">
                  <span>{selectedType === 3 ? "URL do video" : "URL do recurso"}</span>
                  <input
                    autoComplete="off"
                    disabled={isSubmitting}
                    name="linkUrl"
                    onChange={handleFieldChange}
                    placeholder="https://..."
                    type="url"
                    value={formState.linkUrl}
                  />
                  <small>
                    {selectedType === 3
                      ? "Cole o link do video ou da aula gravada."
                      : "Cole o link externo que deve complementar o modulo."}
                  </small>
                </label>
              ) : null}

              <label className="management-field">
                <span>Ordem de exibicao</span>
                <input
                  disabled={isSubmitting}
                  min="0"
                  name="ordemExibicao"
                  onChange={handleFieldChange}
                  type="number"
                  value={formState.ordemExibicao}
                />
                <small>Controla a sequencia em que o conteudo aparece no modulo.</small>
              </label>

              <label className="management-field">
                <span>Peso de progresso</span>
                <input
                  disabled={isSubmitting}
                  min="0.01"
                  name="pesoProgresso"
                  onChange={handleFieldChange}
                  step="0.01"
                  type="number"
                  value={formState.pesoProgresso}
                />
                <small>Define quanto este item pesa no avanco pedagogico do aluno.</small>
              </label>
            </div>

            {feedback.message ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}

            <div className="management-form__actions">
              <button
                className="solid-button"
                disabled={isSubmitting || !teacherTurmas.length || !availableModules.length}
                type="submit"
              >
                {isSubmitting ? "Salvando..." : editingContentId ? "Salvar alteracoes" : "Criar conteudo"}
              </button>

              <button className="ghost-button" disabled={isSubmitting} onClick={resetForm} type="button">
                {editingContentId ? "Cancelar edicao" : "Limpar campos"}
              </button>
            </div>
          </form>
        )}
      </PanelCard>
      </div>

      <div className="content-section__block content-section__block--published">
      <PanelCard
        description="Selecione itens para editar ou excluir e acompanhe a organizacao por turma e modulo."
        title="Conteudos publicados e rascunhos"
      >
        <div className="table-toolbar">
          <div className="table-actions">
            <button
              className="table-action"
              disabled={isSubmitting || selectedContentRows.length !== 1}
              onClick={handleEditSelected}
              type="button"
            >
              Editar
            </button>
            <button
              className="table-action table-action--danger"
              disabled={isSubmitting || !selectedContentRows.length}
              onClick={() => handleDeleteSelected()}
              type="button"
            >
              Excluir
            </button>
          </div>
          <p className="table-toolbar__summary">
            {selectedContentRows.length
              ? `${selectedContentRows.length} conteudo(s) selecionado(s).`
              : "Selecione um ou mais conteudos pela caixa ao lado esquerdo."}
          </p>
        </div>

        {tableFeedback.message ? <InlineMessage tone={tableFeedback.tone}>{tableFeedback.message}</InlineMessage> : null}

        <DataTable
          columns={[
            {
              key: "selecionar",
              label: (
                <div className="table-select-cell">
                  <input
                    aria-label={allContentRowsSelected ? "Desmarcar todos os conteudos" : "Selecionar todos os conteudos"}
                    checked={allContentRowsSelected}
                    className="table-select-input"
                    onChange={toggleAllContentSelection}
                    type="checkbox"
                  />
                </div>
              ),
              render: (row) => (
                <div className="table-select-cell">
                  <input
                    aria-label={`Selecionar conteudo ${row.titulo}`}
                    checked={selectedContentIds.includes(row.id)}
                    className="table-select-input"
                    onChange={() => toggleContentSelection(row.id)}
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
          emptyMessage="Nenhum conteudo cadastrado ainda."
          rows={sortedContentRows}
        />
      </PanelCard>
      </div>
    </div>
  );
}

function StudentCoursesSection({ conteudos, cursos, matriculas, onNavigate, turmas }) {
  const courseById = useMemo(() => mapById(cursos), [cursos]);
  const turmaById = useMemo(() => mapById(turmas), [turmas]);

  const contentSummaryByTurma = useMemo(() => {
    const summary = new Map();

    conteudos.forEach((conteudo) => {
      const current = summary.get(conteudo.turmaId) || {
        total: 0,
        modules: new Set(),
        latestPublication: null
      };

      current.total += 1;
      current.modules.add(conteudo.moduloId);

      const candidateDate = conteudo.publicadoEm || conteudo.atualizadoEm || conteudo.criadoEm || null;
      if (!current.latestPublication || new Date(candidateDate || 0).getTime() > new Date(current.latestPublication || 0).getTime()) {
        current.latestPublication = candidateDate;
      }

      summary.set(conteudo.turmaId, current);
    });

    return summary;
  }, [conteudos]);

  const approvedRows = useMemo(
    () =>
      [...matriculas]
        .filter((matricula) => normalizeStatus(matricula.status) === "Aprovada")
        .sort((left, right) => {
          const leftCourse = courseById.get(left.cursoId)?.titulo || "";
          const rightCourse = courseById.get(right.cursoId)?.titulo || "";
          const courseComparison = leftCourse.localeCompare(rightCourse, "pt-BR");

          if (courseComparison !== 0) {
            return courseComparison;
          }

          const leftTurma = turmaById.get(left.turmaId)?.nomeTurma || "";
          const rightTurma = turmaById.get(right.turmaId)?.nomeTurma || "";
          return leftTurma.localeCompare(rightTurma, "pt-BR");
        })
        .map((matricula) => {
          const summary = contentSummaryByTurma.get(matricula.turmaId) || null;

          return {
            id: matricula.id,
            curso: courseById.get(matricula.cursoId)?.titulo || `Curso #${matricula.cursoId}`,
            turma: turmaById.get(matricula.turmaId)?.nomeTurma || matricula.turma?.nomeTurma || "Turma em definicao",
            materiais: summary?.total || 0,
            modulos: summary?.modules.size || 0,
            ultimaPublicacao: summary?.latestPublication || null,
            notaFinal: matricula.notaFinal ?? 0
          };
        }),
    [contentSummaryByTurma, courseById, matriculas, turmaById]
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
          rows={approvedRows}
        />
      </PanelCard>
    </div>
  );
}

function StudentContentSection({ conteudos, matriculas }) {
  const approvedMatriculas = useMemo(
    () =>
      [...matriculas]
        .filter((matricula) => normalizeStatus(matricula.status) === "Aprovada")
        .sort((left, right) => {
          const leftCourse = left.curso?.titulo || "";
          const rightCourse = right.curso?.titulo || "";
          const courseComparison = leftCourse.localeCompare(rightCourse, "pt-BR");

          if (courseComparison !== 0) {
            return courseComparison;
          }

          return (left.turma?.nomeTurma || "").localeCompare(right.turma?.nomeTurma || "", "pt-BR");
        }),
    [matriculas]
  );

  const sortedContents = useMemo(
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

        if ((left.ordemExibicao ?? 0) !== (right.ordemExibicao ?? 0)) {
          return (left.ordemExibicao ?? 0) - (right.ordemExibicao ?? 0);
        }

        return (left.titulo || "").localeCompare(right.titulo || "", "pt-BR");
      }),
    [conteudos]
  );

  const contentCountByTurma = useMemo(() => {
    const counts = new Map();

    sortedContents.forEach((conteudo) => {
      counts.set(conteudo.turmaId, (counts.get(conteudo.turmaId) || 0) + 1);
    });

    return counts;
  }, [sortedContents]);

  const latestPublicationByTurma = useMemo(() => {
    const dates = new Map();

    sortedContents.forEach((conteudo) => {
      const currentValue = dates.get(conteudo.turmaId);
      const nextValue = conteudo.publicadoEm || conteudo.atualizadoEm || conteudo.criadoEm;

      if (!currentValue) {
        dates.set(conteudo.turmaId, nextValue);
        return;
      }

      if (new Date(nextValue || 0).getTime() > new Date(currentValue || 0).getTime()) {
        dates.set(conteudo.turmaId, nextValue);
      }
    });

    return dates;
  }, [sortedContents]);

  const studentOverview = useMemo(() => {
    const uniqueTurmas = new Set(sortedContents.map((conteudo) => conteudo.turmaId)).size;
    const uniqueModulos = new Set(sortedContents.map((conteudo) => conteudo.moduloId)).size;
    const textCount = sortedContents.filter((conteudo) => Number(conteudo.tipoConteudo) === 1).length;
    const pdfCount = sortedContents.filter((conteudo) => Number(conteudo.tipoConteudo) === 2).length;
    const richMediaCount = sortedContents.filter((conteudo) => [3, 4].includes(Number(conteudo.tipoConteudo))).length;

    return [
      `${approvedMatriculas.length} matricula(s) ativa(s)`,
      `${uniqueTurmas} turma(s) com material`,
      `${uniqueModulos} modulo(s) liberado(s)`,
      `${textCount} texto(s)`,
      `${pdfCount} pdf(s)`,
      `${richMediaCount} recurso(s)`
    ];
  }, [approvedMatriculas.length, sortedContents]);

  const accessRows = useMemo(
    () =>
      approvedMatriculas.map((matricula) => ({
        id: matricula.id,
        curso: matricula.curso?.titulo || `Curso #${matricula.cursoId}`,
        turma: matricula.turma?.nomeTurma || "Turma em definicao",
        materiais: contentCountByTurma.get(matricula.turmaId) || 0,
        ultimaPublicacao: latestPublicationByTurma.get(matricula.turmaId) || null,
        notaFinal: matricula.notaFinal ?? 0
      })),
    [approvedMatriculas, contentCountByTurma, latestPublicationByTurma]
  );

  return (
    <div className="content-section content-section--student">
      <section className="content-section__intro">
        <div className="content-section__intro-copy">
          <span className="eyebrow">Experiencia do aluno</span>
          <h2>Materiais liberados para a sua jornada</h2>
          <p>Acompanhe o que ja foi publicado para as suas turmas e avance por curso, modulo e formato de estudo.</p>
        </div>
        <div className="content-section__highlights" aria-label="Resumo da trilha do aluno">
          {studentOverview.map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

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
          rows={accessRows}
        />
      </PanelCard>

      <PanelCard
        description="Biblioteca organizada por curso, turma e modulo para facilitar a consulta dos materiais mais recentes."
        title="Biblioteca da sua trilha"
      >
        {sortedContents.length ? (
          <div className="student-content-list">
            {sortedContents.map((conteudo) => {
              const action = getStudentContentAction(conteudo);

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
                        {typeof conteudo.ordemExibicao === "number" ? ` • Ordem ${conteudo.ordemExibicao}` : ""}
                      </p>
                    </div>
                    <StatusPill tone={publicationStatusTone(conteudo.statusPublicacao)}>
                      {normalizePublicationStatus(conteudo.statusPublicacao)}
                    </StatusPill>
                  </div>

                  <p className="student-content-card__summary">{getStudentContentPreview(conteudo)}</p>

                  <div className="student-content-card__footer">
                    <span>
                      {conteudo.publicadoEm
                        ? `Publicado em ${formatDate(conteudo.publicadoEm)}`
                        : `Atualizado em ${formatDate(conteudo.atualizadoEm || conteudo.criadoEm)}`}
                    </span>

                    {action ? (
                      <a className="student-content-card__link" href={action.href} rel="noreferrer" target="_blank">
                        {action.label}
                      </a>
                    ) : (
                      <span className="student-content-card__note">Leitura disponivel no proprio painel.</span>
                    )}
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

function ProfileModal({ courseItems, facts, highlights, isStudent, onClose, role, userInitials, userName }) {
  return (
    <div className="profile-modal" onClick={onClose} role="presentation">
      <div
        aria-labelledby="profile-modal-title"
        aria-modal="true"
        className="profile-modal__card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="profile-modal__hero">
          <span className="profile-modal__avatar" aria-hidden="true">
            {userInitials}
          </span>

          <div className="profile-modal__hero-copy">
            <span className="eyebrow">{isStudent ? "Perfil do aluno" : "Perfil da sessao"}</span>
            <h2 id="profile-modal-title">{userName}</h2>
            <p>
              {isStudent
                ? "Consulte seus dados principais e um resumo rapido da sua jornada academica."
                : `Resumo do seu acesso atual como ${role}.`}
            </p>
          </div>

          <button className="profile-modal__close" onClick={onClose} type="button">
            Fechar
          </button>
        </header>

        <div className="profile-modal__content">
          <section className="profile-modal__section">
            <h3>Dados principais</h3>
            <dl className="profile-modal__facts">
              {facts.map((fact) => (
                <div className="profile-modal__fact" key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="profile-modal__section">
            <h3>{isStudent ? "Resumo academico" : "Resumo atual"}</h3>
            <div className="profile-modal__chips">
              {highlights.map((item) => (
                <span className="chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </section>

          {isStudent ? (
            <section className="profile-modal__section">
              <h3>Cursos com matricula aprovada</h3>
              <MiniList
                emptyMessage="Assim que suas matriculas forem aprovadas, elas aparecerao aqui."
                items={courseItems}
              />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DashboardOverview({ conteudos, cursos, isManager, isProfessor, isStudent, matriculas, pendencias, turmas, usuario }) {
  const professorItems = conteudos.length
    ? [...conteudos]
        .sort((left, right) => {
          const leftDate = new Date(left.atualizadoEm || left.criadoEm || 0).getTime();
          const rightDate = new Date(right.atualizadoEm || right.criadoEm || 0).getTime();
          return rightDate - leftDate;
        })
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          title: item.titulo,
          meta: `${item.turmaNome || "Turma"} - ${item.moduloTitulo || "Modulo"}`,
          badge: normalizePublicationStatus(item.statusPublicacao)
        }))
    : turmas.slice(0, 4).map((item) => ({
        id: item.id,
        title: item.nomeTurma,
        meta: `${formatDate(item.dataCriacao)} - Curso #${item.cursoId}`,
        badge: item.professorId ? "Atribuida" : "Pendente"
      }));

  const studentItems = conteudos.length
    ? [...conteudos]
        .sort((left, right) => {
          const leftDate = new Date(left.publicadoEm || left.atualizadoEm || left.criadoEm || 0).getTime();
          const rightDate = new Date(right.publicadoEm || right.atualizadoEm || right.criadoEm || 0).getTime();
          return rightDate - leftDate;
        })
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          title: item.titulo,
          meta: `${item.turmaNome || "Turma"} - ${item.moduloTitulo || "Modulo"}`,
          badge: normalizeContentType(item.tipoConteudo)
        }))
    : [];

  const primaryItems = isManager
    ? pendencias.slice(0, 4).map((item) => ({
        id: item.id,
        title: item.nomeAluno,
        meta: `${item.curso} - ${formatDate(item.dataSolicitacao)}`,
        badge: item.cpfMascarado || "Sem CPF"
      }))
    : isProfessor
      ? professorItems
      : isStudent && studentItems.length
        ? studentItems
      : matriculas.slice(0, 4).map((item) => ({
          id: item.id,
          title: item.curso,
          meta: `${item.turma} - ${formatDate(item.dataSolicitacao)}`,
          badge: item.status
        }));

  const emptyMessage = isManager
    ? "Nenhuma pendencia aberta agora."
    : isProfessor
      ? "Nenhum conteudo criado ainda."
      : "Voce ainda nao possui matriculas registradas.";

  const description = isManager
    ? "Fila que merece atencao imediata do time academico."
    : isProfessor
      ? conteudos.length
        ? "Materiais mais recentes ligados ao seu workspace de professor."
        : "Turmas vinculadas ao seu usuario dentro do sistema."
      : isStudent && studentItems.length
        ? `Ultimos materiais liberados para a jornada de ${usuario.nome}.`
        : `Resumo rapido das solicitacoes enviadas por ${usuario.nome}.`;

  const title = isManager
    ? "Fila de analise"
    : isProfessor
      ? conteudos.length
        ? "Publicacoes recentes"
        : "Turmas em destaque"
      : isStudent && studentItems.length
        ? "Conteudos recentes"
        : "Minha trilha recente";

  return (
    <section className={`panel-grid${isManager ? "" : " panel-grid--stacked"}`}>
      <PanelCard description={description} title={title}>
        <MiniList emptyMessage={emptyMessage} items={primaryItems} />
      </PanelCard>

      {isManager ? (
        <PanelCard description="Os mesmos cursos alimentam a area publica e o painel autenticado." title="Catalogo visivel no React">
          <div className="course-grid course-grid--compact">
            {cursos.slice(0, 3).map((course) => (
              <article className="course-card course-card--compact" key={course.id}>
                <span className="chip">Curso</span>
                <h3>{course.titulo}</h3>
                <p>{describeCourse(course)}</p>
                <strong>{formatMoney(course.preco)}</strong>
              </article>
            ))}
          </div>
        </PanelCard>
      ) : null}
    </section>
  );
}

function createContentFormState(turmas, modulos, overrides = {}) {
  const firstTurma = turmas[0] || null;
  const modulesForFirstTurma = firstTurma
    ? modulos.filter((modulo) => modulo.cursoId === firstTurma.cursoId)
    : [];

  return {
    turmaId: firstTurma ? String(firstTurma.id) : "",
    moduloId: modulesForFirstTurma[0] ? String(modulesForFirstTurma[0].id) : "",
    titulo: "",
    descricao: "",
    tipoConteudo: CONTENT_TYPE_OPTIONS[0].value,
    corpoTexto: "",
    arquivoUrl: "",
    linkUrl: "",
    statusPublicacao: PUBLICATION_STATUS_OPTIONS[0].value,
    ordemExibicao: "0",
    pesoProgresso: "1",
    ...overrides
  };
}

function getStudentContentPreview(conteudo) {
  const type = Number(conteudo.tipoConteudo);

  if (type === 1) {
    return compactText(conteudo.descricao || conteudo.corpoTexto || "Texto liberado para leitura nesta turma.", 260);
  }

  if (type === 2) {
    return compactText(conteudo.descricao || conteudo.arquivoUrl || "PDF publicado para consulta ou download.", 220);
  }

  return compactText(
    conteudo.descricao || conteudo.linkUrl || conteudo.arquivoUrl || "Recurso externo liberado para complementar o modulo.",
    220
  );
}

function getStudentContentAction(conteudo) {
  const type = Number(conteudo.tipoConteudo);

  if (type === 2 && conteudo.arquivoUrl) {
    return { href: conteudo.arquivoUrl, label: "Abrir PDF" };
  }

  if (type === 3 && conteudo.linkUrl) {
    return { href: conteudo.linkUrl, label: "Abrir video" };
  }

  if (type === 4 && conteudo.linkUrl) {
    return { href: conteudo.linkUrl, label: "Abrir recurso" };
  }

  return null;
}
