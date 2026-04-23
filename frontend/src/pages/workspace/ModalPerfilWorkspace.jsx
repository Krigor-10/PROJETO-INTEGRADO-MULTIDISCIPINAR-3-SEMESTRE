import { MiniList } from "../../components/Primitives.jsx";

export function ModalPerfilWorkspace({
  itensCursos,
  fatos,
  destaques,
  ehAluno,
  aoFechar,
  perfil,
  iniciaisUsuario,
  nomeUsuario
}) {
  return (
    <div className="profile-modal" onClick={aoFechar} role="presentation">
      <div
        aria-labelledby="profile-modal-title"
        aria-modal="true"
        className="profile-modal__card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="profile-modal__hero">
          <span className="profile-modal__avatar" aria-hidden="true">
            {iniciaisUsuario}
          </span>

          <div className="profile-modal__hero-copy">
            <span className="eyebrow">{ehAluno ? "Perfil do aluno" : "Perfil da sessao"}</span>
            <h2 id="profile-modal-title">{nomeUsuario}</h2>
            <p>
              {ehAluno
                ? "Consulte seus dados principais e um resumo rapido da sua jornada academica."
                : `Resumo do seu acesso atual como ${perfil}.`}
            </p>
          </div>

          <button className="profile-modal__close" onClick={aoFechar} type="button">
            Fechar
          </button>
        </header>

        <div className="profile-modal__content">
          <section className="profile-modal__section">
            <h3>Dados principais</h3>
            <dl className="profile-modal__facts">
              {fatos.map((fato) => (
                <div className="profile-modal__fact" key={fato.label}>
                  <dt>{fato.label}</dt>
                  <dd>{fato.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="profile-modal__section">
            <h3>{ehAluno ? "Resumo academico" : "Resumo atual"}</h3>
            <div className="profile-modal__chips">
              {destaques.map((item) => (
                <span className="chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </section>

          {ehAluno ? (
            <section className="profile-modal__section">
              <h3>Cursos com matricula aprovada</h3>
              <MiniList
                emptyMessage="Assim que suas matriculas forem aprovadas, elas aparecerao aqui."
                items={itensCursos}
              />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
