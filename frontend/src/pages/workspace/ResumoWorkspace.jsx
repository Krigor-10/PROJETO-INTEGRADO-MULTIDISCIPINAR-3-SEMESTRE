import { MiniList, PanelCard } from "../../components/Primitives.jsx";
import {
  describeCourse,
  formatDate,
  formatMoney,
  normalizeContentType,
  normalizePublicationStatus
} from "../../lib/format.js";

export function ResumoWorkspace({ conteudos, cursos, ehGestor, ehProfessor, ehAluno, matriculas, pendencias, turmas, usuario }) {
  const itensProfessor = conteudos.length
    ? [...conteudos]
        .sort((conteudoA, conteudoB) => {
          const dataConteudoA = new Date(conteudoA.atualizadoEm || conteudoA.criadoEm || 0).getTime();
          const dataConteudoB = new Date(conteudoB.atualizadoEm || conteudoB.criadoEm || 0).getTime();
          return dataConteudoB - dataConteudoA;
        })
        .slice(0, 4)
        .map((conteudo) => ({
          id: conteudo.id,
          title: conteudo.titulo,
          meta: `${conteudo.turmaNome || "Turma"} - ${conteudo.moduloTitulo || "Modulo"}`,
          badge: normalizePublicationStatus(conteudo.statusPublicacao)
        }))
    : turmas.slice(0, 4).map((turma) => ({
        id: turma.id,
        title: turma.nomeTurma,
        meta: `${formatDate(turma.dataCriacao)} - Curso #${turma.cursoId}`,
        badge: turma.professorId ? "Atribuida" : "Pendente"
      }));

  const itensAluno = conteudos.length
    ? [...conteudos]
        .sort((conteudoA, conteudoB) => {
          const dataConteudoA = new Date(conteudoA.publicadoEm || conteudoA.atualizadoEm || conteudoA.criadoEm || 0).getTime();
          const dataConteudoB = new Date(conteudoB.publicadoEm || conteudoB.atualizadoEm || conteudoB.criadoEm || 0).getTime();
          return dataConteudoB - dataConteudoA;
        })
        .slice(0, 4)
        .map((conteudo) => ({
          id: conteudo.id,
          title: conteudo.titulo,
          meta: `${conteudo.turmaNome || "Turma"} - ${conteudo.moduloTitulo || "Modulo"}`,
          badge: normalizeContentType(conteudo.tipoConteudo)
        }))
    : [];

  const itensPrincipais = ehGestor
    ? pendencias.slice(0, 4).map((pendencia) => ({
        id: pendencia.id,
        title: pendencia.nomeAluno,
        meta: `${pendencia.curso} - ${formatDate(pendencia.dataSolicitacao)}`,
        badge: pendencia.cpfMascarado || "Sem CPF"
      }))
    : ehProfessor
      ? itensProfessor
      : ehAluno && itensAluno.length
        ? itensAluno
      : matriculas.slice(0, 4).map((matricula) => ({
          id: matricula.id,
          title: matricula.curso,
          meta: `${matricula.turma} - ${formatDate(matricula.dataSolicitacao)}`,
          badge: matricula.status
        }));

  const mensagemVazia = ehGestor
    ? "Nenhuma pendencia aberta agora."
    : ehProfessor
      ? "Nenhum conteudo criado ainda."
      : "Voce ainda nao possui matriculas registradas.";

  const descricao = ehGestor
    ? "Fila que merece atencao imediata do time academico."
    : ehProfessor
      ? conteudos.length
        ? "Materiais mais recentes ligados ao seu workspace de professor."
        : "Turmas vinculadas ao seu usuario dentro do sistema."
      : ehAluno && itensAluno.length
        ? `Ultimos materiais liberados para a jornada de ${usuario.nome}.`
        : `Resumo rapido das solicitacoes enviadas por ${usuario.nome}.`;

  const titulo = ehGestor
    ? "Fila de analise"
    : ehProfessor
      ? conteudos.length
        ? "Publicacoes recentes"
        : "Turmas em destaque"
      : ehAluno && itensAluno.length
        ? "Conteudos recentes"
        : "Minha trilha recente";

  return (
    <section className={`panel-grid${ehGestor ? "" : " panel-grid--stacked"}`}>
      <PanelCard description={descricao} title={titulo}>
        <MiniList emptyMessage={mensagemVazia} items={itensPrincipais} />
      </PanelCard>

      {ehGestor ? (
        <PanelCard description="Os mesmos cursos alimentam a area publica e o painel autenticado." title="Catalogo visivel no React">
          <div className="course-grid course-grid--compact">
            {cursos.slice(0, 3).map((curso) => (
              <article className="course-card course-card--compact" key={curso.id}>
                <span className="chip">Curso</span>
                <h3>{curso.titulo}</h3>
                <p>{describeCourse(curso)}</p>
                <strong>{formatMoney(curso.preco)}</strong>
              </article>
            ))}
          </div>
        </PanelCard>
      ) : null}
    </section>
  );
}
