export default function NotFoundScreen({ onNavigate }) {
  return (
    <div className="route-gate">
      <div className="marketing-backdrop" />
      <section className="route-gate__card">
        <span className="eyebrow">Rota nao encontrada</span>
        <h1>Essa pagina nao existe no novo frontend.</h1>
        <p>A migracao para React concentra as rotas principais em `/`, `/login`, `/cadastro` e `/app`.</p>
        <button className="solid-button" type="button" onClick={() => onNavigate("/")}>
          Voltar para a home
        </button>
      </section>
    </div>
  );
}
