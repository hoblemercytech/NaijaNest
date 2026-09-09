import { useMemo, useState } from 'react';
import Modal from './ui/Modal';
import StatusBadge from './ui/Status';
import { money, shortDate, timeOnly, isoDate } from '../lib/format';
import './contribution-calendar.css';

/**
 * A grid of numbered day chips. Numbering is meaningful here — day 1 to day 30
 * is the actual sequence a customer is working through, and it's how collectors
 * and customers already talk about an ajo cycle.
 *
 * A day that is UNPAID but still in the future isn't a miss yet, so it reads as
 * "upcoming". Only a past unpaid day gets the warning treatment.
 */
function dayState(day, today) {
  if (day.status === 'PAID') return 'paid';
  if (day.status === 'VOID') return 'void';
  return day.contribution_date > today ? 'future' : 'unpaid';
}

const STATE_LABEL = { paid: 'Paid', unpaid: 'Unpaid', future: 'Upcoming', void: 'Voided' };

export default function ContributionCalendar({ days = [] }) {
  const [selected, setSelected] = useState(null);
  const today = isoDate();

  const counts = useMemo(() => {
    const acc = { paid: 0, unpaid: 0, future: 0, void: 0 };
    days.forEach((d) => { acc[dayState(d, today)] += 1; });
    return acc;
  }, [days, today]);

  if (!days.length) return null;

  return (
    <>
      <div className="cal-legend" role="list">
        {['paid', 'unpaid', 'future'].map((s) => (
          <span className="cal-legend-item" role="listitem" key={s}>
            <span className={`cal-swatch is-${s}`} aria-hidden="true" />
            {STATE_LABEL[s]} · <span className="num">{counts[s]}</span>
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {days.map((day) => {
          const state = dayState(day, today);
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
                <div><dt>Method</dt><dd>Cash</dd></div>
                <div><dt>Recorded by</dt><dd>{selected.recorder?.full_name || '—'}</dd></div>
              </>
            )}
            {selected.note && <div><dt>Note</dt><dd>{selected.note}</dd></div>}
            {selected.status === 'UNPAID' && selected.contribution_date < today && (
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