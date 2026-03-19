import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { DropDetailsPage } from "./DropDetailsPage";

const mockedUseToast = vi.fn();
const mockedApiFetch = vi.fn();

vi.mock("../context/ToastContext", () => ({
  useToast: () => mockedUseToast(),
}));

vi.mock("../lib/api", () => ({
  ApiError: class ApiError extends Error {},
  apiFetch: (...args: unknown[]) => mockedApiFetch(...args),
}));

interface MockPromptHistoryEntry {
  role: string;
  content: string;
}

interface MockDropDetails {
  id: string;
  user_id: string;
  name: string;
  description: string;
  vibe: string;
  drop_date: string;
  generated_html: string | null;
  prompt_history: MockPromptHistoryEntry[];
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

function createDrop(overrides: Partial<MockDropDetails> = {}): MockDropDetails {
  return {
    id: "drop-1",
    user_id: "user-1",
    name: "Moonfall Runner",
    description: "Limited release performance shoe with cinematic launch visuals.",
    vibe: "cyberpunk",
    drop_date: "2026-04-01T12:00:00.000Z",
    generated_html: null,
    prompt_history: [],
    status: "draft",
    created_at: "2026-03-18T12:00:00.000Z",
    updated_at: "2026-03-18T12:00:00.000Z",
    ...overrides,
  };
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/drops/drop-1"]}>
      <Routes>
        <Route path="/drops/:id" element={<DropDetailsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("DropDetailsPage", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    mockedUseToast.mockReset();

    mockedUseToast.mockReturnValue({
      showError: vi.fn(),
      showSuccess: vi.fn(),
    });
  });

  it("keeps the empty preview and primary actions usable before any HTML exists", async () => {
    mockedApiFetch.mockResolvedValueOnce(createDrop());

    renderPage();

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/drops/drop-1");
    });

    expect(screen.getByRole("button", { name: "Generate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Desktop" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Compare" })).toBeDisabled();
    expect(screen.getByText("First render pending")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open public page" })).toHaveAttribute(
      "href",
      expect.stringContaining("/drops/drop-1/public")
    );
    expect(screen.getByText("Generation activity")).toBeInTheDocument();
    expect(screen.getAllByText("Ready for first render").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/generated programmatically by a runtime agent connected to codex/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Last updated")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide details" }));

    expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
    expect(screen.queryByText("Latest prompt")).not.toBeInTheDocument();
  });

  it("shows the latest prompt and earlier prompts after a successful iteration", async () => {
    mockedApiFetch
      .mockResolvedValueOnce(
        createDrop({
          generated_html: "<html><body>Original</body></html>",
          prompt_history: [{ role: "user", content: "Create the first draft." }],
        })
      )
      .mockResolvedValueOnce({
        html: "<html><body>Updated</body></html>",
        prompt_used: "Make the countdown feel bigger.",
      });

    renderPage();

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/drops/drop-1");
    });

    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));
    expect(screen.getByRole("button", { name: "Mobile" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.change(screen.getByPlaceholderText(/make the countdown bigger/i), {
      target: { value: "Make the countdown feel bigger." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iterate" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/drops/drop-1/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: "Make the countdown feel bigger." }),
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Compare" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });

    expect(screen.getByText("Latest draft ready")).toBeInTheDocument();
    expect(screen.getByText("Latest prompt")).toBeInTheDocument();
    expect(screen.getByText("Make the countdown feel bigger.")).toBeInTheDocument();
    expect(screen.getByText("Previous prompts")).toBeInTheDocument();
    expect(screen.getByText("Create the first draft.")).toBeInTheDocument();
    expect(screen.getByText("Previous version")).toBeInTheDocument();
    expect(screen.getByText("Current version")).toBeInTheDocument();
    expect(screen.getByTitle("Moonfall Runner previous preview")).toBeInTheDocument();
    expect(screen.getByTitle("Moonfall Runner current preview")).toBeInTheDocument();
  });

  it("shows a launch-success banner after publishing", async () => {
    mockedApiFetch
      .mockResolvedValueOnce(
        createDrop({
          generated_html: "<html><body>Original</body></html>",
        })
      )
      .mockResolvedValueOnce(
        createDrop({
          generated_html: "<html><body>Original</body></html>",
          status: "published",
        })
      );

    renderPage();

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/drops/drop-1");
    });

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/drops/drop-1/publish", {
        method: "POST",
      });
    });

    expect(screen.getByText("Launch is live")).toBeInTheDocument();
    expect(screen.getByText("The public drop page is now live.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy public URL" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open public page" })[0]).toHaveAttribute(
      "href",
      expect.stringContaining("/drops/drop-1/public")
    );
  });
});
