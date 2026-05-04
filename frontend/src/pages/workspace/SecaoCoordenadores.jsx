import { useEffect, useMemo, useState } from "react";
import { DataTable, InlineMessage, PanelCard, StatusPill } from "../../components/Primitives.jsx";
import { ApiError, apiRequest } from "../../lib/api.js";
import { formatCep, onlyDigits } from "../../lib/format.js";

const ESTADO_INICIAL_FORMULARIO_COORDENADOR = {
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
  cursoResponsavel: "",
  senha: "",
  confirmarSenha: ""
};

function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SecaoCoordenadores({ coordenadores = [], cursos = [], onRefresh, onSessionExpired }) {
  const [buscaCoordenador, setBuscaCoordenador] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [formularioCoordenadorAberto, setFormularioCoordenadorAberto] = useState(false);
  const [coordenadorCursosSelecionado, setCoordenadorCursosSelecionado] = useState(null);
  const [dadosFormularioCoordenador, setDadosFormularioCoordenador] = useState(ESTADO_INICIAL_FORMULARIO_COORDENADOR);
  const [mensagemFormularioCoordenador, setMensagemFormularioCoordenador] = useState({ tone: "", message: "" });
  const [mensagemTabelaCoordenador, setMensagemTabelaCoordenador] = useState({ tone: "", message: "" });
  const [salvandoCoordenador, setSalvandoCoordenador] = useState(false);
  const termoBusca = useMemo(() => normalizarBusca(buscaCoordenador), [buscaCoordenador]);

  const cursosPorCoordenador = useMemo(() => {
    const cursosMapeados = new Map();

    cursos.forEach((curso) => {
      const coordenadorId = Number(curso.coordenadorId);

      if (!coordenadorId) {
        return;
      }

      if (!cursosMapeados.has(coordenadorId)) {
        cursosMapeados.set(coordenadorId, []);
      }

      cursosMapeados.get(coordenadorId).push(curso);
    });

    cursosMapeados.forEach((listaCursos) => {
      listaCursos.sort((left, right) => String(left.titulo || "").localeCompare(String(right.titulo || ""), "pt-BR"));
    });

    return cursosMapeados;
  }, [cursos]);

  const coordenadoresFiltrados = useMemo(() => {
    let proximosCoordenadores = coordenadores;

    if (filtroStatus === "ativos") {
      proximosCoordenadores = proximosCoordenadores.filter((coordenador) => coordenador.ativo);
    } else if (filtroStatus === "inativos") {
      proximosCoordenadores = proximosCoordenadores.filter((coordenador) => !coordenador.ativo);
    }

    if (!termoBusca) {
      return proximosCoordenadores;
    }

    return proximosCoordenadores.filter((coordenador) => {
      const cursosSupervisionados = obterCursosDoCoordenador(coordenador);
      const status = coordenador.ativo ? "Ativo" : "Inativo";
      const campos = [
        coordenador.codigoRegistro,
        coordenador.nome,
        coordenador.email,
        coordenador.cursoResponsavel,
        status,
        ...cursosSupervisionados.map((curso) => curso.titulo)
      ];

      return campos.some((campo) => normalizarBusca(campo).includes(termoBusca));
    });
  }, [coordenadores, filtroStatus, termoBusca]);

  const temFiltroAtivo = Boolean(termoBusca || filtroStatus !== "todos");

  useEffect(() => {
    if (!formularioCoordenadorAberto && !coordenadorCursosSelecionado) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key !== "Escape") {
        return;
      }

      if (coordenadorCursosSelecionado) {
        fecharCursosCoordenador();
        return;
      }

      if (!salvandoCoordenador) {
        fecharFormularioCoordenador();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [formularioCoordenadorAberto, coordenadorCursosSelecionado, salvandoCoordenador]);

  function limparFiltros() {
    setBuscaCoordenador("");
    setFiltroStatus("todos");
  }

  function abrirFormularioCoordenador() {
    setDadosFormularioCoordenador(ESTADO_INICIAL_FORMULARIO_COORDENADOR);
    setMensagemFormularioCoordenador({ tone: "", message: "" });
    setMensagemTabelaCoordenador({ tone: "", message: "" });
    setFormularioCoordenadorAberto(true);
  }

  function fecharFormularioCoordenador() {
    if (salvandoCoordenador) {
      return;
    }

    setFormularioCoordenadorAberto(false);
    setMensagemFormularioCoordenador({ tone: "", message: "" });
  }

  function obterCursosDoCoordenador(coordenador) {
    return cursosPorCoordenador.get(Number(coordenador.id)) || [];
  }

  function obterCursoPrincipal(coordenador) {
    const cursosSupervisionados = obterCursosDoCoordenador(coordenador);

    if (cursosSupervisionados.length) {
      return cursosSupervisionados[0].titulo;
    }

    return String(coordenador.cursoResponsavel || "").trim();
  }

  function abrirCursosCoordenador(coordenador) {
    const cursosSupervisionados = obterCursosDoCoordenador(coordenador);

    if (cursosSupervisionados.length <= 1) {
      return;
    }

    setCoordenadorCursosSelecionado({
      coordenador,
      cursos: cursosSupervisionados
    });
  }

  function fecharCursosCoordenador() {
    setCoordenadorCursosSelecionado(null);
  }

  function atualizarCampoFormularioCoordenador(event) {
    const { name, value } = event.target;

    setDadosFormularioCoordenador((current) => ({
      ...current,
      [name]: value
    }));
  }

  function validarFormularioCoordenador() {
    const camposObrigatorios = [
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
      "senha",
      "confirmarSenha"
    ];
    const campoVazio = camposObrigatorios.find((campo) => !String(dadosFormularioCoordenador[campo] || "").trim());

    if (campoVazio) {
      return "Preencha todos os campos obrigatorios para cadastrar a coordenacao.";
    }

    if (onlyDigits(dadosFormularioCoordenador.cpf).length !== 11) {
      return "Informe um CPF com 11 digitos.";
    }

    if (onlyDigits(dadosFormularioCoordenador.cep).length !== 8) {
      return "Informe um CEP com 8 digitos.";
    }

    if (dadosFormularioCoordenador.estado.trim().length !== 2) {
      return "Informe a UF com 2 letras.";
    }

    if (dadosFormularioCoordenador.senha.length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (dadosFormularioCoordenador.senha !== dadosFormularioCoordenador.confirmarSenha) {
      return "As senhas nao coincidem.";
    }

    return "";
  }

  async function salvarCoordenador(event) {
    event.preventDefault();

    const erroValidacao = validarFormularioCoordenador();
    if (erroValidacao) {
      setMensagemFormularioCoordenador({ tone: "error", message: erroValidacao });
      return;
    }

    setSalvandoCoordenador(true);
    setMensagemFormularioCoordenador({ tone: "", message: "" });

    try {
      await apiRequest("/Coordenadores", {
        method: "POST",
        body: JSON.stringify({
          nome: dadosFormularioCoordenador.nome.trim(),
          email: dadosFormularioCoordenador.email.trim(),
          cpf: onlyDigits(dadosFormularioCoordenador.cpf),
          telefone: dadosFormularioCoordenador.telefone.trim(),
          cep: formatCep(onlyDigits(dadosFormularioCoordenador.cep)),
          rua: dadosFormularioCoordenador.rua.trim(),
          numero: dadosFormularioCoordenador.numero.trim(),
          bairro: dadosFormularioCoordenador.bairro.trim(),
          cidade: dadosFormularioCoordenador.cidade.trim(),
          estado: dadosFormularioCoordenador.estado.trim().toUpperCase(),
          cursoResponsavel: dadosFormularioCoordenador.cursoResponsavel.trim() || null,
          senha: dadosFormularioCoordenador.senha,
          ativo: true
        })
      });

      setDadosFormularioCoordenador(ESTADO_INICIAL_FORMULARIO_COORDENADOR);
      setFormularioCoordenadorAberto(false);
      setMensagemTabelaCoordenador({ tone: "success", message: "Coordenacao cadastrada com sucesso." });
      onRefresh?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired?.();
        return;
      }

      setMensagemFormularioCoordenador({
        tone: "error",
        message: err.message || "Nao foi possivel cadastrar a coordenacao agora."
      });
    } finally {
      setSalvandoCoordenador(false);
    }
  }

  function renderFormularioCoordenador() {
    if (!formularioCoordenadorAberto) {
      return null;
    }

    return (
      <div
        className="content-form-modal"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            fecharFormularioCoordenador();
          }
        }}
      >
        <div aria-label="Cadastrar coordenacao" aria-modal="true" className="content-form-modal__card" role="dialog">
          <button
            className="content-form-modal__close"
            disabled={salvandoCoordenador}
            onClick={fecharFormularioCoordenador}
            type="button"
          >
            Fechar
          </button>

          <PanelCard
            description="Preencha os dados de acesso e identificacao para liberar a coordenacao no workspace."
            title="Cadastrar coordenacao"
          >
            <form className="management-form" onSubmit={salvarCoordenador}>
              <div className="management-form__grid">
                <label className="management-field management-field--wide">
                  <span>Nome</span>
                  <input
                    autoComplete="name"
                    disabled={salvandoCoordenador}
                    maxLength={150}
                    name="nome"
                    onChange={atualizarCampoFormularioCoordenador}
                    placeholder="Nome completo"
                    type="text"
                    value={dadosFormularioCoordenador.nome}
                  />
                </label>

                <label className="management-field">
                  <span>E-mail</span>
                  <input
                    autoComplete="email"
                    disabled={salvandoCoordenador}
                    name="email"
                    onChange={atualizarCampoFormularioCoordenador}
                    placeholder="coordenacao@exemplo.com"
                    type="email"
                    value={dadosFormularioCoordenador.email}
                  />
                </label>

                <label className="management-field">
                  <span>CPF</span>
                  <input
                    autoComplete="off"
                    disabled={salvandoCoordenador}
                    inputMode="numeric"
                    maxLength={14}
                    name="cpf"
                    onChange={atualizarCampoFormularioCoordenador}
                    placeholder="Somente numeros"
                    type="text"
                    value={dadosFormularioCoordenador.cpf}
                  />
                </label>

                <label className="management-field">
                  <span>Telefone</span>
                  <input
                    autoComplete="tel"
                    disabled={salvandoCoordenador}
                    maxLength={20}
                    name="telefone"
                    onChange={atualizarCampoFormularioCoordenador}
                    placeholder="(11) 99999-9999"
                    type="text"
                    value={dadosFormularioCoordenador.telefone}
                  />
                </label>

                <label className="management-field">
                  <span>CEP</span>
                  <input
                    autoComplete="postal-code"
                    disabled={salvandoCoordenador}
                    inputMode="numeric"
                    maxLength={9}
                    name="cep"
                    onChange={atualizarCampoFormularioCoordenador}
                    placeholder="00000-000"
                    type="text"
                    value={dadosFormularioCoordenador.cep}
                  />
                </label>

                <label className="management-field management-field--wide">
                  <span>Rua</span>
                  <input
                    autoComplete="address-line1"
                    disabled={salvandoCoordenador}
                    maxLength={200}
                    name="rua"
                    onChange={atualizarCampoFormularioCoordenador}
                    placeholder="Endereco"
                    type="text"
                    value={dadosFormularioCoordenador.rua}
                  />
                </label>

                <label className="management-field">
                  <span>Numero</span>
                  <input
                    autoComplete="address-line2"
                    disabled={salvandoCoordenador}
                    maxLength={20}
                    name="numero"
                    onChange={atualizarCampoFormularioCoordenador}
                    type="text"
                    value={dadosFormularioCoordenador.numero}
                  />
                </label>

                <label className="management-field">
                  <span>Bairro</span>
                  <input
                    autoComplete="address-level3"
                    disabled={salvandoCoordenador}
                    maxLength={120}
                    name="bairro"
                    onChange={atualizarCampoFormularioCoordenador}
                    type="text"
                    value={dadosFormularioCoordenador.bairro}
                  />
                </label>

                <label className="management-field">
                  <span>Cidade</span>
                  <input
                    autoComplete="address-level2"
                    disabled={salvandoCoordenador}
                    maxLength={120}
                    name="cidade"
                    onChange={atualizarCampoFormularioCoordenador}
                    type="text"
                    value={dadosFormularioCoordenador.cidade}
                  />
                </label>

                <label className="management-field">
                  <span>UF</span>
                  <input
                    autoComplete="address-level1"
                    disabled={salvandoCoordenador}
                    maxLength={2}
                    name="estado"
                    onChange={atualizarCampoFormularioCoordenador}
                    placeholder="SP"
                    type="text"
                    value={dadosFormularioCoordenador.estado}
                  />
                </label>

                <label className="management-field management-field--wide">
                  <span>Curso sob supervisao</span>
                  <input
                    autoComplete="off"
                    disabled={salvandoCoordenador}
                    maxLength={150}
                    name="cursoResponsavel"
                    onChange={atualizarCampoFormularioCoordenador}
                    placeholder="Ex.: Trilhas EdTech"
                    type="text"
                    value={dadosFormularioCoordenador.cursoResponsavel}
                  />
                </label>

                <label className="management-field">
                  <span>Senha</span>
                  <input
                    autoComplete="new-password"
                    disabled={salvandoCoordenador}
                    minLength={6}
                    name="senha"
                    onChange={atualizarCampoFormularioCoordenador}
                    type="password"
                    value={dadosFormularioCoordenador.senha}
                  />
                </label>

                <label className="management-field">
                  <span>Confirmar senha</span>
                  <input
                    autoComplete="new-password"
                    disabled={salvandoCoordenador}
                    minLength={6}
                    name="confirmarSenha"
                    onChange={atualizarCampoFormularioCoordenador}
                    type="password"
                    value={dadosFormularioCoordenador.confirmarSenha}
                  />
                </label>
              </div>

              {mensagemFormularioCoordenador.message ? (
                <InlineMessage tone={mensagemFormularioCoordenador.tone}>{mensagemFormularioCoordenador.message}</InlineMessage>
              ) : null}

              <div className="management-form__actions">
                <button className="solid-button professor-create-button" disabled={salvandoCoordenador} type="submit">
                  {salvandoCoordenador ? "Salvando..." : "Cadastrar coordenacao"}
                </button>

                <button
                  className="button button--secondary exit-button"
                  disabled={salvandoCoordenador}
                  onClick={fecharFormularioCoordenador}
                  type="button"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </PanelCard>
        </div>
      </div>
    );
  }

  function renderCursoSupervisao(coordenador) {
    const cursoPrincipal = obterCursoPrincipal(coordenador);
    const cursosSupervisionados = obterCursosDoCoordenador(coordenador);

    if (!cursoPrincipal) {
      return <span className="table-muted">Sem curso</span>;
    }

    return (
      <div className="course-preview-cell">
        <span className="course-preview-cell__name">{cursoPrincipal}</span>
        {cursosSupervisionados.length > 1 ? (
          <button
            aria-label={`Ver todos os cursos de ${coordenador.nome}`}
            className="course-preview-cell__more"
            onClick={() => abrirCursosCoordenador(coordenador)}
            title="Ver cursos"
            type="button"
          >
            +
          </button>
        ) : null}
      </div>
    );
  }

  function renderCursosCoordenadorPopup() {
    if (!coordenadorCursosSelecionado) {
      return null;
    }

    return (
      <div
        className="content-form-modal"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            fecharCursosCoordenador();
          }
        }}
      >
        <div
          aria-label={`Cursos sob supervisao de ${coordenadorCursosSelecionado.coordenador.nome}`}
          aria-modal="true"
          className="content-form-modal__card content-form-modal__card--compact"
          role="dialog"
        >
          <button className="content-form-modal__close" onClick={fecharCursosCoordenador} type="button">
            Fechar
          </button>

          <PanelCard description={coordenadorCursosSelecionado.coordenador.nome} title="Cursos sob supervisao">
            <ul className="coordinator-course-list">
              {coordenadorCursosSelecionado.cursos.map((curso) => (
                <li key={curso.id}>{curso.titulo}</li>
              ))}
            </ul>
          </PanelCard>
        </div>
      </div>
    );
  }

  return (
    <PanelCard description="Coordenadores cadastrados para supervisao dos cursos ativos." title="Coordenadores cadastrados">
      {renderFormularioCoordenador()}
      {renderCursosCoordenadorPopup()}

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
              aria-label="Buscar coordenadores"
              className="table-inline-input table-inline-input--search"
              onChange={(event) => setBuscaCoordenador(event.target.value)}
              placeholder="Pesquisar coordenadores"
              type="search"
              value={buscaCoordenador}
            />
          </label>
          <select
            aria-label="Filtrar coordenadores por status"
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
        <div className="table-actions">
          <button
            className="solid-button professor-create-button"
            disabled={salvandoCoordenador}
            onClick={abrirFormularioCoordenador}
            type="button"
          >
            Cadastrar coordenacao
          </button>
        </div>
        <p className="table-toolbar__summary">
          {coordenadoresFiltrados.length} de {coordenadores.length} coordenador{coordenadores.length === 1 ? "" : "es"}
        </p>
      </div>

      {mensagemTabelaCoordenador.message ? (
        <InlineMessage tone={mensagemTabelaCoordenador.tone}>{mensagemTabelaCoordenador.message}</InlineMessage>
      ) : null}

      <DataTable
        columns={[
          {
            key: "codigoRegistro",
            label: "REGISTRO DO COORDENADOR",
            render: (coordenador) => coordenador.codigoRegistro || "Sem registro"
          },
          { key: "nome", label: "NOME" },
          { key: "email", label: "EMAIL" },
          {
            key: "cursoSupervisao",
            label: "CURSO SOB SUPERVISAO",
            render: renderCursoSupervisao
          },
          {
            key: "ativo",
            label: "STATUS",
            render: (coordenador) => (
              <StatusPill tone={coordenador.ativo ? "success" : "danger"}>
                {coordenador.ativo ? "Ativo" : "Inativo"}
              </StatusPill>
            )
          }
        ]}
        emptyMessage="Nenhum coordenador encontrado."
        rows={coordenadoresFiltrados}
      />
    </PanelCard>
  );
}
