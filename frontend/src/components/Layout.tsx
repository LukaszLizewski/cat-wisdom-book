import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-header__brand">
          🐾 Cat's Book of Wisdom
        </Link>
        {isAuthenticated && (
          <nav className="app-header__nav">
            <Link to="/library" data-testid="library-link">
              📚 Library
            </Link>
            <Link to="/search">🔍 Search</Link>
            <Link to="/profile">👤 Profile</Link>
            <button type="button" className="btn btn--link" onClick={handleLogout}>
              Log out
            </button>
          </nav>
        )}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
