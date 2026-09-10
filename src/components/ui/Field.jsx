import { useId } from 'react';

export function Input({
  label,
  error,
  hint,
  id,
  icon,
  endAdornment,
  inputClassName = '',
  ...rest
}) {
  const auto = useId();
  const fieldId = id || auto;

  return (
    <div className={`field ${error ? 'field-has-error' : ''}`}>
      {label && (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      )}

      <div className={`field-control ${icon ? 'has-icon' : ''} ${endAdornment ? 'has-end-adornment' : ''}`}>
        {icon && (
          <span className="field-icon" aria-hidden="true">
            {icon}
          </span>
        )}

        <input
          id={fieldId}
          className={`field-input ${inputClassName}`.trim()}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined}
          {...rest}
        />

        {endAdornment && (
          <span className="field-end-adornment">
            {endAdornment}
          </span>
        )}
      </div>

      {hint && !error && (
        <p className="field-hint" id={`${fieldId}-hint`}>
          {hint}
        </p>
      )}

      {error && (
        <p className="field-error" id={`${fieldId}-err`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function Select({ label, error, hint, children, id, ...rest }) {
  const auto = useId();
  const fieldId = id || auto;

  return (
    <div className={`field ${error ? 'field-has-error' : ''}`}>
      {label && (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      )}

      <select
        id={fieldId}
        className="field-input"
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      >
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
    <div className={`field ${error ? 'field-has-error' : ''}`}>
      {label && (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      )}

      <textarea
        id={fieldId}
        className="field-input"
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />

      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
