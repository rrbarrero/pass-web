import React, { useState, FormEvent } from "react";
import { GpgPasswordModalProps } from "./Home";

export const GpgPasswordModal: React.FC<GpgPasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password);
      setPassword("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content gpg-password-modal">
        <h3>Enter GPG Password</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="GPG Passphrase"
            autoFocus
            required
          />
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="button-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="button-primary">
              Decrypt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
