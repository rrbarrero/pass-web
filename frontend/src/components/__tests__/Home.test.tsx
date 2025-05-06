import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PassFile } from "../../domain/passFile";
import Home from "../Home";

const mockLogoutFn = vi.fn();
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ logout: mockLogoutFn, token: "fake-token" }),
}));

const mockSearchFileFn = vi.fn();
let mockReturnedFiles: PassFile[] = [];
let mockIsLoading = false;
let mockError: string | null = null;

vi.mock("../../hooks/useFileRepository", () => ({
  default: () => ({
    filesFound: mockReturnedFiles,
    searchFile: mockSearchFileFn,
    isLoading: mockIsLoading,
    error: mockError,
  }),
}));

describe("Home Component (with hook mocked)", () => {
  beforeEach(() => {
    mockReturnedFiles = [];
    mockIsLoading = false;
    mockError = null;
    vi.clearAllMocks();
  });

  it("should call searchFile when form is submitted", async () => {
    const user = userEvent.setup();
    render(<Home />);
    const input = screen.getByLabelText(/needle:/i);
    const button = screen.getByRole("button", { name: /search/i });
    await user.type(input, "test");
    await user.click(button);
    expect(mockSearchFileFn).toHaveBeenCalledWith("test");
  });

  it("should display loading state", () => {
    mockIsLoading = true;
    render(<Home />);
    expect(screen.getByText(/loading results.../i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /searching.../i })
    ).toBeDisabled();
    expect(screen.getByLabelText(/needle:/i)).toBeDisabled();
  });

  it("should display error state", () => {
    mockError = "Network Failed";
    render(<Home />);
    expect(screen.getByText(/error: network failed/i)).toBeInTheDocument();
  });

  it("should display files when found", () => {
    mockReturnedFiles = [{ fullPath: "a.txt", fileName: "a" }];
    render(<Home />);
    expect(screen.getByRole("listitem")).toHaveTextContent("a.txt");
  });

  it("should call logout when button clicked", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: /close session/i }));
    expect(mockLogoutFn).toHaveBeenCalled();
  });
});
