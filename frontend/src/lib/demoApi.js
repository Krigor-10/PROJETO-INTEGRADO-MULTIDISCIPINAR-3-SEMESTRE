import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  getDemoAccountByEmail,
  sanitizeDemoUser
} from "./demoMode.js";

const DEMO_DB_KEY = "edtech.demoDb.v1";
const MANAGER_ROLES = new Set(["Admin", "Coordenador"]);

export class DemoApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "DemoApiError";
    this.status = status;
  }
}

export async function demoRequest(endpoint, options = {}) {
  await wait(120);

  const method = String(options.method || "GET").toUpperCase();
  const path = normalizePath(endpoint);
  const payload = parseBody(options.body);

  switch (true) {
    case path === "/Auth/login" && method === "POST":
      return handleLogin(payload);
    case path === "/Cursos" && method === "GET":
      return listCourses();
    case path === "/Cursos/meus" && method === "GET":
      return listTeacherCourses();
    case /^\/Cursos\/\d+\/coordenador$/.test(path) && method === "PUT":
      return assignCourseCoordinator(getCourseCoordinatorActionId(path), payload);
    case path === "/Alunos/cadastro-completo" && method === "POST":
      return registerStudent(payload);
    case path === "/Alunos" && method === "GET":
      return listStudents();
    case path === "/Coordenadores" && method === "GET":
      return listCoordinators();
    case path === "/Professores" && method === "GET":
      return listProfessors();
    case path === "/Turmas" && method === "GET":
      return listClasses();
    case path === "/Turmas" && method === "POST":
      return createClass(payload);
    case path === "/Turmas/minhas" && method === "GET":
      return listTeacherClasses();
    case /^\/Turmas\/\d+\/professor$/.test(path) && method === "PUT":
      return assignClassProfessor(getClassProfessorActionId(path), payload);
    case path === "/Modulos" && method === "GET":
      return listModules();
    case path === "/Modulos/meus" && method === "GET":
      return listTeacherModules();
    case path === "/Modulos" && method === "POST":
      return createModule(payload);
    case /^\/Modulos\/\d+$/.test(path) && method === "PUT":
      return updateModule(getNumericId(path), payload);
    case /^\/Modulos\/\d+$/.test(path) && method === "DELETE":
      return deleteModule(getNumericId(path));
    case path === "/Matriculas" && method === "GET":
      return listEnrollments();
    case path === "/Matriculas/pendentes" && method === "GET":
      return listPendingEnrollments();
    case /^\/Matriculas\/aluno\/\d+$/.test(path) && method === "GET":
      return listStudentEnrollments(getNumericId(path));
    case /^\/Matriculas\/\d+\/aprovar$/.test(path) && method === "PUT":
      return approveEnrollment(getEnrollmentActionId(path), payload);
    case /^\/Matriculas\/\d+\/rejeitar$/.test(path) && method === "PUT":
      return rejectEnrollment(getEnrollmentActionId(path));
    case path === "/ConteudosDidaticos" && method === "GET":
      return listTeacherContents();
    case path === "/ConteudosDidaticos" && method === "POST":
      return createContent(payload);
    case /^\/ConteudosDidaticos\/\d+$/.test(path) && method === "PUT":
      return updateContent(getNumericId(path), payload);
    case /^\/ConteudosDidaticos\/\d+$/.test(path) && method === "DELETE":
      return deleteContent(getNumericId(path));
    case /^\/ConteudosDidaticos\/aluno\/\d+$/.test(path) && method === "GET":
      return listStudentContents(getNumericId(path));
    case /^\/Progressos\/aluno\/\d+$/.test(path) && method === "GET":
      return listStudentProgress(getNumericId(path));
    case /^\/Progressos\/conteudos\/\d+\/concluir$/.test(path) && method === "PUT":
      return completeStudentContent(getProgressContentActionId(path));
    default:
      throw new DemoApiError(`Endpoint demo nao mapeado: ${method} ${path}`, 404);
  }
}

function handleLogin(payload) {
  const email = String(payload.email || "").trim().toLowerCase();
  const senha = String(payload.senha || "");

  if (!email || !senha) {
    throw new DemoApiError("Informe e-mail e senha para entrar.", 400);
  }

  const fixedAccount = getDemoAccountByEmail(email);
  if (fixedAccount && fixedAccount.password === senha) {
    return {
      token: `demo-token-${fixedAccount.user.id}`,
      usuario: sanitizeDemoUser(fixedAccount.user)
    };
  }

  const db = readDemoDb();
  const student = db.alunos.find(
    (item) => item.email.toLowerCase() === email && String(item.senha || "") === senha
  );

  if (!student) {
    throw new DemoApiError("Credenciais demo invalidas.", 401);
  }

  return {
    token: `demo-token-${student.id}`,
    usuario: sanitizeDemoUser(student)
  };
}

function listCourses() {
  const db = readDemoDb();
  return clone(db.cursos).sort((left, right) => left.titulo.localeCompare(right.titulo, "pt-BR"));
}

function listTeacherCourses() {
  const user = requireProfessor();
  const db = readDemoDb();
  const allowedCourseIds = new Set(
    db.turmas.filter((turma) => turma.professorId === user.id).map((turma) => turma.cursoId)
  );

  return clone(db.cursos)
    .filter((curso) => allowedCourseIds.has(curso.id))
    .sort((left, right) => left.titulo.localeCompare(right.titulo, "pt-BR"));
}

function assignCourseCoordinator(courseId, coordinatorIdPayload) {
  requireAdmin();

  const coordenadorId = Number(coordinatorIdPayload);
  if (!Number.isInteger(coordenadorId) || coordenadorId < 0) {
    throw new DemoApiError("Selecione um coordenador demo valido.", 400);
  }

  const db = readDemoDb();
  ensureCoordinatorCollection(db);

  const curso = db.cursos.find((item) => item.id === courseId);
  if (!curso) {
    throw new DemoApiError("Curso demo nao encontrado.", 404);
  }

  if (coordenadorId === 0) {
    curso.coordenadorId = null;
    saveDemoDb(db);
    return { mensagem: "Curso demo marcado como aguardando coordenador." };
  }

  const coordenador = db.coordenadores.find((item) => item.id === coordenadorId);
  if (!coordenador) {
    throw new DemoApiError("Coordenador demo nao encontrado.", 404);
  }

  curso.coordenadorId = coordenador.id;
  saveDemoDb(db);
  return { mensagem: "Coordenador demo atribuido ao curso com sucesso." };
}

