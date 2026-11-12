import { useMemo, useState } from 'react';
import Modal from './ui/Modal';
import StatusBadge from './ui/Status';
import { money, shortDate, timeOnly, isoDate } from '../lib/format';
import './contribution-calendar.css';

/**
 * A grid of numbered day chips. Day numbers follow the calendar month, so a
 * customer who joins on the 15th sees days 1–14 as optional catch-up days and
 * their first real payment on day 15.
 *
 * Only an unpaid day on or after the plan's start date is a real miss.
 * A day before the start date is catch-up: payable if they wish, never a debt.
 */
function dayState(day, today, startDate) {
  if (day.status === 'PAID') return 'paid';
  if (day.status === 'VOID') return 'void';
  if (startDate && day.contribution_date < startDate) return 'catchup';
  return day.contribution_date > today ? 'future' : 'unpaid';
}

const STATE_LABEL = {
  paid: 'Paid', unpaid: 'Unpaid', future: 'Upcoming', void: 'Voided', catchup: 'Catch-up',
};

export default function ContributionCalendar({ days = [], startDate = null }) {
  const [selected, setSelected] = useState(null);
  const today = isoDate();

  const counts = useMemo(() => {
    const acc = { paid: 0, unpaid: 0, future: 0, void: 0, catchup: 0 };
    days.forEach((d) => { acc[dayState(d, today, startDate)] += 1; });
    return acc;
  }, [days, today, startDate]);

  if (!days.length) return null;

  const legend = ['paid', 'unpaid', 'future', ...(counts.catchup > 0 ? ['catchup'] : [])];

  return (
    <>
      <div className="cal-legend" role="list">
        {legend.map((s) => (
          <span className="cal-legend-item" role="listitem" key={s}>
            <span className={`cal-swatch is-${s}`} aria-hidden="true" />
            {STATE_LABEL[s]} · <span className="num">{counts[s]}</span>
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {days.map((day) => {
          const state = dayState(day, today, startDate);
          const isToday = day.contribution_date === today;
          return (
            <button
              key={day.id}
              type="button"
              className={`cal-day is-${state}${isToday ? ' is-today' : ''}`}
              onClick={() => setSelected(day)}
              aria-label={`Day ${day.day_number}, ${shortDate(day.contribution_date)}, ${STATE_LABEL[state]}`}
            >
              <span className="num">{day.day_number}</span>
            </button>
          );
        })}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Day ${selected.day_number}` : ''}
        description={selected ? shortDate(selected.contribution_date) : ''}
      >
        {selected && (
          <dl className="detail-list">
            <div><dt>Status</dt><dd><StatusBadge status={selected.status} /></dd></div>
            <div><dt>Expected</dt><dd className="num">{money(selected.expected_amount)}</dd></div>
            {selected.status === 'PAID' && (
              <>
                <div><dt>Amount paid</dt><dd className="num">{money(selected.actual_amount)}</dd></div>
                <div><dt>Time paid</dt><dd>{timeOnly(selected.paid_at)}</dd></div>
                <div>
                  <dt>Method</dt>
                  <dd>{selected.payment_method === 'TRANSFER' ? 'Bank transfer' : 'Cash'}</dd>
                </div>
                <div><dt>Recorded by</dt><dd>{selected.recorder?.full_name || '—'}</dd></div>
              </>
            )}
            {selected.note && <div><dt>Note</dt><dd>{selected.note}</dd></div>}

            {selected.is_service_charge && (
              <p className="cal-reassure">
                This payment is the service charge for your plan. It is not part of the
                savings you can withdraw.
              </p>
            )}
            {selected.status === 'UNPAID' && startDate && selected.contribution_date < startDate && (
              <p className="cal-reassure">
                This day was before your plan started, so it is optional. Paying it adds to
                your savings, and leaving it costs you nothing.
              </p>
            )}
            {selected.status === 'UNPAID' && (!startDate || selected.contribution_date >= startDate)
              && selected.contribution_date < today && (
              <p className="cal-reassure">
                This day is unpaid. It is not a debt — you can still pay it, or leave it
                and withdraw only what you contributed.
              </p>
            )}
          </dl>
        )}
      </Modal>
    </>
  );
}
