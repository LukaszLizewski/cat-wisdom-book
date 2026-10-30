import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteWisdom, fetchWisdomById } from '../api/wisdom';
import { ApiError } from '../api/client';

export function WisdomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['wisdom', id],
    queryFn: () => fetchWisdomById(id as string),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWisdom(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wisdom', 'list'] });
      navigate('/library');
    },
  });

  function handleDelete() {
    const confirmed = window.confirm('Are you sure you want to delete this wisdom?');
    if (!confirmed) return;
    deleteMutation.mutate();
  }

  if (isLoading) return <p>Loading…</p>;
  if (isError || !data) {
    return (
      <p className="form-error">
        {error instanceof ApiError ? error.message : 'Wisdom not found.'}
      </p>
    );
  }

  return (
    <div className="wisdom-detail-page">
      <div className="card">
        <p className="wisdom-card__text">&ldquo;{data.text}&rdquo;</p>
        {data.author && <p className="wisdom-card__author">— {data.author}</p>}
        {data.category && <p className="wisdom-card__category">Category: {data.category}</p>}
        <span className={`badge ${data.isOwn ? 'badge--own' : 'badge--system'}`}>
          {data.isOwn ? 'Your wisdom' : 'System wisdom'}
        </span>

        {deleteMutation.isError && (
          <p className="form-error">
            {deleteMutation.error instanceof ApiError
              ? deleteMutation.error.message
              : 'Failed to delete wisdom.'}
          </p>
        )}

        <div className="form-actions">
          {data.isOwn && (
            <>
              <button type="button" className="btn" onClick={() => navigate(`/library/${data.id}/edit`)}>
                Edit
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </>
          )}
          <button type="button" className="btn" onClick={() => navigate('/library')}>
            Back to library
          </button>
        </div>
      </div>
    </div>
  );
}