function registerStudent(payload) {
  const requiredFields = [
    "nome",
    "email",
    "cpf",
    "telefone",
    "cep",
    "rua",
    "numero",
    "bairro",
    "cidade",
    "estado",
    "cursoId",
    "senha"
  ];

  const missingField = requiredFields.find((field) => !String(payload[field] || "").trim());
  if (missingField) {
    throw new DemoApiError("Preencha todos os campos para simular o cadastro.", 400);
  }

  const db = readDemoDb();
  const normalizedEmail = String(payload.email || "").trim().toLowerCase();
  const normalizedCpf = onlyDigits(payload.cpf);

  const emailAlreadyUsed =
    DEMO_ACCOUNTS.some((account) => account.email.toLowerCase() === normalizedEmail) ||
    db.alunos.some((aluno) => aluno.email.toLowerCase() === normalizedEmail);
  if (emailAlreadyUsed) {
    throw new DemoApiError("Ja existe um usuario demo com esse e-mail.", 409);
  }

  if (db.alunos.some((aluno) => onlyDigits(aluno.cpf) === normalizedCpf)) {
    throw new DemoApiError("Ja existe um usuario demo com esse CPF.", 409);
  }

  const now = new Date().toISOString();
  const alunoId = nextId(db.alunos);
  const matriculaId = nextId(db.matriculas);
  const cursoId = Number(payload.cursoId);

  db.alunos.push({
    id: alunoId,
    nome: String(payload.nome || "").trim(),
    email: normalizedEmail,
    cpf: normalizedCpf,
    telefone: String(payload.telefone || "").trim(),
    cep: String(payload.cep || "").trim(),
    rua: String(payload.rua || "").trim(),
    numero: String(payload.numero || "").trim(),
    bairro: String(payload.bairro || "").trim(),
    cidade: String(payload.cidade || "").trim(),
    estado: String(payload.estado || "").trim().toUpperCase(),
    tipoUsuario: "Aluno",
    ativo: true,
    senha: String(payload.senha || "")
  });

  db.matriculas.push({
    id: matriculaId,
    alunoId,
    cursoId,
    turmaId: null,
    status: 0,
    notaFinal: 0,
    dataSolicitacao: now
  });

  saveDemoDb(db);

  return {
    mensagem: "Cadastro demo enviado com sucesso. Use o mesmo e-mail para entrar na apresentacao."
  };
}

function listStudents() {
  requireManager();
  const db = readDemoDb();
  return clone(db.alunos)
    .map((aluno) => sanitizeDemoUser(aluno))
    .sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));
}

function listCoordinators() {
  requireAdmin();
  const db = readDemoDb();
  ensureCoordinatorCollection(db);
  return clone(db.coordenadores).sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));
}

function listProfessors() {
  requireManager();
  const db = readDemoDb();
  return clone(db.professores).sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));
}

function listClasses() {
  requireAuthenticatedUser();
  const db = readDemoDb();
  return clone(db.turmas).sort((left, right) => left.nomeTurma.localeCompare(right.nomeTurma, "pt-BR"));
}

function listTeacherClasses() {
  const user = requireProfessor();
  const db = readDemoDb();
  return clone(db.turmas)
    .filter((turma) => turma.professorId === user.id)
    .sort((left, right) => left.nomeTurma.localeCompare(right.nomeTurma, "pt-BR"));
}

function createClass(payload) {
  requireManager();

  const nomeTurma = String(payload.nomeTurma || "").trim();
  const cursoId = Number(payload.cursoId);
  const professorId = Number(payload.professorId);

  if (!nomeTurma) {
    throw new DemoApiError("Informe um nome para criar a turma.", 400);
  }

  if (!cursoId) {
    throw new DemoApiError("Selecione um curso demo para criar a turma.", 400);
  }

  if (!professorId) {
    throw new DemoApiError("Selecione um professor demo para criar a turma.", 400);
  }

  const db = readDemoDb();
  const curso = db.cursos.find((item) => item.id === cursoId);
  if (!curso) {
    throw new DemoApiError("Curso demo nao encontrado.", 404);
  }

  const professor = db.professores.find((item) => item.id === professorId);
  if (!professor) {
    throw new DemoApiError("Professor demo nao encontrado.", 404);
  }

  const turmaDuplicada = db.turmas.some(
    (item) => item.cursoId === cursoId && String(item.nomeTurma || "").trim().toLowerCase() === nomeTurma.toLowerCase()
  );
  if (turmaDuplicada) {
    throw new DemoApiError(`Ja existe uma turma demo chamada "${nomeTurma}" para esse curso.`, 409);
  }

  const turma = {
    id: nextId(db.turmas),
    nomeTurma,
    cursoId,
    professorId,
    dataCriacao: new Date().toISOString()
  };

  db.turmas.push(turma);
  saveDemoDb(db);
  return clone(turma);
}

function assignClassProfessor(classId, professorIdPayload) {
  requireManager();

  const professorId = Number(professorIdPayload);
  if (!Number.isInteger(professorId) || professorId <= 0) {
    throw new DemoApiError("Selecione um professor demo valido.", 400);
  }

  const db = readDemoDb();
  const turma = db.turmas.find((item) => item.id === classId);
  if (!turma) {
    throw new DemoApiError("Turma demo nao encontrada.", 404);
  }

  const professor = db.professores.find((item) => item.id === professorId);
  if (!professor) {
    throw new DemoApiError("Professor demo nao encontrado.", 404);
  }

  turma.professorId = professor.id;
  saveDemoDb(db);
  return { mensagem: "Professor demo atribuido a turma com sucesso." };
}

function listModules() {
  requireManager();
  const db = readDemoDb();
  return clone(db.modulos).sort((left, right) => left.titulo.localeCompare(right.titulo, "pt-BR"));
}

