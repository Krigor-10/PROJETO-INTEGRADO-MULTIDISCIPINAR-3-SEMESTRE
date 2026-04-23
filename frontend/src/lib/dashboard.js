import { EMPTY_SNAPSHOT, MANAGER_ROLES } from "../data/appConfig.js";
import { apiRequest } from "./api.js";

export async function loadWorkspaceSnapshot(usuario) {
  const role = usuario.tipoUsuario || "";

  if (MANAGER_ROLES.has(role)) {
    const [
      cursos,
      modulos,
      alunos,
      coordenadores,
      professores,
      turmas,
      matriculas,
      pendentes
    ] = await Promise.all([
      apiRequest("/Cursos"),
      apiRequest("/Modulos"),
      apiRequest("/Alunos"),
      role === "Admin" ? apiRequest("/Coordenadores") : Promise.resolve([]),
      apiRequest("/Professores"),
      apiRequest("/Turmas"),
      apiRequest("/Matriculas"),
      apiRequest("/Matriculas/pendentes")
    ]);

    return {
      ...EMPTY_SNAPSHOT,
      cursos,
      modulos,
      alunos,
      coordenadores,
      professores,
      turmas,
      matriculas,
      pendentes
    };
  }

  if (role === "Professor") {
    const [cursos, modulos, turmas, conteudos] = await Promise.all([
      apiRequest("/Cursos/meus"),
      apiRequest("/Modulos/meus"),
      apiRequest("/Turmas/minhas"),
      apiRequest("/ConteudosDidaticos")
    ]);

    return {
      ...EMPTY_SNAPSHOT,
      cursos,
      modulos,
      turmas,
      conteudos
    };
  }

  const [cursos, turmas, matriculas, conteudos, progressos] = await Promise.all([
    apiRequest("/Cursos"),
    apiRequest("/Turmas"),
    apiRequest(`/Matriculas/aluno/${usuario.id}`),
    apiRequest(`/ConteudosDidaticos/aluno/${usuario.id}`),
    apiRequest(`/Progressos/aluno/${usuario.id}`)
  ]);

  return {
    ...EMPTY_SNAPSHOT,
    cursos,
    turmas,
    matriculas,
    conteudos,
    progressos
  };
}

export function hasSnapshotData(snapshot) {
  return Object.values(snapshot).some((value) => Array.isArray(value) && value.length > 0);
}

export function mapById(list) {
  return new Map(list.map((item) => [item.id, item]));
}
