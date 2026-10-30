import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { changePin } from '../api/auth';
import { ApiError } from '../api/client';

export function ProfilePage() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => changePin({ currentPin, newPin }),
    onSuccess: () => {
      setSuccessMessage('PIN has been changed.');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
    },
    onError: (error) => {
      setFormError(error instanceof ApiError ? error.message : 'Failed to change PIN.');
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!currentPin || !newPin || !confirmNewPin) {
      setFormError('Please fill in all fields.');
      return;
    }
    if (newPin.length < 4) {
      setFormError('New PIN must be at least 4 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setFormError('New PINs do not match.');
      return;
    }

    mutation.mutate();
  }

  return (
    <div className="profile-page">
      <h1>👤 Profile</h1>
      <div className="card">
        <h2>Change PIN</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Current PIN
            <input
              type="password"
              inputMode="numeric"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
            />
          </label>
          <label>
            New PIN
            <input
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
            />
          </label>
          <label>
            Confirm new PIN
            <input
              type="password"
              inputMode="numeric"
              value={confirmNewPin}
              onChange={(e) => setConfirmNewPin(e.target.value)}
            />
          </label>
          {formError && <p className="form-error">{formError}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}
          <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Change PIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