function listTeacherModules() {
  const user = requireProfessor();
  const db = readDemoDb();
  const teacherCourseIds = new Set(
    db.turmas.filter((turma) => turma.professorId === user.id).map((turma) => turma.cursoId)
  );

  return clone(db.modulos)
    .filter((modulo) => teacherCourseIds.has(modulo.cursoId))
    .sort((left, right) => left.titulo.localeCompare(right.titulo, "pt-BR"));
}

function createModule(payload) {
  requireManager();

  const titulo = String(payload.titulo || "").trim();
  const cursoId = Number(payload.cursoId);

  if (!titulo) {
    throw new DemoApiError("Informe um titulo para criar o modulo.", 400);
  }

  if (!cursoId) {
    throw new DemoApiError("Selecione um curso demo para criar o modulo.", 400);
  }

  const db = readDemoDb();
  const courseExists = db.cursos.some((curso) => curso.id === cursoId);
  if (!courseExists) {
    throw new DemoApiError("Curso demo nao encontrado.", 404);
  }

  const modulo = {
    id: nextId(db.modulos),
    cursoId,
    titulo
  };

  db.modulos.push(modulo);
  saveDemoDb(db);
  return clone(modulo);
}

function updateModule(moduleId, payload) {
  requireManager();

  const titulo = String(payload.titulo || "").trim();
  if (!titulo) {
    throw new DemoApiError("Informe um titulo valido para o modulo.", 400);
  }

  const db = readDemoDb();
  const modulo = db.modulos.find((item) => item.id === moduleId);
  if (!modulo) {
    throw new DemoApiError("Modulo demo nao encontrado.", 404);
  }

  modulo.titulo = titulo;
  saveDemoDb(db);
  return clone(modulo);
}

function deleteModule(moduleId) {
  requireManager();

  const db = readDemoDb();
  const moduloIndex = db.modulos.findIndex((item) => item.id === moduleId);
  if (moduloIndex === -1) {
    throw new DemoApiError("Modulo demo nao encontrado.", 404);
  }

  db.modulos.splice(moduloIndex, 1);
  db.conteudos = db.conteudos.filter((conteudo) => conteudo.moduloId !== moduleId);
  saveDemoDb(db);
  return { mensagem: "Modulo demo removido." };
}

function listEnrollments() {
  requireManager();
  const db = readDemoDb();
  return hydrateEnrollments(db, db.matriculas);
}

function listPendingEnrollments() {
  requireManager();
  const db = readDemoDb();
  return buildPendingEnrollments(db);
}

function listStudentEnrollments(studentId) {
  const user = requireAuthenticatedUser();

  if (!MANAGER_ROLES.has(user.tipoUsuario) && user.id !== studentId) {
    throw new DemoApiError("Voce nao pode visualizar matriculas demo de outro usuario.", 403);
  }

  const db = readDemoDb();
  return hydrateEnrollments(
    db,
    db.matriculas.filter((matricula) => matricula.alunoId === studentId)
  );
}

function approveEnrollment(enrollmentId, turmaIdPayload) {
  requireManager();

  const turmaId = Number(turmaIdPayload);
  if (!Number.isInteger(turmaId) || turmaId <= 0) {
    throw new DemoApiError("Selecione uma turma demo valida para aprovar a matricula.", 400);
  }

  const db = readDemoDb();
  const matricula = db.matriculas.find((item) => item.id === enrollmentId);
  if (!matricula) {
    throw new DemoApiError("Matricula demo nao encontrada.", 404);
  }

  const turma = db.turmas.find((item) => item.id === turmaId);
  if (!turma) {
    throw new DemoApiError("Turma demo nao encontrada.", 404);
  }

  if (matricula.cursoId !== turma.cursoId) {
    throw new DemoApiError("A turma demo selecionada nao pertence ao curso solicitado pelo aluno.", 422);
  }

  const aluno = db.alunos.find((item) => item.id === matricula.alunoId);

  matricula.turmaId = turma.id;
  matricula.status = 1;
  if (aluno) {
    aluno.turmaAtual = turma.nomeTurma;
  }

  saveDemoDb(db);
  return { mensagem: "Matricula demo aprovada com sucesso." };
}

function rejectEnrollment(enrollmentId) {
  requireManager();

  const db = readDemoDb();
  const matricula = db.matriculas.find((item) => item.id === enrollmentId);
  if (!matricula) {
    throw new DemoApiError("Matricula demo nao encontrada.", 404);
  }

  matricula.status = 2;
  saveDemoDb(db);
  return { mensagem: "Matricula demo rejeitada com sucesso." };
}

function listTeacherContents() {
  const user = requireProfessor();
  const db = readDemoDb();
  const teacherTurmaIds = new Set(
    db.turmas.filter((turma) => turma.professorId === user.id).map((turma) => turma.id)
  );

  return hydrateContents(
    db,
    db.conteudos.filter((conteudo) => teacherTurmaIds.has(conteudo.turmaId))
  );
}

function listStudentContents(studentId) {
  const user = requireAuthenticatedUser();

  if (!MANAGER_ROLES.has(user.tipoUsuario) && user.id !== studentId) {
    throw new DemoApiError("Voce nao pode visualizar conteudos demo de outro usuario.", 403);
  }

  const db = readDemoDb();
  const approvedTurmaIds = new Set(
    db.matriculas
      .filter((matricula) => matricula.alunoId === studentId && Number(matricula.status) === 1 && matricula.turmaId)
      .map((matricula) => matricula.turmaId)
  );

  return hydrateContents(
    db,
    db.conteudos.filter(
      (conteudo) => approvedTurmaIds.has(conteudo.turmaId) && Number(conteudo.statusPublicacao) === 2
    )
  );
}

function listStudentProgress(studentId) {
  const user = requireAuthenticatedUser();

  if (!MANAGER_ROLES.has(user.tipoUsuario) && user.id !== studentId) {
    throw new DemoApiError("Voce nao pode visualizar progresso demo de outro usuario.", 403);
  }

  const db = readDemoDb();
  ensureProgressCollections(db);
  return buildStudentProgressSnapshot(db, studentId);
}

