export const MANAGER_ROLES = new Set(["Admin", "Coordenador"]);

export const APP_SECTIONS = [
  { key: "dashboard", label: "Panorama", roles: ["Admin", "Coordenador", "Professor", "Aluno"] },
  { key: "meus-cursos", label: "Meus cursos", roles: ["Aluno"], showInSidebar: false },
  { key: "alunos", label: "Alunos", roles: ["Admin", "Coordenador"] },
  { key: "professores", label: "Professores", roles: ["Admin", "Coordenador"] },
  { key: "cursos", label: "Cursos", roles: ["Admin", "Coordenador", "Professor"] },
  { key: "modulos", label: "Modulos", roles: ["Admin", "Coordenador"] },
  { key: "conteudos", label: "Conteudos", roles: ["Professor", "Aluno"] },
  { key: "avaliacoes", label: "Avaliacoes", roles: ["Professor", "Aluno"] },
  { key: "matriculas", label: "Matriculas", roles: ["Admin", "Coordenador", "Aluno"] },
  { key: "turmas", label: "Turmas", roles: ["Admin", "Coordenador", "Professor"] }
];

export const PUBLIC_PILLARS = [
  {
    title: "Cursos orientados a projeto",
    text: "Trilhas com pratica guiada, conteudos liberados por turma e acompanhamento de progresso."
  },
  {
    title: "Matricula acompanhada",
    text: "O aluno solicita entrada pela propria plataforma e acompanha o status quando acessar o painel."
  },
  {
    title: "Sala digital por perfil",
    text: "Aluno, professor e coordenacao entram no mesmo produto, cada um com as acoes do seu papel."
  }
];

export const PUBLIC_NAV_LINKS = [
  { href: "#catalogo", label: "Cursos" },
  { href: "#jornada", label: "Jornada" },
  { href: "#painel", label: "Acesso" },
  { href: "#ajuda", label: "Ajuda" }
];

export const PUBLIC_SUPPORT_CARDS = [
  {
    title: "Quero entender a jornada",
    text: "Veja como descoberta, matricula e painel academico se conectam em poucos passos.",
    actionLabel: "Ver a jornada",
    actionTarget: "#jornada",
    actionType: "anchor"
  },
  {
    title: "Ja tenho acesso",
    text: "Entre no ambiente autenticado para acompanhar cursos, turmas, materiais e avaliacoes.",
    actionLabel: "Abrir login",
    actionTarget: "/login",
    actionType: "route"
  },
  {
    title: "Quero comecar agora",
    text: "Escolha um curso e envie sua solicitacao de matricula para a equipe academica.",
    actionLabel: "Criar conta",
    actionTarget: "/cadastro",
    actionType: "route"
  }
];

export const CURATED_COURSES = [
  {
    id: "programacao",
    titulo: "Programacao Aplicada",
    descricao: "Projetos guiados, fundamentos solidos e pratica com problemas reais.",
    preco: 189.9
  },
  {
    id: "dados",
    titulo: "Banco de Dados",
    descricao: "Modelagem, SQL e estruturacao de consultas para produtos de verdade.",
    preco: 169.9
  },
  {
    id: "analytics",
    titulo: "Analise de Dados",
    descricao: "Indicadores, leitura de cenarios e decisao apoiada por evidencias.",
    preco: 209.9
  }
];

export const SIGNUP_INITIAL_STATE = {
  nome: "",
  email: "",
  cpf: "",
  telefone: "",
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cursoId: "",
  senha: "",
  confirmarSenha: ""
};

export const EMPTY_SNAPSHOT = {
  cursos: [],
  modulos: [],
  conteudos: [],
  avaliacoes: [],
  alunos: [],
  coordenadores: [],
  professores: [],
  turmas: [],
  matriculas: [],
  pendentes: [],
  progressos: {
    conteudos: [],
    modulos: [],
    cursos: []
  }
};

export function getSectionMeta(section, role) {
  const bySection = {
    dashboard: {
      title: `Panorama de ${role}`,
      description: "Resumo central do workspace React com dados reais do backend."
    },
    "meus-cursos": {
      title: "Meus cursos",
      description: "Atalho para as turmas e os cursos que ja fazem parte da sua jornada ativa."
    },
    alunos: {
      title: "Gestao de alunos",
      description: "Consulta rapida da base academica para operacao e apoio."
    },
    professores: {
      title: "Corpo docente",
      description: "Visao dos professores disponiveis para o ecossistema de cursos e turmas."
    },
    cursos: {
      title: "Catalogo academico",
      description: "A mesma base de cursos alimenta a home, o cadastro e o painel."
    },
    modulos: {
      title: "Módulos por curso",
      description: "Organizacao dos modulos por curso para sustentar conteudos, avaliacoes e progresso."
    },
    conteudos: {
      title: role === "Professor" ? "Publicacao de conteudos" : "Trilha de conteudos",
      description:
        role === "Professor"
          ? "Espaco do professor para montar materiais por turma e modulo."
          : "Materiais publicados para o seu percurso, organizados por turma e modulo."
    },
    avaliacoes: {
      title: role === "Aluno" ? "Realizar avaliacao" : "Avaliacoes",
      description:
        role === "Aluno"
          ? "Avaliacoes publicadas pelos professores para as suas turmas aprovadas."
          : "Area do professor para preparar provas, quizzes e exercicios por turma e modulo."
    },
    matriculas: {
      title: "Fluxo de matriculas",
      description: "Acompanhamento das solicitacoes e do status academico."
    },
    turmas: {
      title: "Mapa de turmas",
      description: "Turmas organizadas para atribuicao e acompanhamento dentro do produto."
    }
  };

  return bySection[section] || bySection.dashboard;
}
