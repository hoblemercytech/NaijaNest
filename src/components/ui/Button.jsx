/**
 * variant: primary | money | outline | ghost | danger
 * `money` (gold) is reserved for withdrawal and payment-recording actions.
 */
export default function Button({
  variant = 'primary',
  size,
  block,
  loading = false,
  disabled,
  children,
  type = 'button',
  ...rest
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    block ? 'btn-block' : '',
    loading ? 'is-loading' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      <span className={loading ? 'btn-content btn-content-hidden' : 'btn-content'}>
        {children}
      </span>
    </button>
  );
}
