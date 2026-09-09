import { useId } from 'react';

export function Input({ label, error, hint, id, ...rest }) {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={fieldId}>{label}</label>}
      <input
        id={fieldId}
        className="field-input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined}
        {...rest}
      />
      {hint && !error && <p className="field-hint" id={`${fieldId}-hint`}>{hint}</p>}
      {error && <p className="field-error" id={`${fieldId}-err`}>{error}</p>}
    </div>
  );
}

export function Select({ label, error, hint, children, id, ...rest }) {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={fieldId}>{label}</label>}
      <select id={fieldId} className="field-input" aria-invalid={error ? 'true' : undefined} {...rest}>
        {children}
      </select>
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, hint, id, ...rest }) {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={fieldId}>{label}</label>}
      <textarea id={fieldId} className="field-input" aria-invalid={error ? 'true' : undefined} {...rest} />
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}