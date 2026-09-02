import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { NoteEditor } from './components/NoteEditor';
import { NoteCard } from './components/NoteCard';
import { Toast } from './components/Toast';
import { api } from './services/api';
import { FileText, Sparkles, Pin, BookOpen } from 'lucide-react';

export function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getNotes(selectedCategory, searchTerm);
      setNotes(data);
    } catch (err) {
      showToast(err.message || 'Error fetching notes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, selectedCategory, searchTerm]);

  // Initial load check for authentication token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      api
        .getMe()
        .then((res) => {
          setUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        });
    }
  }, [user]);

  // Fetch notes when user, category, or search term changes
  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user, fetchNotes]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setNotes([]);
    showToast('Successfully logged out.', 'info');
  };

  const handleNoteCreated = async (noteData) => {
    const newNote = await api.createNote(noteData);
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleUpdateNote = async (id, updatedData) => {
    const updated = await api.updateNote(id, updatedData);
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  const handleTogglePin = async (id) => {
    try {
      const updated = await api.togglePin(id);
      setNotes((prev) =>
        prev
          .map((n) => (n.id === id ? updated : n))
          .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
      );
      showToast(updated.is_pinned ? 'Note pinned!' : 'Note unpinned.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to pin note.', 'error');
    }
  };

  const handleDeleteNote = async (id) => {
    await api.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const pinnedNotes = notes.filter((n) => n.is_pinned);
  const otherNotes = notes.filter((n) => !n.is_pinned);

  return (
    <div className="app-container">
      {/* Toast Notification Container */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Unauthenticated View: Auth Modal */}
      {!user ? (
        <AuthModal onAuthSuccess={(u) => setUser(u)} showToast={showToast} />
      ) : (
        <>
          {/* Header Navigation */}
          <Navbar
            user={user}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onLogout={handleLogout}
          />

          {/* Main Dashboard */}
          <main className="main-content">
            {/* Note Creator Form */}
            <NoteEditor onNoteCreated={handleNoteCreated} showToast={showToast} />

            {/* Loading Indicator */}
            {loading && (
              <div className="notes-loading-state">
                <div className="spinner large"></div>
                <p>Loading your notes from database...</p>
              </div>
            )}

            {/* Notes Section */}
            {!loading && (
              <div className="notes-grid-container">
                {/* Pinned Notes Section */}
                {pinnedNotes.length > 0 && (
                  <div className="notes-section">
                    <div className="section-title-row">
                      <Pin size={16} className="section-icon pinned-color" />
                      <h2>Pinned Notes</h2>
                      <span className="count-badge">{pinnedNotes.length}</span>
                    </div>
                    <div className="notes-grid">
                      {pinnedNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onUpdate={handleUpdateNote}
                          onDelete={handleDeleteNote}
                          onTogglePin={handleTogglePin}
                          showToast={showToast}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Notes Section */}
                {otherNotes.length > 0 && (
                  <div className="notes-section">
                    <div className="section-title-row">
                      <BookOpen size={16} className="section-icon" />
                      <h2>{pinnedNotes.length > 0 ? 'Other Notes' : 'All Notes'}</h2>
                      <span className="count-badge">{otherNotes.length}</span>
                    </div>
                    <div className="notes-grid">
                      {otherNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onUpdate={handleUpdateNote}
                          onDelete={handleDeleteNote}
                          onTogglePin={handleTogglePin}
                          showToast={showToast}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {notes.length === 0 && (
                  <div className="empty-state-box glass-panel animate-fade-in">
                    <div className="empty-icon-circle">
                      <FileText size={36} className="empty-icon" />
                    </div>
                    <h3>No notes found</h3>
                    <p>
                      {searchTerm || selectedCategory !== 'All'
                        ? 'No notes match your active filter or search query.'
                        : 'Your workspace is empty! Click the note editor above to create your first persistent note.'}
                    </p>
                    {(searchTerm || selectedCategory !== 'All') && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategory('All');
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
