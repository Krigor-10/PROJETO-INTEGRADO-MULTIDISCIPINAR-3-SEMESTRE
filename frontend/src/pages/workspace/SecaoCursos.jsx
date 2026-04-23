import { useEffect, useMemo, useState } from "react";
import { DataTable, InlineMessage, PanelCard } from "../../components/Primitives.jsx";
import { ApiError, apiRequest } from "../../lib/api.js";
import { compactText, formatMoney } from "../../lib/format.js";

function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SecaoCursos({
  coordenadores = [],
  cursos,
  ehAdmin,
  ehCoordenador,
  onRefresh,
  onSessionExpired
}) {
  const [cursosSelecionados, setCursosSelecionados] = useState(() => new Set());
  const [coordenadorSelecionado, setCoordenadorSelecionado] = useState("");
  const [filtroCoordenador, setFiltroCoordenador] = useState("todos");
  const [buscaCurso, setBuscaCurso] = useState("");
  const [mensagem, setMensagem] = useState({ tone: "info", message: "" });
  const [salvando, setSalvando] = useState(false);

  const coordenadoresOrdenados = useMemo(
    () => [...coordenadores].sort((left, right) => String(left.nome || "").localeCompare(String(right.nome || ""), "pt-BR")),
    [coordenadores]
  );
  const coordenadorPorId = useMemo(
    () => new Map(coordenadoresOrdenados.map((coordenador) => [coordenador.id, coordenador])),
    [coordenadoresOrdenados]
  );
  const termoBusca = useMemo(() => normalizarBusca(buscaCurso), [buscaCurso]);
  const cursosFiltrados = useMemo(() => {
    let proximosCursos = cursos;

    if (ehAdmin && filtroCoordenador === "aguardando") {
      proximosCursos = proximosCursos.filter((curso) => !curso.coordenadorId);
    } else if (ehAdmin && filtroCoordenador !== "todos") {
      const coordenadorId = Number(filtroCoordenador);
      proximosCursos = proximosCursos.filter((curso) => Number(curso.coordenadorId) === coordenadorId);
    }

    if (!termoBusca) {
      return proximosCursos;
    }

    return proximosCursos.filter((curso) => {
      const coordenador = curso.coordenadorId ? coordenadorPorId.get(curso.coordenadorId) : null;
      const coordenacao = coordenador?.nome || (curso.coordenadorId ? `Usuario #${curso.coordenadorId}` : "Nao atribuida");
      const campos = [curso.titulo, curso.descricao, coordenacao, formatMoney(curso.preco)];

      return campos.some((campo) => normalizarBusca(campo).includes(termoBusca));
    });
  }, [coordenadorPorId, cursos, ehAdmin, filtroCoordenador, termoBusca]);
  const idsCursos = useMemo(() => new Set(cursosFiltrados.map((curso) => curso.id)), [cursosFiltrados]);
  const cursosMarcados = useMemo(
    () => cursosFiltrados.filter((curso) => cursosSelecionados.has(curso.id)),
    [cursosFiltrados, cursosSelecionados]
  );
  const todosCursosSelecionados =
    cursosFiltrados.length > 0 && cursosFiltrados.every((curso) => cursosSelecionados.has(curso.id));
  const quantidadeSelecionada = cursosMarcados.length;
  const temFiltroAtivo = Boolean(termoBusca || (ehAdmin && filtroCoordenador !== "todos"));

  useEffect(() => {
    setCursosSelecionados((atuais) => {
      const proximos = new Set([...atuais].filter((id) => idsCursos.has(id)));
      return proximos.size === atuais.size ? atuais : proximos;
    });
  }, [idsCursos]);

  function alternarCurso(curso) {
    if (!ehAdmin || salvando) {
      return;
    }

    setCursosSelecionados((atuais) => {
      const proximos = new Set(atuais);

      if (proximos.has(curso.id)) {
        proximos.delete(curso.id);
      } else {
        proximos.add(curso.id);
      }

      return proximos;
    });
  }

  function alternarTodosCursos() {
    if (!ehAdmin || salvando || !cursosFiltrados.length) {
      return;
    }

    setCursosSelecionados((atuais) => {
      if (todosCursosSelecionados) {
        return new Set();
      }

      const proximos = new Set(atuais);
      cursosFiltrados.forEach((curso) => proximos.add(curso.id));
      return proximos;
    });
  }

  function limparFiltros() {
    setBuscaCurso("");
    setFiltroCoordenador("todos");
  }

  async function atribuirCoordenador() {
    const coordenadorId = Number(coordenadorSelecionado);

    if (!quantidadeSelecionada) {
      setMensagem({ tone: "error", message: "Selecione ao menos um curso para atribuir coordenador." });
      return;
    }

    if (coordenadorSelecionado === "") {
      setMensagem({ tone: "error", message: "Selecione um coordenador ou a opcao Aguardando coordenador." });
      return;
    }

    try {
      setMensagem({ tone: "info", message: "" });
      setSalvando(true);

      for (const curso of cursosMarcados) {
        await apiRequest(`/Cursos/${curso.id}/coordenador`, {
          method: "PUT",
          body: JSON.stringify(coordenadorId)
        });
      }

      const coordenador = coordenadorId ? coordenadorPorId.get(coordenadorId) : null;
      setMensagem({
        tone: "success",
        message: coordenador
          ? `${quantidadeSelecionada} curso${quantidadeSelecionada > 1 ? "s vinculados" : " vinculado"} a ${coordenador.nome}.`
          : `${quantidadeSelecionada} curso${quantidadeSelecionada > 1 ? "s marcados" : " marcado"} como aguardando coordenador.`
      });
      setCursosSelecionados(new Set());
      setCoordenadorSelecionado("");
      onRefresh?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired?.();
        return;
      }

      setMensagem({ tone: "error", message: err.message || "Nao foi possivel atribuir coordenador agora." });
      onRefresh?.();
    } finally {
      setSalvando(false);
    }
  }

  function renderSelecao(curso) {
    return (
      <label className="table-select-cell">
        <input
          aria-label={`Selecionar curso ${curso.titulo}`}
          checked={cursosSelecionados.has(curso.id)}
          className="table-select-input"
          disabled={!ehAdmin || salvando}
          onChange={() => alternarCurso(curso)}
          type="checkbox"
        />
      </label>
    );
  }

  function renderBarraAtribuicao() {
    if (!ehAdmin) {
      return null;
    }

    return (
      <div className="table-toolbar table-toolbar--assignment">
        <div className="table-actions table-actions--bulk">
          <label className="table-bulk-toggle">
            <input
              checked={todosCursosSelecionados}
              className="table-select-input"
              disabled={salvando || !cursosFiltrados.length}
              onChange={alternarTodosCursos}
              type="checkbox"
            />
            <span>Selecionar cursos</span>
          </label>
          <select
            aria-label="Coordenador para atribuir aos cursos"
            className="table-inline-select table-inline-select--bulk"
            disabled={salvando || !coordenadoresOrdenados.length}
            onChange={(event) => setCoordenadorSelecionado(event.target.value)}
            value={coordenadorSelecionado}
          >
            <option value="">
              Selecionar coordenador
            </option>
            <option value="0">Aguardando coordenador</option>
            {coordenadoresOrdenados.map((coordenador) => (
              <option key={coordenador.id} value={coordenador.id}>
                {coordenador.nome}
              </option>
            ))}
          </select>
          <button className="table-action" disabled={salvando} onClick={atribuirCoordenador} type="button">
            {salvando ? "Salvando..." : "Atribuir coordenador"}
          </button>
        </div>
        <p className="table-toolbar__summary">
          {quantidadeSelecionada
            ? `${quantidadeSelecionada} curso${quantidadeSelecionada > 1 ? "s selecionados" : " selecionado"}`
            : `${cursosFiltrados.length} de ${cursos.length} curso${cursos.length === 1 ? "" : "s"}`}
        </p>
      </div>
    );
  }

  function renderBarraFiltros() {
    return (
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
              aria-label="Buscar cursos"
              className="table-inline-input table-inline-input--search"
              onChange={(event) => setBuscaCurso(event.target.value)}
              placeholder="Pesquisar cursos"
              type="search"
              value={buscaCurso}
            />
          </label>
          {ehAdmin ? (
            <select
              aria-label="Filtrar cursos por coordenador"
              className="table-inline-select"
              disabled={salvando}
              onChange={(event) => setFiltroCoordenador(event.target.value)}
              value={filtroCoordenador}
            >
              <option value="todos">Todos os coordenadores</option>
              <option value="aguardando">Aguardando coordenador</option>
              {coordenadoresOrdenados.map((coordenador) => (
                <option key={coordenador.id} value={coordenador.id}>
                  {coordenador.nome}
                </option>
              ))}
            </select>
          ) : null}
          <button className="table-action" disabled={!temFiltroAtivo} onClick={limparFiltros} type="button">
            Limpar filtros
          </button>
        </div>
        <p className="table-toolbar__summary">
          {cursosFiltrados.length} de {cursos.length} curso{cursos.length === 1 ? "" : "s"}
        </p>
      </div>
    );
  }

  const colunas = [
    ...(ehAdmin ? [{ key: "selecionar", label: "Selecionar", render: renderSelecao }] : []),
    { key: "titulo", label: "Titulo" },
    { key: "descricao", label: "Descricao", render: (curso) => compactText(curso.descricao, 90) },
    { key: "preco", label: "Preco", render: (curso) => formatMoney(curso.preco) },
    {
      key: "coordenacao",
      label: "Coordenacao",
      render: (curso) => {
        const coordenador = curso.coordenadorId ? coordenadorPorId.get(curso.coordenadorId) : null;
        return coordenador?.nome || (curso.coordenadorId ? `Usuario #${curso.coordenadorId}` : "Nao atribuida");
      }
    }
  ];

  return (
    <PanelCard
      description={
        ehCoordenador
          ? "Cursos ativos vinculados a sua coordenacao."
          : ehAdmin
          ? "Selecione cursos e atribua um coordenador responsavel em lote."
          : "Catalogo de cursos reutilizado na home publica e no ambiente autenticado."
      }
      title="Cursos ativos"
    >
      {renderBarraFiltros()}
      {renderBarraAtribuicao()}
      {mensagem.message ? <InlineMessage tone={mensagem.tone}>{mensagem.message}</InlineMessage> : null}
      <DataTable
        columns={colunas}
        emptyMessage={ehCoordenador ? "Nenhum curso ativo sob sua coordenacao." : "Nenhum curso encontrado."}
        rows={cursosFiltrados}
      />
    </PanelCard>
  );
}
