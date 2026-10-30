import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchRandomWisdom } from '../api/wisdom';
import { ApiError } from '../api/client';

export function HomePage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['wisdom', 'random'],
    queryFn: fetchRandomWisdom,
  });

  return (
    <div className="home-page">
      <div className="card wisdom-card">
        <h2>🐾 Today's Wisdom</h2>
        {isLoading && <p>Loading…</p>}
        {isError && (
          <p className="form-error">
            {error instanceof ApiError ? error.message : 'Failed to fetch wisdom.'}
          </p>
        )}
        {data && (
          <>
            <p className="wisdom-card__text">&ldquo;{data.text}&rdquo;</p>
            {data.author && <p className="wisdom-card__author">— {data.author}</p>}
          </>
        )}
        <div className="home-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            🎲 Get another
          </button>
          <button type="button" className="btn" onClick={() => navigate('/library')}>
            📚 Browse the book
          </button>
          <button type="button" className="btn" onClick={() => navigate('/search')}>
            🔍 Search
          </button>
        </div>
      </div>
    </div>
  );
}
