import { useState } from 'react';
import { Mail, AlertTriangle } from 'lucide-react';
import { useNotificationSettings, useAdminActions } from '../../hooks/useAdmin';
import { friendlyError } from '../../lib/errors';
import { Card, CardHead } from '../../components/ui/Card';
import { ErrorState, SkeletonLines, EmptyState } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './admin.css';

const label = (type) =>
  type.toLowerCase().replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/**
 * Which events send email.
 *
 * In-app notifications always happen — this only controls the email copy.
 * CONTRIBUTION_RECORDED is the one to watch: it fires once per customer per
 * day, so at any real scale it is the difference between a useful inbox and
 * a filtered one.
 */
const HIGH_VOLUME = new Set(['CONTRIBUTION_RECORDED']);

export default function NotificationSettings() {
  const settings = useNotificationSettings();
  const { setEmailForType } = useAdminActions();
  const { toast, toastError } = useToast();
  const [busy, setBusy] = useState(null);

  const toggle = async (row) => {
    setBusy(row.type);
    try {
      await setEmailForType(row.type, !row.send_email);
      toast(row.send_email ? `Email off for ${label(row.type)}.` : `Email on for ${label(row.type)}.`);
      settings.refetch();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  };

  const rows = settings.data || [];
  const onCount = rows.filter((r) => r.send_email).length;

  return (
    <>
      <header className="page-head">
        <h1>Email alerts</h1>
        <p>Which events also go out by email. In-app alerts always happen.</p>
      </header>

      {settings.loading && <SkeletonLines count={6} height={62} />}
      {settings.error && !settings.loading && (
        <ErrorState message={settings.error} onRetry={settings.refetch} />
      )}

      {!settings.loading && !settings.error && !rows.length && (
        <Card large>
          <EmptyState
            title="Nothing configured"
            message="Run the notification settings migration to populate this list."
            Icon={Mail}
          />
        </Card>
      )}

      {rows.length > 0 && (
        <>
          <div className="stat" style={{ marginBottom: 'var(--s-4)' }}>
            <div className="stat-label">Sending by email</div>
            <div className="stat-value num">{onCount} of {rows.length}</div>
          </div>

          <Card large>
            <CardHead title="Events" />
            {rows.map((row) => (
              <div className="switch-row" key={row.type}>
                <div className="switch-text">
                  <div className="switch-label">
                    {label(row.type)}
                    {HIGH_VOLUME.has(row.type) && (
                      <span className="volume-flag">
                        <AlertTriangle size={12} strokeWidth={2.2} /> High volume
                      </span>
                    )}
                  </div>
                  {row.description && <div className="xs muted">{row.description}</div>}
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={row.send_email}
                  aria-label={`Email for ${label(row.type)}`}
                  className={`switch${row.send_email ? ' is-on' : ''}`}
                  disabled={busy === row.type}
                  onClick={() => toggle(row)}
                >
                  <span className="switch-knob" />
                </button>
              </div>
            ))}
          </Card>

          <p className="field-hint">
            Contribution recorded fires once per customer per day. With a few hundred
            customers that alone is a few hundred emails daily — turn it off first if
            people start ignoring NaijaNest mail.
          </p>
        </>
      )}
    </>
  );
}