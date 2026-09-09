export function Card({ large, className = '', children, ...rest }) {
  return (
    <section className={`card${large ? ' card-lg' : ''} ${className}`.trim()} {...rest}>
      {children}
    </section>
  );
}

export function CardHead({ title, action, children }) {
  return (
    <header className="card-head">
      <div>
        {title && <h2>{title}</h2>}
        {children}
      </div>
      {action}
    </header>
  );
}

/** Quiet secondary metric. The balance panel is deliberately not one of these. */
export function Stat({ label, value, foot }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value num">{value}</div>
      {foot && <div className="xs muted" style={{ marginTop: 2 }}>{foot}</div>}
    </div>
  );
}