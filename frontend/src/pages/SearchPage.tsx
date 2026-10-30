import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchWisdomList, searchSemantic } from '../api/wisdom';
import { WisdomListItem } from '../components/WisdomListItem';
import { ApiError } from '../api/client';

type Mode = 'fulltext' | 'semantic';

export function SearchPage() {
  const [mode, setMode] = useState<Mode>('fulltext');
  const [fulltextQuery, setFulltextQuery] = useState('');
  const [submittedFulltextQuery, setSubmittedFulltextQuery] = useState('');
  const [semanticQuery, setSemanticQuery] = useState('');

  const fulltextResult = useQuery({
    queryKey: ['wisdom', 'search', submittedFulltextQuery],
    queryFn: () => fetchWisdomList(submittedFulltextQuery),
    enabled: mode === 'fulltext' && submittedFulltextQuery.trim().length > 0,
  });

  const semanticMutation = useMutation({
    mutationFn: () => searchSemantic(semanticQuery),
  });

  function handleFulltextSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmittedFulltextQuery(fulltextQuery);
  }

  function handleSemanticSubmit(event: FormEvent) {
    event.preventDefault();
    if (!semanticQuery.trim()) return;
    semanticMutation.mutate();
  }

  return (
    <div className="search-page">
      <h1>🔍 Search Wisdom</h1>
      <div className="tabs">
        <button
          type="button"
          className={`tab ${mode === 'fulltext' ? 'tab--active' : ''}`}
          onClick={() => setMode('fulltext')}
        >
          Full-text search
        </button>
        <button
          type="button"
          className={`tab ${mode === 'semantic' ? 'tab--active' : ''}`}
          onClick={() => setMode('semantic')}
        >
          Semantic search
        </button>
      </div>

      {mode === 'fulltext' ? (
        <form onSubmit={handleFulltextSubmit} className="form search-form">
          <input
            type="text"
            value={fulltextQuery}
            onChange={(e) => setFulltextQuery(e.target.value)}
            placeholder="Enter a keyword…"
          />
          <button type="submit" className="btn btn--primary">
            Search
          </button>
        </form>
      ) : (
        <form onSubmit={handleSemanticSubmit} className="form search-form">
          <input
            type="text"
            value={semanticQuery}
            onChange={(e) => setSemanticQuery(e.target.value)}
            placeholder="I am tired of meetings today."
          />
          <button type="submit" className="btn btn--primary" disabled={semanticMutation.isPending}>
            {semanticMutation.isPending ? 'Searching…' : 'Search'}
          </button>
        </form>
      )}

      {mode === 'fulltext' && fulltextResult.isError && (
        <p className="form-error">
          {fulltextResult.error instanceof ApiError
            ? fulltextResult.error.message
            : 'Failed to search wisdom.'}
        </p>
      )}
      {mode === 'semantic' && semanticMutation.isError && (
        <p className="form-error">
          {semanticMutation.error instanceof ApiError
            ? semanticMutation.error.message
            : 'Failed to search wisdom.'}
        </p>
      )}

      {mode === 'fulltext' && fulltextResult.data && fulltextResult.data.items.length === 0 && (
        <p>No results for the given query.</p>
      )}
      {mode === 'semantic' && semanticMutation.data && semanticMutation.data.length === 0 && (
        <p>No results for the given query.</p>
      )}

      <ul className="wisdom-list">
        {mode === 'fulltext' &&
          fulltextResult.data?.items.map((wisdom) => (
            <WisdomListItem key={wisdom.id} wisdom={wisdom} />
          ))}
        {mode === 'semantic' &&
          semanticMutation.data?.map((result) => (
            <WisdomListItem key={result.wisdom.id} wisdom={result.wisdom} score={result.score} />
          ))}
      </ul>
    </div>
  );
}
