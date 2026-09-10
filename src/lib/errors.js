/**
 * Turns a Supabase/Postgres error into something a customer or collector can
 * act on. Raw database text and constraint names never reach the screen.
 */

const CONSTRAINT_MESSAGES = {
  nn_one_open_cycle_per_user: 'You already have an open contribution cycle.',
  nn_one_open_withdrawal_per_cycle: 'A withdrawal request is already in progress for this cycle.',
  nn_one_paid_withdrawal_per_cycle: 'This cycle has already been paid out.',
  nn_one_active_collector_per_customer: 'This customer already has an active collector.',
  nn_contrib_unique_day: 'That contribution day already exists.',
  nn_plan_amount_unique: 'A plan with that daily amount already exists.',
  profiles_email_key: 'An account with that email already exists.',
};

export function friendlyError(error) {
  if (!error) return 'Something went wrong. Please try again.';

  const raw = error.message || String(error);

  if (error.code === '42501' || /permission denied|not permitted|row-level security/i.test(raw)) {
    return "You don't have permission to do that.";
  }
  if (error.code === '23505') {
    const hit = Object.keys(CONSTRAINT_MESSAGES).find((k) => raw.includes(k));
    return hit ? CONSTRAINT_MESSAGES[hit] : 'That record already exists.';
  }
  if (error.code === '23514') {
    return 'That change would leave the record in an invalid state.';
  }
  if (/Failed to fetch|NetworkError|network/i.test(raw)) {
    return 'No connection. Check your network and try again.';
  }
  if (/Invalid login credentials/i.test(raw)) {
    return 'Email or password is incorrect.';
  }
  if (/already registered|already exists|User already/i.test(raw)) {
    return 'An account with that email already exists. Try signing in instead.';
  }
  if (/Password should be|weak.?password/i.test(raw)) {
    return 'That password is too weak. Use at least 8 characters with a letter and a number.';
  }
  if (/JWT|session|expired/i.test(raw)) {
    return 'Your session expired. Please sign in again.';
  }

  // PostgREST caches the schema. A function added by a migration that has not
  // been picked up yet fails here rather than at the database.
  if (error.code === 'PGRST202' || /schema cache/i.test(raw)) {
    return 'That action is not available yet. Reload the page, and if it persists ' +
      'reload the API schema in Supabase (Settings → API → Reload schema).';
  }

  // Our RPCs raise plain-language exceptions on purpose — those are safe to show.
  if (error.code === 'P0001' || !error.code) return raw;

  // Anything unrecognised: show the database's own message rather than a
  // generic apology. A staff member who can read "duplicate key on X" can act
  // on it; "something went wrong" leaves them stuck and leaves us guessing.
  // Nothing here leaks a secret — Postgres messages describe constraints, not
  // credentials, and the anon key already scopes what a caller can reach.
  if (raw) return raw;

  return 'Something went wrong. Please try again.';
}