function completeStudentContent(contentId) {
  const user = requireAuthenticatedUser();

  if (user.tipoUsuario !== "Aluno") {
    throw new DemoApiError("Este recurso demo exige perfil de aluno.", 403);
  }

  const db = readDemoDb();
  ensureProgressCollections(db);

  const conteudo = db.conteudos.find(
    (item) => item.id === contentId && Number(item.statusPublicacao) === 2
  );
  if (!conteudo) {
    throw new DemoApiError("Conteudo demo publicado nao encontrado.", 404);
  }

  const matricula = db.matriculas.find(
    (item) =>
      item.alunoId === user.id &&
      Number(item.status) === 1 &&
      item.turmaId &&
      item.turmaId === conteudo.turmaId
  );
  if (!matricula) {
    throw new DemoApiError("Este conteudo demo nao esta liberado para a matricula do aluno.", 422);
  }

  const now = new Date().toISOString();
  let progresso = db.progressos.conteudos.find(
    (item) => item.matriculaId === matricula.id && item.conteudoDidaticoId === conteudo.id
  );

  if (!progresso) {
    progresso = {
      id: nextId(db.progressos.conteudos),
      matriculaId: matricula.id,
      conteudoDidaticoId: conteudo.id,
      moduloId: conteudo.moduloId,
      statusProgresso: 1,
      percentualConclusao: 0,
      primeiroAcessoEm: now,
      ultimoAcessoEm: null,
      concluidoEm: null
    };
    db.progressos.conteudos.push(progresso);
  }

  progresso.moduloId = conteudo.moduloId;
  progresso.statusProgresso = 3;
  progresso.percentualConclusao = 100;
  progresso.primeiroAcessoEm ||= now;
  progresso.ultimoAcessoEm = now;
  progresso.concluidoEm = now;

  recalculateDemoModuleProgress(db, matricula, conteudo.moduloId, now);
  recalculateDemoCourseProgress(db, matricula, now);
  saveDemoDb(db);

  return buildStudentProgressSnapshot(db, user.id);
}

function createContent(payload) {
  const user = requireProfessor();
  const db = readDemoDb();
  validateContentPayload(db, user, payload);

  const now = new Date().toISOString();
  const conteudo = {
    id: nextId(db.conteudos),
    titulo: String(payload.titulo || "").trim(),
    descricao: String(payload.descricao || "").trim(),
    tipoConteudo: Number(payload.tipoConteudo),
    corpoTexto: String(payload.corpoTexto || "").trim(),
    arquivoUrl: String(payload.arquivoUrl || "").trim(),
    linkUrl: String(payload.linkUrl || "").trim(),
    turmaId: Number(payload.turmaId),
    moduloId: Number(payload.moduloId),
    statusPublicacao: Number(payload.statusPublicacao),
    ordemExibicao: Number(payload.ordemExibicao),
    pesoProgresso: Number(payload.pesoProgresso),
    criadoEm: now,
    atualizadoEm: now,
    publicadoEm: Number(payload.statusPublicacao) === 2 ? now : null
  };

  db.conteudos.push(conteudo);
  saveDemoDb(db);
  return hydrateContent(db, conteudo);
}

function updateContent(contentId, payload) {
  const user = requireProfessor();
  const db = readDemoDb();
  validateContentPayload(db, user, payload);

  const conteudo = db.conteudos.find((item) => item.id === contentId);
  if (!conteudo) {
    throw new DemoApiError("Conteudo demo nao encontrado.", 404);
  }

  ensureTeacherOwnsTurma(db, user, Number(payload.turmaId));

  const now = new Date().toISOString();
  const nextStatus = Number(payload.statusPublicacao);
  const wasPublished = Number(conteudo.statusPublicacao) === 2;

  conteudo.titulo = String(payload.titulo || "").trim();
  conteudo.descricao = String(payload.descricao || "").trim();
  conteudo.tipoConteudo = Number(payload.tipoConteudo);
  conteudo.corpoTexto = String(payload.corpoTexto || "").trim();
  conteudo.arquivoUrl = String(payload.arquivoUrl || "").trim();
  conteudo.linkUrl = String(payload.linkUrl || "").trim();
  conteudo.turmaId = Number(payload.turmaId);
  conteudo.moduloId = Number(payload.moduloId);
  conteudo.statusPublicacao = nextStatus;
  conteudo.ordemExibicao = Number(payload.ordemExibicao);
  conteudo.pesoProgresso = Number(payload.pesoProgresso);
  conteudo.atualizadoEm = now;
  conteudo.publicadoEm = nextStatus === 2 ? (wasPublished ? conteudo.publicadoEm || now : now) : null;

  saveDemoDb(db);
  return hydrateContent(db, conteudo);
}

function deleteContent(contentId) {
  const user = requireProfessor();
  const db = readDemoDb();
  const conteudo = db.conteudos.find((item) => item.id === contentId);

  if (!conteudo) {
    throw new DemoApiError("Conteudo demo nao encontrado.", 404);
  }

  ensureTeacherOwnsTurma(db, user, conteudo.turmaId);
  db.conteudos = db.conteudos.filter((item) => item.id !== contentId);
  saveDemoDb(db);
  return { mensagem: "Conteudo demo removido." };
}

function validateContentPayload(db, user, payload) {
  const titulo = String(payload.titulo || "").trim();
  const turmaId = Number(payload.turmaId);
  const moduloId = Number(payload.moduloId);
  const tipoConteudo = Number(payload.tipoConteudo);
  const statusPublicacao = Number(payload.statusPublicacao);
  const ordemExibicao = Number(payload.ordemExibicao);
  const pesoProgresso = Number(payload.pesoProgresso);

  if (!titulo) {
    throw new DemoApiError("Informe um titulo para o conteudo demo.", 400);
  }

  if (!turmaId) {
    throw new DemoApiError("Selecione uma turma demo.", 400);
  }

  if (!moduloId) {
    throw new DemoApiError("Selecione um modulo demo.", 400);
  }

  if (![1, 2, 3, 4].includes(tipoConteudo)) {
    throw new DemoApiError("Tipo de conteudo demo invalido.", 400);
  }

  if (![1, 2, 3].includes(statusPublicacao)) {
    throw new DemoApiError("Status de publicacao demo invalido.", 400);
  }

  if (!Number.isInteger(ordemExibicao) || ordemExibicao < 0) {
    throw new DemoApiError("Use uma ordem valida para o conteudo demo.", 400);
  }

  if (!Number.isFinite(pesoProgresso) || pesoProgresso <= 0) {
    throw new DemoApiError("Use um peso de progresso maior que zero.", 400);
  }

  ensureTeacherOwnsTurma(db, user, turmaId);

  const modulo = db.modulos.find((item) => item.id === moduloId);
  if (!modulo) {
    throw new DemoApiError("Modulo demo nao encontrado.", 404);
  }

  const turma = db.turmas.find((item) => item.id === turmaId);
  if (!turma) {
    throw new DemoApiError("Turma demo nao encontrada.", 404);
  }

  if (modulo.cursoId !== turma.cursoId) {
    throw new DemoApiError("O modulo demo precisa pertencer ao curso da turma.", 400);
  }
}

