import { useEffect, useState } from "react";
import { RouteGate } from "./components/Primitives.jsx";
import CadastroScreen from "./pages/CadastroScreen.jsx";
import LoginScreen from "./pages/LoginScreen.jsx";
import NotFoundScreen from "./pages/NotFoundScreen.jsx";
import PublicHome from "./pages/PublicHome.jsx";
import WorkspaceScreen from "./pages/WorkspaceScreen.jsx";
import { createDemoSession, disableDemoMode, enableDemoMode, isDemoModeLocked, readDemoMode } from "./lib/demoMode.js";
import { navigate, readRoute } from "./lib/router.js";
import { clearSession, persistSession, readSession } from "./lib/session.js";

export default function App() {
  const [route, setRoute] = useState(() => readRoute());
  const [session, setSession] = useState(() => readSession());
  const [isDemoMode, setIsDemoMode] = useState(() => readDemoMode());
  const canDisableDemoMode = !isDemoModeLocked();

  useEffect(() => {
    function syncRoute() {
      setRoute(readRoute());
    }

    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    if (route.kind === "app" && !session.user) {
      navigate("/login", setRoute, { replace: true });
    }
  }, [route.kind, session.user]);

  useEffect(() => {
    if (session.user && (route.kind === "login" || route.kind === "cadastro")) {
      navigate("/app", setRoute, { replace: true });
    }
  }, [route.kind, session.user]);

  function handleNavigate(path, options) {
    navigate(path, setRoute, options);
  }

  function handleSessionStart(nextSession) {
    persistSession(nextSession);
    setSession(nextSession);
    handleNavigate("/app", { replace: true });
  }

  function handleDemoSessionStart(accountKey) {
    enableDemoMode();
    setIsDemoMode(true);
    handleSessionStart(createDemoSession(accountKey));
  }

  function handleDemoModeExit(nextPath = "/login") {
    clearSession();
    setSession({ token: "", user: null });
    setIsDemoMode(disableDemoMode());
    handleNavigate(nextPath, { replace: true });
  }

  function handleLogout(nextPath = "/") {
    clearSession();
    setSession({ token: "", user: null });
    handleNavigate(nextPath, { replace: true });
  }

  if (route.kind === "app" && !session.user) {
    return <RouteGate title="Preparando o acesso" text="Abrindo a tela de login da EdTech." />;
  }

  if (session.user && (route.kind === "login" || route.kind === "cadastro")) {
    return <RouteGate title="Voltando ao painel" text="Sua sessao ja esta ativa no ambiente React." />;
  }

  if (route.kind === "login") {
    return (
      <LoginScreen
        canDisableDemoMode={canDisableDemoMode}
        isDemoMode={isDemoMode}
        onDemoModeExit={handleDemoModeExit}
        onDemoSessionStart={handleDemoSessionStart}
        onNavigate={handleNavigate}
        onSessionStart={handleSessionStart}
      />
    );
  }

  if (route.kind === "cadastro") {
    return <CadastroScreen isDemoMode={isDemoMode} onNavigate={handleNavigate} />;
  }

  if (route.kind === "app" && session.user) {
    return (
      <WorkspaceScreen
        canDisableDemoMode={canDisableDemoMode}
        isDemoMode={isDemoMode}
        onDemoModeExit={handleDemoModeExit}
        route={route}
        usuario={session.user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onSessionExpired={() => handleLogout("/login")}
      />
    );
  }

  if (route.kind === "notfound") {
    return <NotFoundScreen onNavigate={handleNavigate} />;
  }

  return <PublicHome hasSession={Boolean(session.user)} isDemoMode={isDemoMode} onNavigate={handleNavigate} />;
}
