/**
 * Button
 *
 * variant:
 * primary | money | outline | ghost | danger
 *
 * `money` (gold) is reserved for withdrawal and
 * payment-recording actions.
 */

export default function Button({
  variant = 'primary',
  size,
  block = false,
  loading = false,
  disabled = false,
  children,
  type = 'button',
  className = '',
  ...rest
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    block ? 'btn-block' : '',
    loading ? 'is-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...rest}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
    >
      {loading && (
        <span
          className="spinner"
          aria-hidden="true"
        />
      )}

      <span
        className={
          loading
            ? 'btn-content btn-content-hidden'
            : 'btn-content'
        }
      >
        {children}
      </span>
    </button>
  );
}
