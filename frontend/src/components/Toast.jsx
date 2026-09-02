import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 size={18} className="toast-icon-success" />,
    error: <AlertCircle size={18} className="toast-icon-error" />,
    info: <Info size={18} className="toast-icon-info" />,
  };

  return (
    <div className={`toast-notification toast-${type} animate-pop-in`}>
      <div className="toast-content">
        {icons[type]}
        <span>{message}</span>
      </div>
      <button onClick={onClose} className="toast-close-btn" aria-label="Close notification">
        <X size={14} />
      </button>
    </div>
  );
};
