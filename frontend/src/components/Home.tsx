import React, { useState, FormEvent, useEffect } from "react"; // Import useEffect
import { useAuth } from "../hooks/useAuth";
import useFileRepository from "../hooks/useFileRepository";
import Modal from "./Modal";
import { PassFile } from "../domain/passFile";
import ThemeSwitcher from "./ThemeSwitcher";

const Home: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFileTitle, setCurrentFileTitle] = useState<string>("");

  const { logout } = useAuth();
  const {
    filesFound,
    searchFile,
    fileContent,
    decryptFile,
    clearFileContent,
    isLoading,
    error,
  } = useFileRepository();

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!search.trim()) return;
    searchFile(search);
    setIsModalOpen(false);
  };

  const handleFileClick = (passFile: PassFile) => {
    if (isLoading) return;
    setCurrentFileTitle(passFile.fileName);
    decryptFile(passFile);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    clearFileContent();
  };

  useEffect(() => {
    if (fileContent !== null && !isLoading && !error) {
      setIsModalOpen(true);
    }
  }, [fileContent, isLoading, error]);

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

      {isLoading && <p>Loading...</p>}

      {error && !isLoading && <p style={{ color: "red" }}>Error: {error}</p>}

      {!isLoading && !error && filesFound.length > 0 && (
        <ul>
          {filesFound.map((file, index) => (
            <li
              key={index}
              className="file-list-item"
              onClick={() => handleFileClick(file)}
              style={{ cursor: isLoading ? "default" : "pointer" }}
            >
              {file.fullPath}
            </li>
          ))}
        </ul>
      )}

      {!isLoading && !error && filesFound.length === 0 && (
        <ul>
          {" "}
          <li className="file-list-item" style={{ fontStyle: "italic" }}>
            No files found matching your criteria.
          </li>
        </ul>
      )}

      {fileContent !== null && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          content={fileContent}
          title={currentFileTitle}
        />
      )}
    </div>
  );
};

export default Home;
