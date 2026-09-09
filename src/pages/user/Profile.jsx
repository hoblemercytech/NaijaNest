import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadAvatar } from '../../lib/storage';
import { useAvatarUrl } from '../../hooks/useAvatar';
import { friendlyError } from '../../lib/errors';
import { shortDate } from '../../lib/format';
import { Card, CardHead } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

/**
 * Read-only by design. Customers can change their photo and password; name,
 * phone and member ID are edited by staff so the record stays trustworthy.
 */
export default function Profile() {
  const { profile, user, refreshProfile, signOut } = useAuth();
  const { toast, toastError } = useToast();
  const url = useAvatarUrl(profile?.avatar_url);
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toastError('Image must be under 2MB.');

    setBusy(true);
    try {
      await uploadAvatar(user.id, file);
      await refreshProfile();
      toast('Photo updated.');
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="page-head">
        <h1>Profile</h1>
      </header>

      <Card large>
        <div className="row" style={{ gap: 'var(--s-4)', marginBottom: 'var(--s-5)' }}>
          <Avatar name={profile?.full_name} url={url} size={64} />
          <div>
            <h2 style={{ fontSize: 'var(--t-h3)' }}>{profile?.full_name}</h2>
            <p className="small muted num" style={{ margin: 0 }}>{profile?.member_id}</p>
            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', marginTop: 8 }}>
              {busy ? 'Uploading…' : 'Change photo'}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} hidden disabled={busy} />
            </label>
          </div>
        </div>

        <dl className="detail-list">
          <div><dt>Email</dt><dd>{profile?.email}</dd></div>
          <div><dt>Phone</dt><dd className="num">{profile?.phone || '—'}</dd></div>
          <div><dt>Member since</dt><dd>{shortDate(profile?.created_at)}</dd></div>
        </dl>

        <p className="field-hint">
          To change your name or phone number, ask your collector — they keep the record
          accurate on your behalf.
        </p>
      </Card>

      <Card large style={{ marginTop: 'var(--s-4)' }}>
        <CardHead title="Account" />
        <Button variant="outline" block onClick={signOut}>Sign out</Button>
      </Card>
    </>
  );
}