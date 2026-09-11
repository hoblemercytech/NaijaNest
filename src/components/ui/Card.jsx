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

/**
 * Quiet secondary metric. The balance panel is deliberately not one of these.
 *
 * The icon is a tinted glyph rather than a coloured block: at this size a solid
 * badge competes with the number, which is the thing being read.
 */
export function Stat({ label, value, foot, Icon, tone = 'accent' }) {
  return (
    <div className="stat">
      <div className="stat-head">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span className={`stat-icon is-${tone}`} aria-hidden="true">
            <Icon size={15} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="stat-value num">{value}</div>
      {foot && <div className="xs muted stat-foot">{foot}</div>}
    </div>
  );
}
