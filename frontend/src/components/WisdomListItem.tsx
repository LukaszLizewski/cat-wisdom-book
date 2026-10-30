import { Link } from 'react-router-dom';
import type { Wisdom } from '../types';

interface Props {
  wisdom: Wisdom;
  onDelete?: (id: string) => void;
  score?: number;
}

export function WisdomListItem({ wisdom, onDelete, score }: Props) {
  const truncated =
    wisdom.text.length > 140 ? `${wisdom.text.slice(0, 140).trimEnd()}…` : wisdom.text;

  return (
    <li className="wisdom-list-item" data-testid="wisdom-list-item">
      <Link to={`/library/${wisdom.id}`} className="wisdom-list-item__link">
        <p className="wisdom-list-item__text">&ldquo;{truncated}&rdquo;</p>
      </Link>
      <div className="wisdom-list-item__meta">
        {wisdom.author && <span className="wisdom-list-item__author">— {wisdom.author}</span>}
        {wisdom.category && <span className="wisdom-list-item__category">{wisdom.category}</span>}
        <span className={`badge ${wisdom.isOwn ? 'badge--own' : 'badge--system'}`}>
          {wisdom.isOwn ? 'Yours' : 'System'}
        </span>
        {score !== undefined && (
          <span className="wisdom-list-item__score">Relevance: {(score * 100).toFixed(0)}%</span>
        )}
      </div>
      {wisdom.isOwn && (
        <div className="wisdom-list-item__actions">
          <Link to={`/library/${wisdom.id}/edit`} className="btn btn--small">
            Edit
          </Link>
          {onDelete && (
            <button
              type="button"
              className="btn btn--small btn--danger"
              onClick={() => onDelete(wisdom.id)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </li>
  );
}
