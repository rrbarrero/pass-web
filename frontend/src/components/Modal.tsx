import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title?: string; // Optional title for the modal
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  content,
  title = "File Content",
}) => {
  if (!isOpen) {
    return null;
  }

  // Prevent closing when clicking inside the modal content
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    // Overlay covers the whole screen
    <div className="modal-overlay" onClick={onClose}>
      {/* Modal container */}
      <div className="modal-container" onClick={handleContentClick}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          {/* Close button */}
          <button className="modal-close-button" onClick={onClose}>
            × {/* HTML entity for 'X' */}
          </button>
        </div>
        <div className="modal-body">
          {/* Use <pre> for preserving whitespace and line breaks */}
          <pre className="modal-content">{content}</pre>
        </div>
      </div>
    </div>
  );
};

export default Modal;