function hydrateEnrollments(db, rows) {
  const alunoById = new Map(db.alunos.map((aluno) => [aluno.id, aluno]));
  const cursoById = new Map(db.cursos.map((curso) => [curso.id, curso]));
  const turmaById = new Map(db.turmas.map((turma) => [turma.id, turma]));

  return clone(rows)
    .map((matricula) => ({
      ...matricula,
      aluno: sanitizeDemoUser(alunoById.get(matricula.alunoId)) || null,
      curso: cursoById.get(matricula.cursoId) || null,
      turma: matricula.turmaId ? turmaById.get(matricula.turmaId) || null : null
    }))
    .sort((left, right) => new Date(right.dataSolicitacao || 0).getTime() - new Date(left.dataSolicitacao || 0).getTime());
}

function buildPendingEnrollments(db) {
  const alunoById = new Map(db.alunos.map((aluno) => [aluno.id, aluno]));
  const turmaById = new Map(db.turmas.map((turma) => [turma.id, turma]));

  return db.matriculas
    .filter((matricula) => Number(matricula.status) === 0)
    .map((matricula) => {
      const aluno = alunoById.get(matricula.alunoId);
      const turma = matricula.turmaId ? turmaById.get(matricula.turmaId) : null;

      return {
        id: matricula.id,
        nomeAluno: aluno?.nome || `Aluno #${matricula.alunoId}`,
        cursoId: matricula.cursoId,
        cpfMascarado: maskCpf(aluno?.cpf || ""),
        nomeTurma: turma?.nomeTurma || null,
        dataSolicitacao: matricula.dataSolicitacao
      };
    })
    .sort((left, right) => new Date(right.dataSolicitacao || 0).getTime() - new Date(left.dataSolicitacao || 0).getTime());
}

function hydrateContents(db, rows) {
  return clone(rows)
    .map((conteudo) => hydrateContent(db, conteudo))
    .sort((left, right) => {
      const leftDate = new Date(left.publicadoEm || left.atualizadoEm || left.criadoEm || 0).getTime();
      const rightDate = new Date(right.publicadoEm || right.atualizadoEm || right.criadoEm || 0).getTime();
      return rightDate - leftDate;
    });
}

function hydrateContent(db, conteudo) {
  const turma = db.turmas.find((item) => item.id === conteudo.turmaId) || null;
  const modulo = db.modulos.find((item) => item.id === conteudo.moduloId) || null;
  const cursoId = turma?.cursoId || modulo?.cursoId || null;
  const curso = db.cursos.find((item) => item.id === cursoId) || null;

  return {
    ...clone(conteudo),
    cursoId,
    cursoTitulo: curso?.titulo || "",
    turmaNome: turma?.nomeTurma || "",
    moduloTitulo: modulo?.titulo || ""
  };
}

function buildStudentProgressSnapshot(db, studentId) {
  ensureProgressCollections(db);

  const enrollmentIds = new Set(
    db.matriculas
      .filter((matricula) => matricula.alunoId === studentId && Number(matricula.status) === 1)
      .map((matricula) => matricula.id)
  );

  return clone({
    conteudos: db.progressos.conteudos.filter((progresso) => enrollmentIds.has(progresso.matriculaId)),
    modulos: db.progressos.modulos.filter((progresso) => enrollmentIds.has(progresso.matriculaId)),
    cursos: db.progressos.cursos.filter((progresso) => enrollmentIds.has(progresso.matriculaId))
  });
}

function recalculateDemoModuleProgress(db, matricula, moduloId, now) {
  const conteudosModulo = db.conteudos.filter(
    (conteudo) =>
      Number(conteudo.statusPublicacao) === 2 &&
      conteudo.turmaId === matricula.turmaId &&
      conteudo.moduloId === moduloId
  );
  const contentIds = new Set(conteudosModulo.map((conteudo) => conteudo.id));
  const completedIds = new Set(
    db.progressos.conteudos
      .filter(
        (progresso) =>
          progresso.matriculaId === matricula.id &&
          contentIds.has(progresso.conteudoDidaticoId) &&
          Number(progresso.statusProgresso) === 3
      )
      .map((progresso) => progresso.conteudoDidaticoId)
  );
  const pesoTotal = sumDemoWeights(conteudosModulo);
  const pesoConcluido = sumDemoWeights(conteudosModulo.filter((conteudo) => completedIds.has(conteudo.id)));
  const percentualConclusao = calculateDemoPercent(pesoConcluido, pesoTotal);

  let progressoModulo = db.progressos.modulos.find(
    (progresso) => progresso.matriculaId === matricula.id && progresso.moduloId === moduloId
  );

  if (!progressoModulo) {
    progressoModulo = {
      id: nextId(db.progressos.modulos),
      matriculaId: matricula.id,
      moduloId,
      statusProgresso: 1,
      percentualConclusao: 0,
      pesoConcluido: 0,
      pesoTotal: 0,
      conteudosConcluidos: 0,
      totalConteudos: 0,
      avaliacoesConcluidas: 0,
      totalAvaliacoes: 0,
      mediaModulo: 0,
      atualizadoEm: now
    };
    db.progressos.modulos.push(progressoModulo);
  }

  progressoModulo.statusProgresso = resolveDemoProgressStatus(percentualConclusao);
  progressoModulo.percentualConclusao = percentualConclusao;
  progressoModulo.pesoConcluido = pesoConcluido;
  progressoModulo.pesoTotal = pesoTotal;
  progressoModulo.conteudosConcluidos = completedIds.size;
  progressoModulo.totalConteudos = conteudosModulo.length;
  progressoModulo.atualizadoEm = now;
}

