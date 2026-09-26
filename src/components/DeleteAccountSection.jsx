import { useState } from 'react';
import { Trash2, CircleAlert, Clock3, Undo2 } from 'lucide-react';
import { useMyDeletionRequest, useDeletionActions } from '../hooks/useDeletion';
import { useFinancialSummary } from '../hooks/useCustomer';
import { money, dateTime } from '../lib/format';
import { friendlyError } from '../lib/errors';
import { Card, CardHead } from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Input, Textarea } from './ui/Field';
import { useToast } from './ui/Toast';

/**
 * In-app account deletion, on the customer's profile.
 *
 * Google Play requires this route to exist inside the app, not only on the
 * website — a person who cannot sign in still has the web page, and a person
 * who can should not have to leave the app.
 *
 * Typing DELETE is deliberate friction. This is irreversible, and it sits on
 * a screen people open to change their photo.
 */
export default function DeleteAccountSection() {
  const request = useMyDeletionRequest();
  const summary = useFinancialSummary();
  const { cancel } = useDeletionActions();
  const { toast, toastError } = useToast();

  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  const balance = Number(summary.data?.current_balance || 0);
  const pending = request.data;

  const undo = async () => {
    setBusy(true);
    try {
      await cancel();
      toast('Your account will stay open.');
      request.refetch();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (pending) {
    return (
      <Card large style={{ marginTop: 'var(--s-6)' }}>
        <CardHead title="Account closure" />

        <div className="panel-note tone-amber">
          <span className="panel-note-icon"><Clock3 size={17} strokeWidth={1.9} /></span>
          <div>
            <h4>We are closing your account</h4>
            <p>
              Requested {dateTime(pending.created_at)}. We confirm within 7 days and
              finish within 30. You can still change your mind.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          block
          loading={busy}
          onClick={undo}
          style={{ marginTop: 'var(--s-4)' }}
        >
          <Undo2 size={16} /> Keep my account
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card large style={{ marginTop: 'var(--s-6)' }}>
        <CardHead
          title="Delete my account"
          sub="Remove your personal information and close your account permanently."
        />

        {balance > 0 ? (
          <div className="panel-note tone-azure">
            <span className="panel-note-icon"><CircleAlert size={17} strokeWidth={1.9} /></span>
            <div>
              <h4>Withdraw your savings first</h4>
              <p>
                You have <strong>{money(balance)}</strong> with us. We will not close an
                account while money is owed to you — request your withdrawal, and once it
                is paid you can delete the account.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="muted small">
              Your name, phone number, email, ID details and bank details are deleted.
              Your contribution history is kept for 7 years as Nigerian law requires, but
              with nothing identifying you attached to it.
            </p>

            <Button
              variant="danger"
              block
              onClick={() => setAsking(true)}
              style={{ marginTop: 'var(--s-4)' }}
            >
              <Trash2 size={16} /> Delete my account
            </Button>
          </>
        )}
      </Card>

      <ConfirmModal
        open={asking}
        onClose={() => setAsking(false)}
        onDone={request.refetch}
      />
    </>
  );
}

function ConfirmModal({ open, onClose, onDone }) {
  const { request: submit } = useDeletionActions();
  const { toast, toastError } = useToast();
  const [reason, setReason] = useState('');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const confirmed = typed.trim().toUpperCase() === 'DELETE';

  const go = async () => {
    setBusy(true);
    try {
      await submit(reason);
      toast('Request received. We will be in touch.');
      setReason('');
      setTyped('');
      onClose();
      onDone();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete your account"
      description="This cannot be undone once we complete it."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Keep my account</Button>
          <Button variant="danger" onClick={go} loading={busy} disabled={!confirmed}>
            Delete my account
          </Button>
        </>
      }
    >
      <div className="panel-note tone-rose">
        <span className="panel-note-icon"><CircleAlert size={17} strokeWidth={1.9} /></span>
        <div>
          <h4>What happens</h4>
          <p>
            Your personal details are deleted within 30 days and you can no longer sign in.
            Your contribution history is kept as anonymous figures, because the law requires
            the record of money that moved between us.
          </p>
        </div>
      </div>

      <Textarea
        label="Why are you leaving? (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="It helps us fix whatever went wrong."
        hint="If something has gone wrong, we would rather put it right."
      />

      <Input
        label="Type DELETE to confirm"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder="DELETE"
        autoCapitalize="characters"
        autoComplete="off"
      />
    </Modal>
  );
}