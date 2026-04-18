export function RouteLink({ children, className, onNavigate, to }) {
  return (
    <a
      className={className}
      href={to}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }

        event.preventDefault();
        onNavigate(to);
      }}
    >
      {children}
    </a>
  );
}

export function InlineMessage({ children, tone }) {
  return <p className={`inline-message inline-message--${tone}`}>{children}</p>;
}

export function StatusPill({ children, tone }) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>;
}

export function EmptyState({ message }) {
  return <div className="empty-state">{message}</div>;
}

export function PanelCard({ children, description, title }) {
  return (
    <section className="panel-card">
      <header className="panel-card__header">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </header>
      {children ? <div className="panel-card__body">{children}</div> : null}
    </section>
  );
}

export function DataTable({ columns, rows, emptyMessage }) {
  if (!rows.length) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? index}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MiniList({ emptyMessage, items }) {
  if (!items.length) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="mini-list">
      {items.map((item) => (
        <article className="mini-list__item" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <p>{item.meta}</p>
          </div>
          <span className="chip">{item.badge}</span>
        </article>
      ))}
    </div>
  );
}

export function RouteGate({ text, title }) {
  return (
    <div className="route-gate">
      <div className="marketing-backdrop" />
      <section className="route-gate__card">
        <span className="eyebrow">React SPA</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </section>
    </div>
  );
}
