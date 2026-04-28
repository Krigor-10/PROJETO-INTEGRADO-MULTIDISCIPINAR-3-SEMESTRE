import { useCallback, useMemo, useState } from "react";
import { DataTable, PanelCard, StatusPill } from "../../components/Primitives.jsx";
import { maskCpf } from "../../lib/format.js";

function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SecaoAlunos({ alunos, matriculas = [] }) {
  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const termoBusca = useMemo(() => normalizarBusca(buscaAluno), [buscaAluno]);
  const matriculaPrincipalPorAluno = useMemo(() => {
    const matriculasPorAluno = new Map();

    matriculas.forEach((matricula) => {
      const alunoId = Number(matricula.alunoId);
      const codigoRegistro = String(matricula.codigoRegistro || "").trim();

      if (!alunoId || !codigoRegistro) {
        return;
      }

      const matriculaAtual = matriculasPorAluno.get(alunoId);
      const statusMatricula = Number(matricula.status);
      const statusAtual = Number(matriculaAtual?.status);

      if (!matriculaAtual || statusMatricula === 1 || statusAtual !== 1) {
        matriculasPorAluno.set(alunoId, matricula);
      }
    });

    return new Map(
      [...matriculasPorAluno.entries()].map(([alunoId, matricula]) => [alunoId, matricula.codigoRegistro])
    );
  }, [matriculas]);
  const quantidadeCursosPorAluno = useMemo(() => {
    const cursosPorAluno = new Map();

    matriculas.forEach((matricula) => {
      const alunoId = Number(matricula.alunoId);
      const cursoId = Number(matricula.cursoId);

      if (!alunoId || !cursoId) {
        return;
      }

      if (!cursosPorAluno.has(alunoId)) {
        cursosPorAluno.set(alunoId, new Set());
      }

      cursosPorAluno.get(alunoId).add(cursoId);
    });

    return new Map([...cursosPorAluno.entries()].map(([alunoId, cursos]) => [alunoId, cursos.size]));
  }, [matriculas]);
  const obterMatriculaAluno = useCallback(
    (aluno) => aluno.matricula || matriculaPrincipalPorAluno.get(aluno.id) || "Sem matricula",
    [matriculaPrincipalPorAluno]
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
      const quantidadeCursos = quantidadeCursosPorAluno.get(aluno.id) || 0;
      const campos = [
        aluno.nome,
        aluno.email,
        aluno.cpf,
        cpfFormatado,
        obterMatriculaAluno(aluno),
        String(quantidadeCursos),
        status
      ];

      return campos.some((campo) => normalizarBusca(campo).includes(termoBusca));
    });
  }, [alunos, filtroStatus, obterMatriculaAluno, quantidadeCursosPorAluno, termoBusca]);
  const temFiltroAtivo = Boolean(termoBusca || filtroStatus !== "todos");

  function limparFiltros() {
    setBuscaAluno("");
    setFiltroStatus("todos");
  }

  return (
    <PanelCard description="Lista vinda da API protegida para administracao e coordenacao." title="Base de alunos">
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
          { key: "matricula", label: "MATRICULA", render: obterMatriculaAluno },
          { key: "nome", label: "NOME" },
          { key: "email", label: "EMAIL" },
          {
            key: "cursosCadastrados",
            label: "CURSOS CADASTRADOS",
            render: (aluno) => quantidadeCursosPorAluno.get(aluno.id) || 0
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
