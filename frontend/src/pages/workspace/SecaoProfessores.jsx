import { useMemo, useState } from "react";
import { DataTable, PanelCard } from "../../components/Primitives.jsx";

function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SecaoProfessores({ professores }) {
  const [buscaProfessor, setBuscaProfessor] = useState("");
  const [filtroEspecialidade, setFiltroEspecialidade] = useState("todas");
  const termoBusca = useMemo(() => normalizarBusca(buscaProfessor), [buscaProfessor]);
  const especialidades = useMemo(() => {
    const unicas = new Set(
      professores
        .map((professor) => String(professor.especialidade || "").trim())
        .filter(Boolean)
    );

    return [...unicas].sort((left, right) => left.localeCompare(right, "pt-BR"));
  }, [professores]);
  const professoresFiltrados = useMemo(() => {
    let proximosProfessores = professores;

    if (filtroEspecialidade !== "todas") {
      proximosProfessores = proximosProfessores.filter(
        (professor) => normalizarBusca(professor.especialidade) === normalizarBusca(filtroEspecialidade)
      );
    }

    if (!termoBusca) {
      return proximosProfessores;
    }

    return proximosProfessores.filter((professor) => {
      const campos = [professor.nome, professor.email, professor.especialidade];

      return campos.some((campo) => normalizarBusca(campo).includes(termoBusca));
    });
  }, [filtroEspecialidade, professores, termoBusca]);
  const temFiltroAtivo = Boolean(termoBusca || filtroEspecialidade !== "todas");

  function limparFiltros() {
    setBuscaProfessor("");
    setFiltroEspecialidade("todas");
  }

  return (
    <PanelCard description="Corpo docente disponivel para composicao das turmas." title="Professores cadastrados">
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
              aria-label="Buscar professores"
              className="table-inline-input table-inline-input--search"
              onChange={(event) => setBuscaProfessor(event.target.value)}
              placeholder="Pesquisar professores"
              type="search"
              value={buscaProfessor}
            />
          </label>
          <select
            aria-label="Filtrar professores por especialidade"
            className="table-inline-select"
            onChange={(event) => setFiltroEspecialidade(event.target.value)}
            value={filtroEspecialidade}
          >
            <option value="todas">Todas as especialidades</option>
            {especialidades.map((especialidade) => (
              <option key={especialidade} value={especialidade}>
                {especialidade}
              </option>
            ))}
          </select>
          <button className="table-action" disabled={!temFiltroAtivo} onClick={limparFiltros} type="button">
            Limpar filtros
          </button>
        </div>
        <p className="table-toolbar__summary">
          {professoresFiltrados.length} de {professores.length} professor{professores.length === 1 ? "" : "es"}
        </p>
      </div>
      <DataTable
        columns={[
          { key: "nome", label: "Nome" },
          { key: "email", label: "E-mail" },
          { key: "especialidade", label: "Especialidade" }
        ]}
        emptyMessage="Nenhum professor encontrado."
        rows={professoresFiltrados}
      />
    </PanelCard>
  );
}
