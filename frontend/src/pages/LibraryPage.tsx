import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { fetchWisdomList, deleteWisdom } from '../api/wisdom';
import { WisdomListItem } from '../components/WisdomListItem';
import { ApiError } from '../api/client';

export function LibraryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['wisdom', 'list'],
    queryFn: () => fetchWisdomList(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWisdom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wisdom', 'list'] });
    },
    onSettled: () => setPendingDeleteId(null),
  });

  function handleDelete(id: string) {
    const confirmed = window.confirm('Are you sure you want to delete this wisdom?');
    if (!confirmed) return;
    setPendingDeleteId(id);
    deleteMutation.mutate(id);
  }

  return (
    <div className="library-page">
      <div className="page-header">
        <h1>📚 Wisdom Library</h1>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/library/new')}>
          + New wisdom
        </button>
      </div>

      {isLoading && <p>Loading…</p>}
      {isError && (
        <p className="form-error">
          {error instanceof ApiError ? error.message : 'Failed to fetch the wisdom list.'}
        </p>
      )}
      {deleteMutation.isError && (
        <p className="form-error">
          {deleteMutation.error instanceof ApiError
            ? deleteMutation.error.message
            : 'Failed to delete wisdom.'}
        </p>
      )}

      {data && data.items.length === 0 && <p>No wisdom to display.</p>}

      {data && data.items.length > 0 && (
        <ul className="wisdom-list">
          {data.items.map((wisdom) => (
            <WisdomListItem
              key={wisdom.id}
              wisdom={wisdom}
              onDelete={pendingDeleteId === wisdom.id ? undefined : handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
