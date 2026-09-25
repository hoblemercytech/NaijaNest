import { supabase } from './supabase';

/**
 * Calls to the account-gateway edge function.
 *
 * Account creation, claim redemption and passcode sign-in all need the
 * service role, so none of them can happen in the browser. This module is the
 * only place that talks to that function, which keeps the URL and the error
 * handling in one spot.
 */
const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/account-gateway`;

async function call(body, { authenticated = false } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  if (authenticated) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('Your session expired. Please sign in again.');
    headers.Authorization = `Bearer ${data.session.access_token}`;
  } else {
    // The function needs *an* apikey even for public actions; the anon key is
    // what the browser is allowed to hold.
    headers.Authorization = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
  }

  let response;
  try {
    response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('No connection. Check your network and try again.');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Something went wrong. Please try again.');
  }

  // The function returns plain-language errors on purpose — they are written
  // to be shown, so they pass straight through.
  if (!response.ok) throw new Error(payload.error || 'Something went wrong. Please try again.');

  return payload;
}

/** Staff create a customer. Returns the member ID and the claim link. */
export function createCustomer({ fullName, phone, email, collectorId, enquiryId }) {
  return call(
    { action: 'create', fullName, phone, email, collectorId, enquiryId },
    { authenticated: true }
  );
}

/** Issue a fresh claim link when the first one expired or never arrived. */
export function resendClaim(userId) {
  return call({ action: 'resend', userId }, { authenticated: true });
}

/** Redeem a claim link and set the passcode. */
export function claimAccount(token, passcode) {
  return call({ action: 'claim', token, passcode });
}

/**
 * Sign in with a phone number and passcode.
 *
 * The function returns tokens rather than signing in for us, because the
 * session has to be installed in *this* browser's client to persist.
 */
export async function signInWithPasscode(phone, passcode) {
  const { access_token, refresh_token } = await call({ action: 'login', phone, passcode });

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw new Error('Could not start your session. Please try again.');
}

/** Look up a claim token so the page can greet the right person. */
export async function peekClaim(token) {
  const { data, error } = await supabase.rpc('nn_peek_claim', { p_token: token });
  if (error) throw new Error('Could not check that link.');
  return data?.[0] ?? { valid: false, reason: 'This link is not valid.' };
}

/** Submit an account enquiry. Public — no session needed. */
export async function submitEnquiry(form) {
  const { error } = await supabase.rpc('nn_submit_enquiry', {
    p_full_name: form.fullName,
    p_phone: form.phone,
    p_email: form.email,
    p_city: form.city || null,
    p_note: form.note || null,
    p_source: form.source || 'website',
  });
  if (error) throw error;
}