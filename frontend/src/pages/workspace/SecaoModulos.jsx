import { useEffect, useMemo, useState } from "react";
import { DataTable, InlineMessage, PanelCard } from "../../components/Primitives.jsx";
import { ApiError, apiRequest } from "../../lib/api.js";
import { mapById } from "../../lib/dashboard.js";
import { formatDate } from "../../lib/format.js";

const ESTADO_INICIAL_FORMULARIO_MODULO = {
  cursoId: "",
  titulo: ""
};

export function SecaoModulos({ cursos, modulos, onRefresh, onSessionExpired }) {
  const [dadosFormularioModulo, setDadosFormularioModulo] = useState(ESTADO_INICIAL_FORMULARIO_MODULO);
  const [moduloEmEdicaoId, setModuloEmEdicaoId] = useState(null);
  const [mensagemFormularioModulo, setMensagemFormularioModulo] = useState({ tone: "", message: "" });
  const [modulosSelecionados, setModulosSelecionados] = useState(() => new Set());
  const [salvandoModulo, setSalvandoModulo] = useState(false);

  const cursosOrdenados = useMemo(
    () => [...cursos].sort((cursoA, cursoB) => cursoA.titulo.localeCompare(cursoB.titulo, "pt-BR")),
    [cursos]
  );

  useEffect(() => {
    if (moduloEmEdicaoId || dadosFormularioModulo.cursoId || !cursosOrdenados.length) {
      return;
    }

    setDadosFormularioModulo((dadosAtuais) => ({
      ...dadosAtuais,
      cursoId: String(cursosOrdenados[0].id)
    }));
  }, [moduloEmEdicaoId, dadosFormularioModulo.cursoId, cursosOrdenados]);

  const cursoPorId = useMemo(() => mapById(cursos), [cursos]);

  const linhasModulos = useMemo(
    () =>
      [...modulos].sort((moduloA, moduloB) => {
        const tituloCursoA = cursoPorId.get(moduloA.cursoId)?.titulo || "";
        const tituloCursoB = cursoPorId.get(moduloB.cursoId)?.titulo || "";
        const comparacaoCurso = tituloCursoA.localeCompare(tituloCursoB, "pt-BR");

        if (comparacaoCurso !== 0) {
          return comparacaoCurso;
        }

        return moduloA.titulo.localeCompare(moduloB.titulo, "pt-BR");
      }),
    [cursoPorId, modulos]
  );
  const idsModulos = useMemo(() => new Set(linhasModulos.map((modulo) => modulo.id)), [linhasModulos]);
  const modulosMarcados = useMemo(
    () => linhasModulos.filter((modulo) => modulosSelecionados.has(modulo.id)),
    [linhasModulos, modulosSelecionados]
  );
  const todosModulosSelecionados =
    linhasModulos.length > 0 && linhasModulos.every((modulo) => modulosSelecionados.has(modulo.id));
  const quantidadeSelecionada = modulosMarcados.length;

  useEffect(() => {
    setModulosSelecionados((atuais) => {
      const proximos = new Set([...atuais].filter((id) => idsModulos.has(id)));
      return proximos.size === atuais.size ? atuais : proximos;
    });
  }, [idsModulos]);

  function atualizarCampoFormularioModulo(event) {
    const { name, value } = event.target;

    setDadosFormularioModulo((dadosAtuais) => ({
      ...dadosAtuais,
      [name]: value
    }));
  }

  function limparFormularioModulo() {
    setModuloEmEdicaoId(null);
    setModulosSelecionados(new Set());
    setDadosFormularioModulo({
      cursoId: cursosOrdenados[0] ? String(cursosOrdenados[0].id) : "",
      titulo: ""
    });
  }

  function abrirEdicaoModulo(modulo) {
    setModuloEmEdicaoId(modulo.id);
    setDadosFormularioModulo({
      cursoId: String(modulo.cursoId),
      titulo: modulo.titulo
    });
    setMensagemFormularioModulo({ tone: "", message: "" });
  }

  function alternarModulo(modulo) {
    if (salvandoModulo) {
      return;
    }

    setModulosSelecionados((atuais) => {
      const proximos = new Set(atuais);

      if (proximos.has(modulo.id)) {
        proximos.delete(modulo.id);
      } else {
        proximos.add(modulo.id);
      }

      return proximos;
    });
  }

  function alternarTodosModulos() {
    if (salvandoModulo || !linhasModulos.length) {
      return;
    }

    setModulosSelecionados((atuais) => {
      if (todosModulosSelecionados) {
        return new Set();
      }

      const proximos = new Set(atuais);
      linhasModulos.forEach((modulo) => proximos.add(modulo.id));
      return proximos;
    });
  }

  function editarSelecionado() {
    if (quantidadeSelecionada !== 1) {
      setMensagemFormularioModulo({
        tone: "error",
        message: "Selecione exatamente um modulo para editar."
      });
      return;
    }

    abrirEdicaoModulo(modulosMarcados[0]);
  }

  async function salvarModulo(event) {
    event.preventDefault();

    const tituloNormalizado = dadosFormularioModulo.titulo.trim();

    if (!tituloNormalizado) {
      setMensagemFormularioModulo({ tone: "error", message: "Informe o titulo do modulo antes de salvar." });
      return;
    }

    if (!dadosFormularioModulo.cursoId) {
      setMensagemFormularioModulo({ tone: "error", message: "Selecione um curso para vincular o modulo." });
      return;
    }

    setSalvandoModulo(true);
    setMensagemFormularioModulo({ tone: "", message: "" });

    try {
      if (moduloEmEdicaoId) {
        await apiRequest(`/Modulos/${moduloEmEdicaoId}`, {
          method: "PUT",
          body: JSON.stringify({ titulo: tituloNormalizado })
        });

        setMensagemFormularioModulo({ tone: "success", message: "Modulo atualizado com sucesso." });
      } else {
        await apiRequest("/Modulos", {
          method: "POST",
          body: JSON.stringify({
            titulo: tituloNormalizado,
            cursoId: Number(dadosFormularioModulo.cursoId)
          })
        });

        setMensagemFormularioModulo({ tone: "success", message: "Modulo criado com sucesso." });
      }

      limparFormularioModulo();
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setMensagemFormularioModulo({
        tone: "error",
        message: err.message || "Nao foi possivel salvar o modulo agora."
      });
    } finally {
      setSalvandoModulo(false);
    }
  }

  async function excluirSelecionados() {
    if (!quantidadeSelecionada) {
      setMensagemFormularioModulo({ tone: "error", message: "Selecione ao menos um modulo para excluir." });
      return;
    }

    const rotulo = quantidadeSelecionada === 1 ? `"${modulosMarcados[0].titulo}"` : `${quantidadeSelecionada} modulos`;
    const exclusaoConfirmada = window.confirm(`Deseja excluir ${rotulo}?`);

    if (!exclusaoConfirmada) {
      return;
    }

    setSalvandoModulo(true);
    setMensagemFormularioModulo({ tone: "", message: "" });

    try {
      for (const modulo of modulosMarcados) {
        await apiRequest(`/Modulos/${modulo.id}`, { method: "DELETE" });
      }

      if (modulosMarcados.some((modulo) => modulo.id === moduloEmEdicaoId)) {
        setModuloEmEdicaoId(null);
      }

      setModulosSelecionados(new Set());
      setMensagemFormularioModulo({
        tone: "success",
        message: `${quantidadeSelecionada} modulo${quantidadeSelecionada > 1 ? "s excluidos" : " excluido"} com sucesso.`
      });
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }

      setMensagemFormularioModulo({
        tone: "error",
        message: err.message || "Nao foi possivel excluir os modulos selecionados agora."
      });
      onRefresh();
    } finally {
      setSalvandoModulo(false);
    }
  }

  function renderSelecaoModulo(modulo) {
    return (
      <label className="table-select-cell">
        <input
          aria-label={`Selecionar modulo ${modulo.titulo}`}
          checked={modulosSelecionados.has(modulo.id)}
          className="table-select-input"
          disabled={salvandoModulo}
          onChange={() => alternarModulo(modulo)}
          type="checkbox"
        />
      </label>
    );
  }

  function renderBarraAcoesModulos() {
    return (
      <div className="table-toolbar table-toolbar--matriculas">
        <div className="table-actions table-actions--bulk">
          <label className="table-bulk-toggle">
            <input
              checked={todosModulosSelecionados}
              className="table-select-input"
              disabled={salvandoModulo || !linhasModulos.length}
              onChange={alternarTodosModulos}
              type="checkbox"
            />
            <span>Selecionar todos</span>
          </label>
          <button
            className="table-action"
            disabled={salvandoModulo || quantidadeSelecionada !== 1}
            onClick={editarSelecionado}
            type="button"
          >
            Editar selecionado
          </button>
          <button
            className="table-action table-action--danger"
            disabled={salvandoModulo || quantidadeSelecionada === 0}
            onClick={excluirSelecionados}
            type="button"
          >
            Excluir selecionados
          </button>
        </div>
        <p className="table-toolbar__summary">
          {quantidadeSelecionada
            ? `${quantidadeSelecionada} selecionado${quantidadeSelecionada > 1 ? "s" : ""}`
            : `${linhasModulos.length} modulo${linhasModulos.length === 1 ? "" : "s"}`}
        </p>
      </div>
    );
  }

  return (
    <div className="panel-grid panel-grid--stacked">
      <PanelCard
        description="Crie e mantenha a estrutura modular dos cursos antes de ligar conteudos e avaliacoes."
        title={moduloEmEdicaoId ? "Editar modulo" : "Novo modulo"}
      >
        <form className="management-form" onSubmit={salvarModulo}>
          <div className="management-form__grid">
            <label className="management-field">
              <span>Curso</span>
              <select
                disabled={salvandoModulo || moduloEmEdicaoId !== null || !cursosOrdenados.length}
                name="cursoId"
                onChange={atualizarCampoFormularioModulo}
                value={dadosFormularioModulo.cursoId}
              >
                {!cursosOrdenados.length ? <option value="">Nenhum curso disponivel</option> : null}
                {cursosOrdenados.map((curso) => (
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
                disabled={salvandoModulo}
                maxLength={150}
                name="titulo"
                onChange={atualizarCampoFormularioModulo}
                placeholder="Ex.: Fundamentos de Programacao"
                type="text"
                value={dadosFormularioModulo.titulo}
              />
            </label>
          </div>

          {moduloEmEdicaoId ? (
            <p className="management-form__hint">
              O curso fica travado durante a edicao porque a API atual permite atualizar apenas o titulo do modulo.
            </p>
          ) : null}

          {mensagemFormularioModulo.message ? (
            <InlineMessage tone={mensagemFormularioModulo.tone}>{mensagemFormularioModulo.message}</InlineMessage>
          ) : null}

          <div className="management-form__actions">
            <button className="solid-button" disabled={salvandoModulo || !cursosOrdenados.length} type="submit">
              {salvandoModulo ? "Salvando..." : moduloEmEdicaoId ? "Salvar alteracoes" : "Criar modulo"}
            </button>

            <button className="button button--secondary" disabled={salvandoModulo} onClick={limparFormularioModulo} type="button">
              {moduloEmEdicaoId ? "Cancelar edicao" : "Limpar campos"}
            </button>
          </div>
        </form>
      </PanelCard>

      <PanelCard
        description="Lista consolidada dos modulos cadastrados, com vinculo direto ao curso correspondente."
        title="Modulos cadastrados"
      >
        {renderBarraAcoesModulos()}
        <DataTable
          columns={[
            { key: "selecionar", label: "Selecionar", render: renderSelecaoModulo },
            { key: "titulo", label: "Modulo" },
            {
              key: "cursoId",
              label: "Curso",
              render: (row) => cursoPorId.get(row.cursoId)?.titulo || `Curso #${row.cursoId}`
            },
            { key: "dataCriacao", label: "Criado em", render: (row) => formatDate(row.dataCriacao) }
          ]}
          emptyMessage="Nenhum modulo cadastrado ainda."
          rows={linhasModulos}
        />
      </PanelCard>
    </div>
  );
}