function recalculateDemoCourseProgress(db, matricula, now) {
  const moduleById = new Map(db.modulos.map((modulo) => [modulo.id, modulo]));
  const conteudosCurso = db.conteudos.filter((conteudo) => {
    const modulo = moduleById.get(conteudo.moduloId);
    return (
      Number(conteudo.statusPublicacao) === 2 &&
      conteudo.turmaId === matricula.turmaId &&
      modulo?.cursoId === matricula.cursoId
    );
  });
  const contentIds = new Set(conteudosCurso.map((conteudo) => conteudo.id));
  const completedIds = new Set(
    db.progressos.conteudos
      .filter(
        (progresso) =>
          progresso.matriculaId === matricula.id &&
          contentIds.has(progresso.conteudoDidaticoId) &&
          Number(progresso.statusProgresso) === 3
      )
      .map((progresso) => progresso.conteudoDidaticoId)
  );
  const moduleGroups = new Map();

  conteudosCurso.forEach((conteudo) => {
    const current = moduleGroups.get(conteudo.moduloId) || [];
    current.push(conteudo);
    moduleGroups.set(conteudo.moduloId, current);
  });

  const modulosConcluidos = [...moduleGroups.values()].filter((conteudosModulo) =>
    conteudosModulo.every((conteudo) => completedIds.has(conteudo.id))
  ).length;
  const pesoTotal = sumDemoWeights(conteudosCurso);
  const pesoConcluido = sumDemoWeights(conteudosCurso.filter((conteudo) => completedIds.has(conteudo.id)));
  const percentualConclusao = calculateDemoPercent(pesoConcluido, pesoTotal);

  let progressoCurso = db.progressos.cursos.find(
    (progresso) => progresso.matriculaId === matricula.id && progresso.cursoId === matricula.cursoId
  );

  if (!progressoCurso) {
    progressoCurso = {
      id: nextId(db.progressos.cursos),
      matriculaId: matricula.id,
      cursoId: matricula.cursoId,
      statusProgresso: 1,
      percentualConclusao: 0,
      pesoConcluido: 0,
      pesoTotal: 0,
      modulosConcluidos: 0,
      totalModulos: 0,
      mediaCurso: 0,
      atualizadoEm: now
    };
    db.progressos.cursos.push(progressoCurso);
  }

  progressoCurso.statusProgresso = resolveDemoProgressStatus(percentualConclusao);
  progressoCurso.percentualConclusao = percentualConclusao;
  progressoCurso.pesoConcluido = pesoConcluido;
  progressoCurso.pesoTotal = pesoTotal;
  progressoCurso.modulosConcluidos = modulosConcluidos;
  progressoCurso.totalModulos = moduleGroups.size;
  progressoCurso.atualizadoEm = now;
}

function ensureProgressCollections(db) {
  db.progressos ||= {};
  db.progressos.conteudos ||= [];
  db.progressos.modulos ||= [];
  db.progressos.cursos ||= [];
}

function ensureCoordinatorCollection(db) {
  db.coordenadores ||= [
    {
      id: 901,
      nome: "Clara Campos",
      email: "coordenacao@demo.edtech",
      cpf: "38765432100",
      telefone: "(11) 98888-4400",
      cep: "01310-000",
      rua: "Avenida Paulista",
      numero: "1500",
      bairro: "Bela Vista",
      cidade: "Sao Paulo",
      estado: "SP",
      tipoUsuario: "Coordenador",
      ativo: true,
      cursoResponsavel: "Trilhas EdTech"
    },
    {
      id: 902,
      nome: "Helena Rocha",
      email: "helena@coord.demo",
      cpf: "21987654300",
      telefone: "(21) 98888-5500",
      cep: "20031-170",
      rua: "Rua Primeiro de Marco",
      numero: "90",
      bairro: "Centro",
      cidade: "Rio de Janeiro",
      estado: "RJ",
      tipoUsuario: "Coordenador",
      ativo: true,
      cursoResponsavel: "Dados e Produto"
    }
  ];
}

function sumDemoWeights(conteudos) {
  return roundDemoNumber(
    conteudos.reduce((total, conteudo) => total + Math.max(Number(conteudo.pesoProgresso || 0), 0), 0)
  );
}

function calculateDemoPercent(pesoConcluido, pesoTotal) {
  if (pesoTotal <= 0) {
    return 0;
  }

  return roundDemoNumber(Math.min((pesoConcluido / pesoTotal) * 100, 100));
}

function resolveDemoProgressStatus(percentualConclusao) {
  if (percentualConclusao >= 100) {
    return 3;
  }

  return percentualConclusao > 0 ? 2 : 1;
}

