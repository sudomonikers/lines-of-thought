import { useState } from 'react';

interface CreateThoughtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  parentText?: string;
}

export default function CreateThoughtModal({
  isOpen,
  onClose,
  onSubmit,
  parentText
}: CreateThoughtModalProps) {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setText('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{parentText ? 'Add Branch' : 'New Thought'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {parentText && (
          <div className="modal-parent-context">
            <span className="context-label">Branching from:</span>
            <p className="context-text">{parentText}</p>
          </div>
        )}

        <div className="modal-body">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What are you thinking about?"
            autoFocus
            rows={6}
            className="thought-textarea"
          />
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={!text.trim()}>
            {parentText ? 'Add Branch' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
