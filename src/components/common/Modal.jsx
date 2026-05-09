import React from "react";
import "./Modal.css";

const Modal = ({ isOpen, onClose, children, title, size = "large" }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content modal-${size}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            x
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
