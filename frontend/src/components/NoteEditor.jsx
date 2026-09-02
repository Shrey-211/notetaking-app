import React, { useState } from 'react';
import { Plus, Pin, Tag, Palette, Check } from 'lucide-react';

export const NoteEditor = ({ onNoteCreated, showToast }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Personal');
  const [color, setColor] = useState('#6366f1');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const colors = [
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Amber', hex: '#f59e0b' },
  ];

  const categories = ['Personal', 'Work', 'Ideas', 'Code'];

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Both note title and content are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await onNoteCreated({
        title: title.trim(),
        content: content.trim(),
        category,
        color,
        is_pinned: isPinned,
      });

      // Reset form
      setTitle('');
      setContent('');
      setIsPinned(false);
      setIsExpanded(false);
      showToast('Note created and saved to database!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save note.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="note-editor-wrapper animate-fade-in">
      <form
        onSubmit={handleSave}
        className={`glass-panel note-editor-card ${isExpanded ? 'expanded' : ''}`}
        style={{ borderTop: `4px solid ${color}` }}
      >
        {isExpanded && (
          <div className="editor-top-row">
            <input
              type="text"
              className="editor-title-input"
              placeholder="Note Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              className={`btn-icon pin-btn ${isPinned ? 'pinned' : ''}`}
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin size={18} />
            </button>
          </div>
        )}

        <textarea
          className="editor-content-textarea"
          placeholder={isExpanded ? 'Write your note here...' : 'Take a new note...'}
          rows={isExpanded ? 4 : 1}
          value={content}
          onFocus={() => setIsExpanded(true)}
          onChange={(e) => setContent(e.target.value)}
        />

        {isExpanded && (
          <div className="editor-toolbar">
            {/* Category Selector */}
            <div className="toolbar-section">
              <Tag size={15} className="toolbar-icon" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="category-select"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Palette */}
            <div className="toolbar-section color-picker-row">
              <Palette size={15} className="toolbar-icon" />
              <div className="color-swatches">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    className={`color-swatch ${color === c.hex ? 'selected' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setColor(c.hex)}
                    title={c.name}
                  >
                    {color === c.hex && <Check size={12} color="#fff" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="toolbar-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsExpanded(false);
                  setTitle('');
                  setContent('');
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <Plus size={16} /> Save Note
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
