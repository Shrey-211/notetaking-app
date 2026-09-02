import React, { useState } from 'react';
import { Pin, Edit3, Trash2, Check, X, Tag, Clock } from 'lucide-react';

export const NoteCard = ({ note, onUpdate, onDelete, onTogglePin, showToast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(note.category || 'Personal');
  const [color, setColor] = useState(note.color || '#6366f1');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = ['Personal', 'Work', 'Ideas', 'Code'];

  const handleSaveEdit = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('Title and content cannot be empty.', 'error');
      return;
    }

    setLoading(true);
    try {
      await onUpdate(note.id, {
        title: title.trim(),
        content: content.trim(),
        category,
        color,
        is_pinned: note.is_pinned,
      });
      setIsEditing(false);
      showToast('Note updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update note.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      await onDelete(note.id);
      setShowDeleteModal(false);
      showToast('Note deleted.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete note.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div
        className={`note-card glass-panel animate-pop-in ${note.is_pinned ? 'pinned-card' : ''}`}
        style={{ borderTop: `4px solid ${note.color || '#6366f1'}` }}
      >
        {/* Top Header */}
        <div className="card-top-bar">
          <span className="card-category-badge" style={{ backgroundColor: `${note.color}22`, color: note.color }}>
            <Tag size={12} /> {note.category || 'General'}
          </span>

          <div className="card-actions">
            <button
              type="button"
              className={`action-btn pin-action ${note.is_pinned ? 'active' : ''}`}
              onClick={() => onTogglePin(note.id)}
              title={note.is_pinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin size={15} />
            </button>

            {!isEditing && (
              <>
                <button
                  type="button"
                  className="action-btn edit-action"
                  onClick={() => setIsEditing(true)}
                  title="Edit note"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  type="button"
                  className="action-btn delete-action"
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete note"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Body */}
        {isEditing ? (
          <div className="card-edit-form">
            <input
              type="text"
              className="glass-input edit-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
            />
            <textarea
              className="glass-input edit-content-textarea"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Note content..."
            />

            <div className="edit-controls">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="category-select"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div className="edit-btn-group">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditing(false)}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveEdit}
                  disabled={loading}
                >
                  <Check size={14} /> Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-display-body">
            <h3 className="card-title">{note.title}</h3>
            <p className="card-text">{note.content}</p>
          </div>
        )}

        {/* Footer Timestamp */}
        <div className="card-footer">
          <Clock size={12} className="clock-icon" />
          <span>{formatDate(note.updated_at || note.created_at)}</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box glass-panel animate-pop-in">
            <h3 className="modal-title">Delete Note?</h3>
            <p className="modal-desc">
              Are you sure you want to delete <strong>"{note.title}"</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={loading}
              >
                {loading ? <span className="spinner"></span> : 'Delete Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
