import Button from './Button';

/**
 * Empty screens are an invitation to act, not an apology. Each one names the
 * next step where there is one.
 */
export function EmptyState({ title, message, action, icon = '○' }) {
  return (
    <div className="state">
      <div className="state-icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state-error">
      <div className="state-icon" aria-hidden="true">!</div>
      <h3>Couldn't load this</h3>
      <p>{message || 'The request did not go through.'}</p>
      {onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/** Skeletons match the shape of what's coming so the layout doesn't jump. */
export function SkeletonLines({ count = 3, height = 56 }) {
  return (
    <div className="stack" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export function SkeletonPanel({ height = 168 }) {
  return <div className="skeleton" style={{ height, borderRadius: 'var(--r-panel)' }} aria-hidden="true" />;
}

export function LoadingState({ label = 'Loading' }) {
  return (
    <div className="state">
      <span className="spinner" style={{ color: 'var(--green-600)', width: 22, height: 22 }} />
      <p className="small" style={{ marginTop: 12 }}>{label}</p>
    </div>
  );
}