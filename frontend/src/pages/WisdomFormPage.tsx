import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createWisdom, fetchWisdomById, updateWisdom } from '../api/wisdom';
import { ApiError } from '../api/client';

export function WisdomFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: existing } = useQuery({
    queryKey: ['wisdom', id],
    queryFn: () => fetchWisdomById(id as string),
    enabled: mode === 'edit' && Boolean(id),
  });

  useEffect(() => {
    if (existing) {
      setText(existing.text);
      setAuthor(existing.author ?? '');
      setCategory(existing.category ?? '');
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { text, author: author || null, category: category || null };
      if (mode === 'create') {
        return createWisdom(payload);
      }
      return updateWisdom(id as string, payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['wisdom', 'list'] });
      navigate(`/library/${saved.id}`);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError ? error.message : 'Failed to save wisdom.',
      );
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!text.trim()) {
      setFormError('Wisdom text is required.');
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="wisdom-form-page">
      <h1>{mode === 'create' ? '+ New wisdom' : 'Edit wisdom'}</h1>
      <form onSubmit={handleSubmit} className="form card">
        <label>
          Text
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            data-testid="wisdom-text-input"
            rows={4}
            required
          />
        </label>
        <label>
          Author (optional)
          <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </label>
        <label>
          Category (optional)
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        {formError && <p className="form-error">{formError}</p>}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn--primary"
            data-testid="wisdom-save-button"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
