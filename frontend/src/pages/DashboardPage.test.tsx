import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { DashboardPage } from "./DashboardPage";

const mockedUseAuth = vi.fn();
const mockedUseToast = vi.fn();
const mockedApiFetch = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockedUseAuth(),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => mockedUseToast(),
}));

vi.mock("../lib/api", () => ({
  ApiError: class ApiError extends Error {},
  apiFetch: (...args: unknown[]) => mockedApiFetch(...args),
}));

function createDropSummary() {
  return {
    id: "drop-1",
    name: "Blue Steel Bottle",
    description: "Hydration as a lifestyle object.",
    vibe: "luxury minimal",
    drop_date: "2026-03-20T12:00:00.000Z",
    generated_html: "<html><body>Preview</body></html>",
    prompt_history: [
      { role: "user", content: "Create the first draft." },
      { role: "user", content: "Tighten the headline." },
    ],
    status: "draft" as const,
    created_at: "2026-03-19T10:00:00.000Z",
    updated_at: "2026-03-19T17:25:00.000Z",
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    mockedUseAuth.mockReset();
    mockedUseToast.mockReset();

    mockedUseAuth.mockReturnValue({
      user: { email: "merchant@example.com" },
    });
    mockedUseToast.mockReturnValue({
      showError: vi.fn(),
      showSuccess: vi.fn(),
    });
    mockedApiFetch.mockResolvedValue([]);
  });

  it("prefills the composer from a sample brief preset", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/drops/");
    });

    fireEvent.click(screen.getByRole("button", { name: "Create New Drop" }));

    expect(screen.getByText("Phantom Sprint 01")).toBeInTheDocument();
    expect(screen.getByText("Scoville Syndicate Reserve")).toBeInTheDocument();
    expect(screen.getByText("After Hours Pressing")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Scoville Syndicate Reserve/i }));

    expect(screen.getByLabelText("Name")).toHaveValue("Scoville Syndicate Reserve");
    expect(screen.getByLabelText("Vibe")).toHaveValue("cyberpunk");
    expect(screen.getByLabelText("Merchant brief")).toHaveValue(
      "A chef-led hot sauce collaboration with glossy bottle visuals, scarcity-driven copy, and a launch page tuned for impulse signups and social buzz."
    );
    expect(screen.getByLabelText("Drop date")).not.toHaveValue("");
  });

  it("deletes a drop from the archive", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedApiFetch
      .mockResolvedValueOnce([createDropSummary()])
      .mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Open editor" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete drop" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/drops/drop-1", {
        method: "DELETE",
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Open editor" })).not.toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });
});
