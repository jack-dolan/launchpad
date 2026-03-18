import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AuthProvider, useAuth } from "./AuthContext";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function AuthHarness() {
  const { isAuthenticated, login, user } = useAuth();

  return (
    <div>
      <button
        type="button"
        onClick={() => login({ email: "merchant@example.com", password: "super-secret" })}
      >
        Trigger Login
      </button>
      <span>{isAuthenticated ? user?.email : "signed-out"}</span>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("stores the token and loads the current user after login", async () => {
    const responses = [
      {
        ok: true,
        status: 200,
        json: async () => ({ access_token: "test-token", token_type: "bearer" }),
      },
      {
        ok: true,
        status: 200,
        json: async () => ({
          id: "user-1",
          email: "merchant@example.com",
          created_at: "2026-03-18T20:00:00Z",
        }),
      },
      {
        ok: true,
        status: 200,
        json: async () => ({
          id: "user-1",
          email: "merchant@example.com",
          created_at: "2026-03-18T20:00:00Z",
        }),
      },
    ];

    const fetchMock = vi
      .spyOn(window, "fetch")
      .mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        const response = responses.shift();

        if (!response) {
          throw new Error("Unexpected fetch call");
        }

        const call: FetchCall = { input, init };
        fetchCalls.push(call);
        return response as Response;
      });

    const fetchCalls: FetchCall[] = [];

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger Login" }));

    await waitFor(() => {
      expect(screen.getByText("merchant@example.com")).toBeInTheDocument();
    });

    expect(window.localStorage.getItem("launchpad.auth.token")).toBe("test-token");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchCalls[0]?.input)).toContain("/auth/login");
    expect(String(fetchCalls[1]?.input)).toContain("/auth/me");
    expect(String(fetchCalls[2]?.input)).toContain("/auth/me");
  });
});
