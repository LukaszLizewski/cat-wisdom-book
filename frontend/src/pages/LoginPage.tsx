import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { createProfile, login as loginRequest } from '../api/auth';
import { useAuth } from '../context/AuthContext';

type Tab = 'login' | 'create';

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login tab state
  const [loginProfileName, setLoginProfileName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Create profile tab state
  const [createProfileName, setCreateProfileName] = useState('');
  const [createPin, setCreatePin] = useState('');
  const [createPinConfirm, setCreatePinConfirm] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError(null);

    if (!loginProfileName.trim() || !loginPin.trim()) {
      setLoginError('Enter a profile name and PIN.');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await loginRequest({ profileName: loginProfileName, pin: loginPin });
      login(response.token);
      navigate('/');
    } catch (error) {
      if (error instanceof ApiError) {
        setLoginError(error.message || 'Invalid PIN');
      } else {
        setLoginError('Invalid PIN');
      }
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleCreateProfile(event: FormEvent) {
    event.preventDefault();
    setCreateError(null);

    if (!createProfileName.trim() || !createPin.trim()) {
      setCreateError('Enter a profile name and PIN.');
      return;
    }
    if (createPin.length < 4) {
      setCreateError('PIN must be at least 4 digits.');
      return;
    }
    if (createPin !== createPinConfirm) {
      setCreateError('PINs do not match.');
      return;
    }

    setCreateLoading(true);
    try {
      const response = await createProfile({ profileName: createProfileName, pin: createPin });
      if (response?.token) {
        login(response.token);
        navigate('/');
      } else {
        // Backend may not return a token on creation — fall back to login.
        const loginResponse = await loginRequest({
          profileName: createProfileName,
          pin: createPin,
        });
        login(loginResponse.token);
        navigate('/');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setCreateError(error.message || 'A profile with this name already exists');
      } else {
        setCreateError('A profile with this name already exists');
      }
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>🐾 Cat's Book of Wisdom</h1>
        <div className="tabs">
          <button
            type="button"
            className={`tab ${tab === 'login' ? 'tab--active' : ''}`}
            onClick={() => setTab('login')}
          >
            Log in
          </button>
          <button
            type="button"
            className={`tab ${tab === 'create' ? 'tab--active' : ''}`}
            data-testid="create-profile-tab"
            onClick={() => setTab('create')}
          >
            Create profile
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="form">
            <label>
              Profile name
              <input
                type="text"
                value={loginProfileName}
                onChange={(e) => setLoginProfileName(e.target.value)}
                data-testid="login-profile-name"
                autoComplete="username"
              />
            </label>
            <label>
              PIN
              <input
                type="password"
                inputMode="numeric"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                data-testid="login-pin"
                autoComplete="current-password"
              />
            </label>
            {loginError && <p className="form-error">{loginError}</p>}
            <button type="submit" className="btn btn--primary" data-testid="login-submit" disabled={loginLoading}>
              {loginLoading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateProfile} className="form">
            <label>
              Profile name
              <input
                type="text"
                value={createProfileName}
                onChange={(e) => setCreateProfileName(e.target.value)}
                data-testid="create-profile-name"
                autoComplete="username"
              />
            </label>
            <label>
              PIN
              <input
                type="password"
                inputMode="numeric"
                value={createPin}
                onChange={(e) => setCreatePin(e.target.value)}
                data-testid="create-profile-pin"
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm PIN
              <input
                type="password"
                inputMode="numeric"
                value={createPinConfirm}
                onChange={(e) => setCreatePinConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            {createError && <p className="form-error">{createError}</p>}
            <button
              type="submit"
              className="btn btn--primary"
              data-testid="create-profile-submit"
              disabled={createLoading}
            >
              {createLoading ? 'Creating…' : 'Create profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
