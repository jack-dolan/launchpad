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
});
