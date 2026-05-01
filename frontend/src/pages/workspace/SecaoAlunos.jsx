import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable, PanelCard, StatusPill } from "../../components/Primitives.jsx";
import { maskCpf } from "../../lib/format.js";
import { mapById } from "../../lib/dashboard.js";

function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SecaoAlunos({ alunos, cursos = [], matriculas = [] }) {
  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [alunoCursosSelecionado, setAlunoCursosSelecionado] = useState(null);
  const termoBusca = useMemo(() => normalizarBusca(buscaAluno), [buscaAluno]);
  const cursoPorId = useMemo(() => mapById(cursos), [cursos]);
  const cursosPorAluno = useMemo(() => {
    const cursosMapeados = new Map();

    matriculas.forEach((matricula) => {
      const alunoId = Number(matricula.alunoId);
      const cursoId = Number(matricula.cursoId);

      if (!alunoId || !cursoId) {
        return;
      }

      if (!cursosMapeados.has(alunoId)) {
        cursosMapeados.set(alunoId, new Map());
      }

      const curso = cursoPorId.get(cursoId);
      cursosMapeados.get(alunoId).set(cursoId, {
        id: cursoId,
        titulo: curso?.titulo || curso?.nome || `Curso #${cursoId}`
      });
    });

    return new Map(
      [...cursosMapeados.entries()].map(([alunoId, cursosAluno]) => [
        alunoId,
        [...cursosAluno.values()].sort((left, right) => left.titulo.localeCompare(right.titulo, "pt-BR"))
      ])
    );
  }, [cursoPorId, matriculas]);
  const obterMatriculaAluno = useCallback(
    (aluno) => String(aluno.matricula || "").trim() || "Sem registro",
    []
  );
  const alunosFiltrados = useMemo(() => {
    let proximosAlunos = alunos;

    if (filtroStatus === "ativos") {
      proximosAlunos = proximosAlunos.filter((aluno) => aluno.ativo);
    } else if (filtroStatus === "inativos") {
      proximosAlunos = proximosAlunos.filter((aluno) => !aluno.ativo);
    }

    if (!termoBusca) {
      return proximosAlunos;
    }

    return proximosAlunos.filter((aluno) => {
      const cpfFormatado = maskCpf(aluno.cpf);
      const status = aluno.ativo ? "Ativo" : "Inativo";
      const cursosDoAluno = cursosPorAluno.get(aluno.id) || [];
      const campos = [
        aluno.nome,
        aluno.email,
        aluno.cpf,
        cpfFormatado,
        obterMatriculaAluno(aluno),
        String(cursosDoAluno.length),
        ...cursosDoAluno.map((curso) => curso.titulo),
        status
      ];

      return campos.some((campo) => normalizarBusca(campo).includes(termoBusca));
    });
  }, [alunos, cursosPorAluno, filtroStatus, obterMatriculaAluno, termoBusca]);
  const temFiltroAtivo = Boolean(termoBusca || filtroStatus !== "todos");

  useEffect(() => {
    if (!alunoCursosSelecionado) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setAlunoCursosSelecionado(null);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [alunoCursosSelecionado]);

  function limparFiltros() {
    setBuscaAluno("");
    setFiltroStatus("todos");
  }

  function obterCursosDoAluno(aluno) {
    return cursosPorAluno.get(Number(aluno.id)) || [];
  }

  function abrirCursosAluno(aluno) {
    const cursosDoAluno = obterCursosDoAluno(aluno);

    if (cursosDoAluno.length <= 1) {
      return;
    }

    setAlunoCursosSelecionado({
      aluno,
      cursos: cursosDoAluno
    });
  }

  function fecharCursosAluno() {
    setAlunoCursosSelecionado(null);
  }

  function renderCursosAluno(aluno) {
    const cursosDoAluno = obterCursosDoAluno(aluno);

    if (!cursosDoAluno.length) {
      return <span className="table-muted">Nenhum curso</span>;
    }

    return (
      <div className="course-preview-cell">
        <span className="course-preview-cell__name">{cursosDoAluno[0].titulo}</span>
        {cursosDoAluno.length > 1 ? (
          <button
            aria-label={`Ver todos os cursos de ${aluno.nome}`}
            className="course-preview-cell__more"
            onClick={() => abrirCursosAluno(aluno)}
            title="Ver cursos"
            type="button"
          >
            +
          </button>
        ) : null}
      </div>
    );
  }

  function renderCursosAlunoPopup() {
    if (!alunoCursosSelecionado) {
      return null;
    }

    return (
      <div
        className="content-form-modal"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            fecharCursosAluno();
          }
        }}
      >
        <div
          aria-label={`Cursos cadastrados de ${alunoCursosSelecionado.aluno.nome}`}
          aria-modal="true"
          className="content-form-modal__card content-form-modal__card--compact"
          role="dialog"
        >
          <button className="content-form-modal__close" onClick={fecharCursosAluno} type="button">
            Fechar
          </button>

          <PanelCard description={alunoCursosSelecionado.aluno.nome} title="Cursos cadastrados">
            <ul className="student-course-list">
              {alunoCursosSelecionado.cursos.map((curso) => (
                <li key={curso.id}>{curso.titulo}</li>
              ))}
            </ul>
          </PanelCard>
        </div>
      </div>
    );
  }

  return (
    <PanelCard description="Lista vinda da API protegida para administracao e coordenacao." title="Base de alunos">
      {renderCursosAlunoPopup()}

      <div className="table-toolbar table-toolbar--filters">
        <div className="table-filter-group">
          <label className="table-search-control">
            <span aria-hidden="true" className="table-search-control__icon">
              <svg focusable="false" height="18" viewBox="0 0 24 24" width="18">
                <path
                  d="M10.8 5.2a5.6 5.6 0 1 0 0 11.2 5.6 5.6 0 0 0 0-11.2Zm-7.6 5.6a7.6 7.6 0 1 1 13.5 4.8l3.8 3.8a1 1 0 0 1-1.4 1.4l-3.8-3.8A7.6 7.6 0 0 1 3.2 10.8Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <input
              aria-label="Buscar alunos"
              className="table-inline-input table-inline-input--search"
              onChange={(event) => setBuscaAluno(event.target.value)}
              placeholder="Pesquisar alunos"
              type="search"
              value={buscaAluno}
            />
          </label>
          <select
            aria-label="Filtrar alunos por status"
            className="table-inline-select"
            onChange={(event) => setFiltroStatus(event.target.value)}
            value={filtroStatus}
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
          <button className="table-action" disabled={!temFiltroAtivo} onClick={limparFiltros} type="button">
            Limpar filtros
          </button>
        </div>
        <p className="table-toolbar__summary">
          {alunosFiltrados.length} de {alunos.length} aluno{alunos.length === 1 ? "" : "s"}
        </p>
      </div>
      <DataTable
        columns={[
          { key: "matricula", label: "REGISTRO DO ALUNO", render: obterMatriculaAluno },
          { key: "nome", label: "NOME" },
          { key: "email", label: "EMAIL" },
          {
            key: "cursosCadastrados",
            label: "CURSOS CADASTRADOS",
            render: renderCursosAluno
          },
          {
            key: "ativo",
            label: "STATUS",
            render: (aluno) => (
              <StatusPill tone={aluno.ativo ? "success" : "danger"}>{aluno.ativo ? "Ativo" : "Inativo"}</StatusPill>
            )
          }
        ]}
        emptyMessage="Nenhum aluno encontrado."
        rows={alunosFiltrados}
      />
    </PanelCard>
  );
}