function roundDemoNumber(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function ensureTeacherOwnsTurma(db, user, turmaId) {
  const turma = db.turmas.find((item) => item.id === turmaId);

  if (!turma) {
    throw new DemoApiError("Turma demo nao encontrada.", 404);
  }

  if (turma.professorId !== user.id) {
    throw new DemoApiError("Esta turma demo nao pertence ao professor autenticado.", 403);
  }

  return turma;
}

function requireAuthenticatedUser() {
  const user = readCurrentUser();

  if (!user?.id) {
    throw new DemoApiError("Sua sessao demo expirou. Entre novamente.", 401);
  }

  return user;
}

function requireManager() {
  const user = requireAuthenticatedUser();

  if (!MANAGER_ROLES.has(user.tipoUsuario)) {
    throw new DemoApiError("Este recurso demo exige perfil de coordenacao.", 403);
  }

  return user;
}

function requireAdmin() {
  const user = requireAuthenticatedUser();

  if (user.tipoUsuario !== "Admin") {
    throw new DemoApiError("Este recurso demo exige perfil de administracao.", 403);
  }

  return user;
}

function requireProfessor() {
  const user = requireAuthenticatedUser();

  if (user.tipoUsuario !== "Professor") {
    throw new DemoApiError("Este recurso demo exige perfil de professor.", 403);
  }

  return user;
}

function readCurrentUser() {
  try {
    const rawUser = window.localStorage.getItem("usuarioLogado");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function readDemoDb() {
  try {
    const stored = window.localStorage.getItem(DEMO_DB_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      if (isValidDemoDb(parsed)) {
        ensureProgressCollections(parsed);
        ensureCoordinatorCollection(parsed);
        saveDemoDb(parsed);
        return parsed;
      }
    }
  } catch {
    // Ignora dados corrompidos e recria a base demo abaixo.
  }

  const initialDb = createInitialDemoDb();
  saveDemoDb(initialDb);
  return initialDb;
}

function saveDemoDb(db) {
  window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
}

function isValidDemoDb(db) {
  return Boolean(
    db &&
      Array.isArray(db.cursos) &&
      Array.isArray(db.modulos) &&
      Array.isArray(db.alunos) &&
      (db.coordenadores === undefined || Array.isArray(db.coordenadores)) &&
      Array.isArray(db.professores) &&
      Array.isArray(db.turmas) &&
      Array.isArray(db.matriculas) &&
      Array.isArray(db.conteudos)
  );
}

function createInitialDemoDb() {
  return {
    cursos: [
      {
        id: 1,
        titulo: "Programacao Aplicada",
        descricao: "Projetos guiados com fundamentos de logica, API e entrega incremental.",
        preco: 189.9,
        coordenadorId: 901
      },
      {
        id: 2,
        titulo: "Banco de Dados",
        descricao: "Modelagem relacional, SQL e leitura de cenarios orientados a produto.",
        preco: 169.9,
        coordenadorId: 901
      },
      {
        id: 3,
        titulo: "Analise de Dados",
        descricao: "Metricas, dashboards e interpretacao de indicadores com foco academico.",
        preco: 209.9,
        coordenadorId: 901
      }
    ],
    modulos: [
      { id: 11, cursoId: 1, titulo: "Fundamentos de logica" },
      { id: 12, cursoId: 1, titulo: "Projeto web inicial" },
      { id: 21, cursoId: 2, titulo: "Modelagem relacional" },
      { id: 22, cursoId: 2, titulo: "Consultas SQL" },
      { id: 31, cursoId: 3, titulo: "Leitura de indicadores" },
      { id: 32, cursoId: 3, titulo: "Storytelling com dados" }
    ],
    alunos: [
      {
        id: 101,
        nome: "Lucas Martins",
        email: "aluno@demo.edtech",
        cpf: "12345678901",
        telefone: "(11) 99888-7766",
        cep: "01310-000",
        rua: "Avenida Paulista",
        numero: "1200",
        bairro: "Bela Vista",
        cidade: "Sao Paulo",
        estado: "SP",
        tipoUsuario: "Aluno",
        ativo: true,
        senha: DEMO_PASSWORD
      },
      {
        id: 102,
        nome: "Bianca Pereira",
        email: "bianca@alunos.demo",
        cpf: "98765432100",
        telefone: "(21) 99777-6611",
        cep: "20031-170",
        rua: "Rua Primeiro de Marco",
        numero: "45",
        bairro: "Centro",
        cidade: "Rio de Janeiro",
        estado: "RJ",
        tipoUsuario: "Aluno",
        ativo: true,
        senha: "senha-bianca"
      },
      {
        id: 103,
        nome: "Caio Nogueira",
        email: "caio@alunos.demo",
        cpf: "45612378900",
        telefone: "(31) 99655-4400",
        cep: "30130-010",
        rua: "Rua da Bahia",
        numero: "310",
        bairro: "Centro",
        cidade: "Belo Horizonte",
        estado: "MG",
        tipoUsuario: "Aluno",
        ativo: true,
        senha: "senha-caio"
      }
    ],
    coordenadores: [
      {
        id: 901,
        nome: "Clara Campos",
        email: "coordenacao@demo.edtech",
        cpf: "38765432100",
        telefone: "(11) 98888-4400",
        cep: "01310-000",
        rua: "Avenida Paulista",
        numero: "1500",
        bairro: "Bela Vista",
        cidade: "Sao Paulo",
        estado: "SP",
        tipoUsuario: "Coordenador",
        ativo: true,
        cursoResponsavel: "Trilhas EdTech"
      },
      {
        id: 902,
        nome: "Helena Rocha",
        email: "helena@coord.demo",
        cpf: "21987654300",
        telefone: "(21) 98888-5500",
        cep: "20031-170",
        rua: "Rua Primeiro de Marco",
        numero: "90",
        bairro: "Centro",
        cidade: "Rio de Janeiro",
        estado: "RJ",
        tipoUsuario: "Coordenador",
        ativo: true,
        cursoResponsavel: "Dados e Produto"
      }
    ],
    professores: [
      {
        id: 301,
        nome: "Renata Vieira",
        email: "professor@demo.edtech",
        especialidade: "Arquitetura .NET e jornadas de conteudo",
        cpf: "42156789012"
      },
      {
        id: 302,
        nome: "Marcio Lima",
        email: "marcio@prof.demo",
        especialidade: "SQL aplicado e modelagem de dados",
        cpf: "65498732100"
      }
    ],
    turmas: [
      {
        id: 401,
        nomeTurma: "Programacao Aplicada - Turma A",
        cursoId: 1,
        professorId: 301,
        dataCriacao: "2026-03-04T10:00:00.000Z"
      },
      {
        id: 402,
        nomeTurma: "Banco de Dados - Turma A",
        cursoId: 2,
        professorId: 302,
        dataCriacao: "2026-03-06T11:00:00.000Z"
      },
      {
        id: 403,
        nomeTurma: "Analise de Dados - Turma Noturna",
        cursoId: 3,
        professorId: 301,
        dataCriacao: "2026-03-10T19:00:00.000Z"
      }
    ],
    matriculas: [
      {
        id: 501,
        alunoId: 101,
        cursoId: 1,
        turmaId: 401,
        status: 1,
        notaFinal: 8.7,
        dataSolicitacao: "2026-03-08T13:20:00.000Z"
      },
      {
        id: 502,
        alunoId: 101,
        cursoId: 3,
        turmaId: 403,
        status: 0,
        notaFinal: 0,
        dataSolicitacao: "2026-04-12T15:00:00.000Z"
      },
      {
        id: 503,
        alunoId: 102,
        cursoId: 2,
        turmaId: 402,
        status: 1,
        notaFinal: 9.1,
        dataSolicitacao: "2026-03-11T09:40:00.000Z"
      },
      {
        id: 504,
        alunoId: 103,
        cursoId: 1,
        turmaId: null,
        status: 0,
        notaFinal: 0,
        dataSolicitacao: "2026-04-15T17:30:00.000Z"
      }
    ],
    conteudos: [
      {
        id: 601,
        titulo: "Panorama do modulo",
        descricao: "Introducao pratica aos conceitos basicos que sustentam o curso.",
        tipoConteudo: 1,
        corpoTexto: "Nesta aula o aluno entende o objetivo do modulo, o fluxo das entregas e os marcos que serao avaliados.",
        arquivoUrl: "",
        linkUrl: "",
        turmaId: 401,
        moduloId: 11,
        statusPublicacao: 2,
        ordemExibicao: 1,
        pesoProgresso: 0.4,
        criadoEm: "2026-03-12T10:00:00.000Z",
        atualizadoEm: "2026-03-12T10:00:00.000Z",
        publicadoEm: "2026-03-12T10:00:00.000Z"
      },
      {
        id: 602,
        titulo: "Guia de apoio em PDF",
        descricao: "Material complementar com exemplos de estruturas e checkpoints da semana.",
        tipoConteudo: 2,
        corpoTexto: "",
        arquivoUrl: "https://example.com/demo/programacao-guia.pdf",
        linkUrl: "",
        turmaId: 401,
        moduloId: 12,
        statusPublicacao: 2,
        ordemExibicao: 2,
        pesoProgresso: 0.35,
        criadoEm: "2026-03-14T14:20:00.000Z",
        atualizadoEm: "2026-03-15T09:00:00.000Z",
        publicadoEm: "2026-03-15T09:00:00.000Z"
      },
      {
        id: 603,
        titulo: "Video de leitura de indicadores",
        descricao: "Aula gravada com exemplos de metricas e leitura inicial do dashboard.",
        tipoConteudo: 3,
        corpoTexto: "",
        arquivoUrl: "",
        linkUrl: "https://example.com/demo/indicadores-video",
        turmaId: 403,
        moduloId: 31,
        statusPublicacao: 2,
        ordemExibicao: 1,
        pesoProgresso: 0.5,
        criadoEm: "2026-04-01T18:30:00.000Z",
        atualizadoEm: "2026-04-02T08:10:00.000Z",
        publicadoEm: "2026-04-02T08:10:00.000Z"
      },
      {
        id: 604,
        titulo: "Leitura externa recomendada",
        descricao: "Artigo de apoio para aprofundar repertorio antes do encontro ao vivo.",
        tipoConteudo: 4,
        corpoTexto: "",
        arquivoUrl: "",
        linkUrl: "https://example.com/demo/storytelling-dados",
        turmaId: 403,
        moduloId: 32,
        statusPublicacao: 1,
        ordemExibicao: 2,
        pesoProgresso: 0.2,
        criadoEm: "2026-04-05T20:00:00.000Z",
        atualizadoEm: "2026-04-05T20:00:00.000Z",
        publicadoEm: null
      },
      {
        id: 605,
        titulo: "Consulta SQL comentada",
        descricao: "Exercicio resolvido para revisar filtros, joins e ordenacao.",
        tipoConteudo: 1,
        corpoTexto: "O material demonstra o passo a passo de uma consulta aplicada ao caso da turma.",
        arquivoUrl: "",
        linkUrl: "",
        turmaId: 402,
        moduloId: 22,
        statusPublicacao: 2,
        ordemExibicao: 1,
        pesoProgresso: 0.45,
        criadoEm: "2026-03-18T16:00:00.000Z",
        atualizadoEm: "2026-03-19T11:15:00.000Z",
        publicadoEm: "2026-03-19T11:15:00.000Z"
      }
    ],
    progressos: {
      conteudos: [],
      modulos: [],
      cursos: []
    }
  };
}

function parseBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  return body;
}

function normalizePath(path) {
  const normalized = `/${String(path || "").replace(/^\/+/, "").replace(/\/+$/, "")}`;
  return normalized === "/" ? "/" : normalized;
}

function getNumericId(path) {
  const id = Number(String(path).split("/").pop());

  if (!Number.isInteger(id)) {
    throw new DemoApiError("Identificador demo invalido.", 400);
  }

  return id;
}

function getEnrollmentActionId(path) {
  const match = String(path).match(/^\/Matriculas\/(\d+)\/(?:aprovar|rejeitar)$/);
  const id = Number(match?.[1]);

  if (!Number.isInteger(id)) {
    throw new DemoApiError("Identificador demo invalido.", 400);
  }

  return id;
}

function getCourseCoordinatorActionId(path) {
  const match = String(path).match(/^\/Cursos\/(\d+)\/coordenador$/);
  const id = Number(match?.[1]);

  if (!Number.isInteger(id)) {
    throw new DemoApiError("Identificador demo invalido.", 400);
  }

  return id;
}

function getClassProfessorActionId(path) {
  const match = String(path).match(/^\/Turmas\/(\d+)\/professor$/);
  const id = Number(match?.[1]);

  if (!Number.isInteger(id)) {
    throw new DemoApiError("Identificador demo invalido.", 400);
  }

  return id;
}

function getProgressContentActionId(path) {
  const match = String(path).match(/^\/Progressos\/conteudos\/(\d+)\/concluir$/);
  const id = Number(match?.[1]);

  if (!Number.isInteger(id)) {
    throw new DemoApiError("Identificador demo invalido.", 400);
  }

  return id;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nextId(items) {
  return items.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1;
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function maskCpf(value) {
  const digits = onlyDigits(value);

  if (digits.length !== 11) {
    return value || "-";
  }

  return `***.***.***-${digits.slice(-2)}`;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
