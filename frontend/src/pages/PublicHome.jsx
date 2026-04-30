import { useEffect, useState } from "react";
import FeaturedCoursesCarousel from "../components/FeaturedCoursesCarousel.jsx";
import GlobalHeader from "../components/GlobalHeader.jsx";
import { InlineMessage, RouteLink } from "../components/Primitives.jsx";
import { CURATED_COURSES, PUBLIC_PILLARS, PUBLIC_SUPPORT_CARDS } from "../data/appConfig.js";
import { apiRequest } from "../lib/api.js";

const HIDDEN_PUBLIC_COURSE_TITLES = new Set(["product analytics para edtech"]);

export default function PublicHome({ hasSession, isDemoMode, onNavigate }) {
  const [courses, setCourses] = useState(() => filterPublicCourses(CURATED_COURSES));
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

        const publicCourses = filterPublicCourses(response);
        if (publicCourses.length > 0) {
          setCourses(publicCourses);
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
        <section className="public-hero" aria-labelledby="public-hero-title">
          <div className="public-hero__scene" aria-hidden="true" />

          <article className="public-hero__content">
            <span className="eyebrow">Cursos digitais com acompanhamento academico</span>
            <h1 id="public-hero-title">CodeRyse Academy</h1>
            <p>
              Descubra cursos, solicite matricula e acompanhe sua jornada em uma plataforma
              pensada para alunos que querem aprender fazendo.
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
                onClick={() => onNavigate("/cadastro")}
              >
                Solicitar matricula
              </button>

              <button className="button button--secondary" type="button" onClick={() => onNavigate(hasSession ? "/app" : "/login")}>
                {hasSession ? "Ir para o painel" : "Entrar"}
              </button>
            </div>

            <dl className="public-hero__metrics" aria-label="Resumo da plataforma">
              <div>
                <dt>100%</dt>
                <dd>fluxo online</dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="public-proof" aria-label="Diferenciais da plataforma">
          <div className="signal-grid">
            {PUBLIC_PILLARS.map((pillar) => (
              <article className="signal-card signal-card--quiet" key={pillar.title}>
                <strong>{pillar.title}</strong>
                <p>{pillar.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="catalogo">
          <div className="section-head">
            <div>
              <span className="eyebrow">Catalogo conectado</span>
              <h2>Escolha uma trilha e comece pela matricula</h2>
            </div>
            <p>
              {status === "loading"
                ? "Lendo os cursos publicados..."
                : "Use as setas ou deslize na horizontal para percorrer as opcoes."}
            </p>
          </div>

          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

          <FeaturedCoursesCarousel courses={courses} onNavigate={onNavigate} />
        </section>

        <section className="content-section" id="jornada">
          <div className="section-head">
            <div>
              <span className="eyebrow">Da visita ao acesso</span>
              <h2>Do primeiro interesse ao painel do aluno</h2>
            </div>
          </div>

          <div className="signal-grid signal-grid--journey">
            <article className="signal-card">
              <strong>1. Descoberta</strong>
              <p>O visitante conhece as trilhas, compara opcoes e escolhe o caminho de entrada.</p>
            </article>
            <article className="signal-card">
              <strong>2. Cadastro</strong>
              <p>O formulario envia a solicitacao de matricula com dados completos para analise.</p>
            </article>
            <article className="signal-card">
              <strong>3. Painel</strong>
              <p>Depois do login, o aluno acessa cursos, materiais, avaliacoes e progresso em um so lugar.</p>
            </article>
          </div>
        </section>

        <section className="cta-band" id="painel">
          <div>
            <span className="eyebrow">Acesso unificado</span>
            <h2>Entre para acompanhar sua turma ou envie uma nova solicitacao de matricula.</h2>
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

function filterPublicCourses(courses) {
  if (!Array.isArray(courses)) {
    return [];
  }

  return courses.filter((course) => {
    const title = String(course.titulo || "").trim().toLowerCase();
    return !HIDDEN_PUBLIC_COURSE_TITLES.has(title);
  });
}
