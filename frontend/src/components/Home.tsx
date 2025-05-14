import React, { useState, FormEvent, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import useFileRepository from "../hooks/useFileRepository";
import Modal from "./Modal";
import { PassFile } from "../domain/passFile";
import ThemeSwitcher from "./ThemeSwitcher";
import { GpgPasswordModal } from "./GpgPasswordModal";

export interface GpgPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  fileName: string;
}

const Home: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isGpgModalOpen, setIsGpgModalOpen] = useState(false);
  const [currentFileTitle, setCurrentFileTitle] = useState<string>("");
  const [selectedFileToDecrypt, setSelectedFileToDecrypt] =
    useState<PassFile | null>(null);

  const { logout } = useAuth();
  const {
    filesFound,
    searchFile,
    fileContent,
    decryptFile,
    clearFileContent,
    isLoading,
    error,
    clearError,
  } = useFileRepository();

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!search.trim()) return;
    clearFileContent();
    setIsContentModalOpen(false);
    setIsGpgModalOpen(false);
    searchFile(search);
  };

  const handleFileClick = (passFile: PassFile) => {
    if (isLoading) return;
    setSelectedFileToDecrypt(passFile);
    setCurrentFileTitle(passFile.fileName);
    setIsGpgModalOpen(true);
  };

  const handleGpgPasswordSubmit = (gpgPassword: string) => {
    setIsGpgModalOpen(false);
    if (selectedFileToDecrypt && gpgPassword) {
      decryptFile(selectedFileToDecrypt, gpgPassword);
    }
    setSelectedFileToDecrypt(null);
  };

  const handleCloseContentModal = () => {
    setIsContentModalOpen(false);
    clearFileContent();
  };

  const handleCloseGpgModal = () => {
    setIsGpgModalOpen(false);
    setSelectedFileToDecrypt(null);
  };

  useEffect(() => {
    if (fileContent !== null && !isLoading && !error) {
      if (selectedFileToDecrypt) {
        setCurrentFileTitle(selectedFileToDecrypt.fileName);
      }
      setIsContentModalOpen(true);
    }
  }, [fileContent, isLoading, error, selectedFileToDecrypt]);

  useEffect(() => {
    if (search || isGpgModalOpen) {
      clearError();
    }
  }, [search, isGpgModalOpen, clearError]);

  return (
    <div className="home-container">
      <ThemeSwitcher />
      {logout && (
        <button onClick={logout} className="logout-button" disabled={isLoading}>
          Close session
        </button>
      )}

      <form onSubmit={handleSearchSubmit}>
        <label htmlFor="search-input">Needle:</label>
        <input
          type="text"
          id="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Needle"
          required
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {isLoading && <p className="status-message">Loading...</p>}
      {error && !isLoading && (
        <p className="status-message error-message">Error: {error}</p>
      )}

      {!isLoading && filesFound.length > 0 && (
        <ul className="file-list">
          {filesFound.map((file) => (
            <li
              key={file.fullPath}
              className="file-list-item"
              onClick={() => handleFileClick(file)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleFileClick(file)}
              style={{ cursor: isLoading ? "default" : "pointer" }}
            >
              {file.fullPath}
            </li>
          ))}
        </ul>
      )}

      {!isLoading &&
        filesFound.length === 0 &&
        search.trim() !== "" &&
        !error && (
          <ul className="file-list">
            <li className="file-list-item" style={{ fontStyle: "italic" }}>
              No files found matching your criteria.
            </li>
          </ul>
        )}

      <GpgPasswordModal
        isOpen={isGpgModalOpen}
        onClose={handleCloseGpgModal}
        onSubmit={handleGpgPasswordSubmit}
        fileName={currentFileTitle}
      />

      {fileContent !== null && (
        <Modal
          isOpen={isContentModalOpen}
          onClose={handleCloseContentModal}
          content={fileContent}
          title={currentFileTitle}
        />
      )}
    </div>
  );
};

export default Home;
