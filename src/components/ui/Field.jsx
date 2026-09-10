
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
  const autoId = useId();
  const fieldId = id || autoId;

  const describedBy = error
    ? `${fieldId}-err`
    : hint
      ? `${fieldId}-hint`
      : undefined;

  return (
    <div className={`field ${error ? 'field-has-error' : ''}`}>
      {label && (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      )}

      <div
        className={[
          'field-control',
          icon ? 'has-icon' : '',
          endAdornment ? 'has-end-adornment' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {icon && (
          <span className="field-icon" aria-hidden="true">
            {icon}
          </span>
        )}

        <input
          {...rest}
          id={fieldId}
          className={`field-input ${inputClassName}`.trim()}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
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
        <p className="field-error" id={`${fieldId}-err`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Select({
  label,
  error,
  hint,
  children,
  id,
  ...rest
}) {
  const autoId = useId();
  const fieldId = id || autoId;

  const describedBy = error
    ? `${fieldId}-err`
    : hint
      ? `${fieldId}-hint`
      : undefined;

  return (
    <div className={`field ${error ? 'field-has-error' : ''}`}>
      {label && (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      )}

      <select
        {...rest}
        id={fieldId}
        className="field-input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
      >
        {children}
      </select>

      {hint && !error && (
        <p className="field-hint" id={`${fieldId}-hint`}>
          {hint}
        </p>
      )}

      {error && (
        <p className="field-error" id={`${fieldId}-err`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  hint,
  id,
  ...rest
}) {
  const autoId = useId();
  const fieldId = id || autoId;

  const describedBy = error
    ? `${fieldId}-err`
    : hint
      ? `${fieldId}-hint`
      : undefined;

  return (
    <div className={`field ${error ? 'field-has-error' : ''}`}>
      {label && (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      )}

      <textarea
        {...rest}
        id={fieldId}
        className="field-input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
      />

      {hint && !error && (
        <p className="field-hint" id={`${fieldId}-hint`}>
          {hint}
        </p>
      )}

      {error && (
        <p className="field-error" id={`${fieldId}-err`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
