import { useState } from "react";
import { InlineMessage } from "../components/Primitives.jsx";
import { apiRequest } from "../lib/api.js";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../lib/demoMode.js";

export default function LoginScreen({
  canDisableDemoMode,
  isDemoMode,
  onDemoModeExit,
  onDemoSessionStart,
  onNavigate,
  onSessionStart
}) {
  const [form, setForm] = useState({ email: "", senha: "" });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("info");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("pending");
    setTone("info");
    setMessage("Validando suas credenciais...");

    try {
      const response = await apiRequest("/Auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email.trim(),
          senha: form.senha
        })
      });

      setTone("success");
      setMessage("Login concluido. Abrindo o painel...");
      onSessionStart({
        token: response.token,
        user: response.usuario
      });
    } catch (err) {
      setStatus("idle");
      setTone("error");
      setMessage(err.message || "Nao foi possivel entrar agora.");
    }
  }

  return (
    <div className="auth-shell">
      <div className="marketing-backdrop" />

      <main className="auth-stage">
        <section className="auth-card">
          <header className="auth-card__header">
            <button className="back-link" type="button" onClick={() => onNavigate("/")}>
              Voltar para a home
            </button>
            <span className="eyebrow">Acesso autenticado</span>
            <h1>Entrar na EdTech</h1>
            <p>Use seu e-mail e senha para abrir o ambiente conectado a API.</p>
          </header>

          {isDemoMode ? (
            <InlineMessage tone="info">
              Modo apresentacao ativo: este login usa dados locais e nao depende do backend.
            </InlineMessage>
          ) : null}

          <form className="field-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>E-mail</span>
              <input
                autoComplete="email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>

            <label className="field">
              <span>Senha</span>
              <input
                autoComplete="current-password"
                name="senha"
                type="password"
                value={form.senha}
                onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))}
                required
              />
            </label>

            <button className="solid-button solid-button--block" disabled={status === "pending"} type="submit">
              {status === "pending" ? "Entrando..." : "Abrir painel"}
            </button>
          </form>

          {message ? <InlineMessage tone={tone}>{message}</InlineMessage> : null}

          <section className="demo-mode-panel" aria-label="Acesso rapido para demonstracao">
            <div className="demo-mode-panel__copy">
              <span className="eyebrow">Modo apresentacao</span>
              <h2>Entrar com perfis prontos</h2>
              <p>
                Ative a demonstracao e abra o painel com dados locais para mostrar a interface,
                as navegacoes e as principais interacoes do produto.
              </p>
            </div>

            <div className="demo-mode-panel__actions">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  className="button button--secondary demo-entry-button"
                  key={account.key}
                  onClick={() => onDemoSessionStart(account.key)}
                  type="button"
                >
                  <span>{account.label}</span>
                  <small>{account.description}</small>
                </button>
              ))}
            </div>

            <p className="demo-mode-panel__credentials">
              Contas demo: {DEMO_ACCOUNTS.map((account) => account.email).join(" | ")}. Senha unica: {DEMO_PASSWORD}
            </p>

            {isDemoMode && canDisableDemoMode ? (
              <div className="demo-mode-panel__footer">
                <button className="button button--secondary button--compact" onClick={() => onDemoModeExit("/login")} type="button">
                  Voltar ao modo real
                </button>
              </div>
            ) : null}
          </section>

          <footer className="auth-card__footer">
            <span>Ainda nao tem conta?</span>
            <button className="button button--secondary button--compact" type="button" onClick={() => onNavigate("/cadastro")}>
              Solicitar matricula
            </button>
          </footer>
        </section>
      </main>
    </div>
  );
}
