/**
 * Company details, in one place.
 *
 * These appear across the legal pages, the footer and the app stores, and a
 * regulator or reviewer will compare them. One source stops the address in the
 * Privacy Policy drifting from the one in the Terms.
 *
 * TODO before launch: replace every placeholder marked NEEDS CONFIRMING.
 */
export const COMPANY = {
  legalName: 'Budget Save Int Limited',
  shortName: 'BudgetSave',
  rcNumber: '9876819',                       // NEEDS CONFIRMING — CAC number
  email: 'support@budgetsaveit.com',
  phone: '+234 810 937 4331',                // NEEDS CONFIRMING
  whatsapp: '+234 810 937 4331',             // NEEDS CONFIRMING
  address: 'Benin, Edo State, Nigeria',     // NEEDS CONFIRMING — full address
  website: 'https://budgetsaveit.com',
  processor: 'OPay',
  processorLegal: 'OPay Digital Services Limited',

  /**
   * Shown at the top of each legal page. Update whenever the terms change —
   * the date is what someone relies on when they argue about which version
   * they agreed to.
   */
  lastUpdated: '13 September 2026',

  /** How long records are kept after an account closes. */
  retentionYears: 7,
};
