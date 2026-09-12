/**
 * Nigerian banks for the payout form.
 *
 * A select rather than a free-text field: a mistyped bank name is a failed
 * transfer and a support call, and the office is keying these into a banking
 * portal by hand.
 */
export const NIGERIAN_BANKS = [
  'Access Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'First City Monument Bank (FCMB)',
  'Globus Bank',
  'Guaranty Trust Bank (GTBank)',
  'Heritage Bank',
  'Keystone Bank',
  'Kuda Bank',
  'Lotus Bank',
  'Moniepoint MFB',
  'Opay',
  'Optimus Bank',
  'PalmPay',
  'Parallex Bank',
  'Polaris Bank',
  'Premium Trust Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'SunTrust Bank',
  'Titan Trust Bank',
  'Union Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Unity Bank',
  'VFD Microfinance Bank',
  'Wema Bank',
  'Zenith Bank',
];

/** Frequency options, with the term lengths each one offers. */
export const FREQUENCIES = [
  {
    value: 'DAILY',
    label: 'Daily',
    unit: 'days',
    every: 'every day',
    terms: [
      { periods: 30, label: '30 days' },
      { periods: 60, label: '60 days' },
      { periods: 90, label: '90 days' },
      { periods: 180, label: '6 months' },
      { periods: 365, label: '1 year' },
    ],
  },
  {
    value: 'WEEKLY',
    label: 'Weekly',
    unit: 'weeks',
    every: 'every week',
    terms: [
      { periods: 4, label: '4 weeks' },
      { periods: 8, label: '8 weeks' },
      { periods: 12, label: '12 weeks' },
      { periods: 26, label: '6 months' },
      { periods: 52, label: '1 year' },
    ],
  },
  {
    value: 'MONTHLY',
    label: 'Monthly',
    unit: 'months',
    every: 'every month',
    terms: [
      { periods: 3, label: '3 months' },
      { periods: 6, label: '6 months' },
      { periods: 9, label: '9 months' },
      { periods: 12, label: '1 year' },
      { periods: 24, label: '2 years' },
    ],
  },
];

export const FREQUENCY_LABEL = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

/** "a day" / "a week" / "a month" — for reading amounts back naturally. */
export const PER_LABEL = {
  DAILY: 'a day',
  WEEKLY: 'a week',
  MONTHLY: 'a month',
};