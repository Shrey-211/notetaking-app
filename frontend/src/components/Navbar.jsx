import React from 'react';
import { Search, LogOut, ShieldCheck, Sparkles } from 'lucide-react';

export const Navbar = ({
  user,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  onLogout,
}) => {
  const categories = ['All', 'Personal', 'Work', 'Ideas', 'Code'];

  return (
    <header className="navbar-header glass-panel">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-logo-glow">
            <Sparkles size={20} className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">Note<span className="brand-highlight">Pulse</span></span>
            <span className="brand-badge"><ShieldCheck size={11} /> Isolated DB</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="navbar-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="glass-input search-input"
            placeholder="Search notes by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* User Profile & Logout */}
        <div className="navbar-user">
          <div className="user-profile-pill">
            <div className="avatar-circle">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.full_name || user?.username}</span>
              <span className="user-handle">@{user?.username}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="btn btn-secondary logout-btn"
            title="Log out of NotePulse"
          >
            <LogOut size={16} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Categories Filter Strip */}
      <div className="categories-strip">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </header>
  );
};
