const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** ₦25,000 — kobo are dropped because every plan is a whole-naira amount. */
export function money(value) {
  const n = Number(value ?? 0);
  return naira.format(Number.isFinite(n) ? n : 0);
}

/** Compact form for chart axes only, where space is genuinely tight. */
export function moneyShort(value) {
  const n = Number(value ?? 0);
  if (Math.abs(n) >= 1000000) return `₦${(n / 1000000).toFixed(1)}m`;
  if (Math.abs(n) >= 1000) return `₦${Math.round(n / 1000)}k`;
  return `₦${n}`;
}

export function shortDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function dayMonth(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export function timeOnly(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-NG', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export function dateTime(value) {
  if (!value) return '—';
  return `${shortDate(value)}, ${timeOnly(value)}`;
}

/** "2h ago" for the notification feed. */
export function relative(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return shortDate(value);
}

/** Local yyyy-mm-dd, for <input type="date"> round-trips. */
export function isoDate(date = new Date()) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** Local value for <input type="datetime-local">. */
export function isoDateTime(date = new Date()) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase() || '?';
}