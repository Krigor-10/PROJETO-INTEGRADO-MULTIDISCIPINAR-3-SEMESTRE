import { useEffect, useState } from "react";
import FeaturedCoursesCarousel from "../components/FeaturedCoursesCarousel.jsx";
import GlobalHeader from "../components/GlobalHeader.jsx";
import { InlineMessage, RouteLink } from "../components/Primitives.jsx";
import { CURATED_COURSES, PUBLIC_PILLARS, PUBLIC_SUPPORT_CARDS } from "../data/appConfig.js";
import { apiRequest } from "../lib/api.js";

export default function PublicHome({ hasSession, isDemoMode, onNavigate }) {
  const [courses, setCourses] = useState(CURATED_COURSES);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCourses() {
      try {
        const response = await apiRequest("/Cursos");
        if (ignore) {
          return;
        }

        if (Array.isArray(response) && response.length > 0) {
          setCourses(response);
        }

        setStatus("ready");
      } catch (err) {
        if (ignore) {
          return;
        }

        setError(err.message || "Nao foi possivel carregar o catalogo agora.");
        setStatus("ready");
      }
    }

    loadCourses();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="marketing-shell">
      <div className="marketing-backdrop" />
      <GlobalHeader hasSession={hasSession} isDemoMode={isDemoMode} onNavigate={onNavigate} />

      <main className="marketing-main">
        <section className="hero-grid">
          <article className="hero-copy">
            <span className="eyebrow">React + ASP.NET Core</span>
            <h1>Uma frente unica para conhecer, entrar e acompanhar a jornada academica.</h1>
            <p>
              A home publica, o cadastro e o painel agora vivem no mesmo app React,
              consumindo a API real e prontos para evoluir sem voltar ao HTML estatico.
            </p>

            {isDemoMode ? (
              <InlineMessage tone="info">
                Modo apresentacao ativo: cursos, login, cadastro e painel podem rodar localmente para a demonstracao.
              </InlineMessage>
            ) : null}

            <div className="hero-actions">
              <button
                className="solid-button"
                type="button"
                onClick={() => onNavigate(hasSession ? "/app" : "/login")}
              >
                {hasSession ? "Ir para o painel" : "Entrar agora"}
              </button>

              <button className="button button--secondary" type="button" onClick={() => onNavigate("/cadastro")}>
                Solicitar matricula
              </button>
            </div>

            <div className="signal-grid">
              {PUBLIC_PILLARS.map((pillar) => (
                <article className="signal-card" key={pillar.title}>
                  <strong>{pillar.title}</strong>
                  <p>{pillar.text}</p>
                </article>
              ))}
            </div>
          </article>

          <aside className="hero-stage" aria-label="Resumo do produto">
            <div className="hero-orbit" />

            <div className="hero-card-stack">
              <article className="hero-card hero-card--accent">
                <span className="eyebrow">Home publica</span>
                <h2>Capte interesse antes do login</h2>
                <p>O catalogo conversa com a API e prepara a entrada do aluno sem trocar de plataforma.</p>
              </article>

              <article className="hero-card">
                <span className="eyebrow">Fluxo autenticado</span>
                <h3>Painel por perfil</h3>
                <p>Admin, coordenador, professor e aluno recebem secoes coerentes com o papel de cada um.</p>
              </article>
            </div>
          </aside>
        </section>

        <section className="content-section" id="catalogo">
          <div className="section-head">
            <div>
              <span className="eyebrow">Catalogo conectado</span>
              <h2>Vitrine de cursos ligada direto na API</h2>
            </div>
            <p>
              {status === "loading"
                ? "Lendo o catalogo..."
                : "Use as setas ou deslize na horizontal para percorrer os cursos."}
            </p>
          </div>

          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

          <FeaturedCoursesCarousel courses={courses} onNavigate={onNavigate} />
        </section>

        <section className="content-section" id="jornada">
          <div className="section-head">
            <div>
              <span className="eyebrow">Da visita ao acesso</span>
              <h2>Uma jornada simples de explicar e facil de expandir</h2>
            </div>
          </div>

          <div className="signal-grid signal-grid--journey">
            <article className="signal-card">
              <strong>1. Descoberta</strong>
              <p>O visitante enxerga cursos, proposta e caminhos principais sem sair da aplicacao.</p>
            </article>
            <article className="signal-card">
              <strong>2. Cadastro</strong>
              <p>O formulario React envia a solicitacao completa de matricula com validacao de dados.</p>
            </article>
            <article className="signal-card">
              <strong>3. Painel</strong>
              <p>Depois do login, o usuario entra em um workspace montado a partir do proprio perfil.</p>
            </article>
          </div>
        </section>

        <section className="cta-band" id="painel">
          <div>
            <span className="eyebrow">Acesso unificado</span>
            <h2>Uma unica navegacao para descobrir cursos, criar conta e voltar ao painel.</h2>
          </div>

          <div className="cta-band__actions">
            <button
              className="solid-button solid-button--light"
              type="button"
              onClick={() => onNavigate(hasSession ? "/app" : "/login")}
            >
              {hasSession ? "Voltar ao painel" : "Entrar na plataforma"}
            </button>

            <button className="button button--secondary button--light" type="button" onClick={() => onNavigate("/cadastro")}>
              Abrir cadastro
            </button>
          </div>
        </section>

        <section className="content-section" id="ajuda">
          <div className="section-head">
            <div>
              <span className="eyebrow">Ajuda para decidir</span>
              <h2>Atalhos certos para cada momento da jornada</h2>
            </div>
            <p>A barra global aponta o caminho, e esta area fecha as proximas acoes mais comuns.</p>
          </div>

          <div className="support-grid">
            {PUBLIC_SUPPORT_CARDS.map((card) => (
              <article className="support-card" key={card.title}>
                <span className="chip">Ajuda</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                {card.actionType === "route" ? (
                  <RouteLink className="button button--secondary support-card__action" onNavigate={onNavigate} to={card.actionTarget}>
                    {card.actionLabel}
                  </RouteLink>
                ) : (
                  <a className="button button--secondary support-card__action" href={card.actionTarget}>
                    {card.actionLabel}
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer-bar">
        <div className="footer-brand">
          <span className="footer-brand__copy">
            <span className="footer-brand__wordmark" aria-label="CodeRyse">
              <span className="footer-brand__wordmark-code">Code</span>
              <span className="footer-brand__wordmark-rise">Ryse</span>
            </span>
            <span className="footer-brand__subtitle">Academy</span>
          </span>
        </div>
        <span>Frontend unificado servido pelo ASP.NET Core</span>
      </footer>
    </div>
  );
}
