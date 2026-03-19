import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { PublicDropPage } from "./PublicDropPage";

const { mockedApiFetchText, MockApiError } = vi.hoisted(() => {
  class HoistedMockApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  }

  return {
    mockedApiFetchText: vi.fn(),
    MockApiError: HoistedMockApiError,
  };
});

vi.mock("../lib/api", () => ({
  ApiError: MockApiError,
  apiFetchText: (...args: unknown[]) => mockedApiFetchText(...args),
}));

function renderPage(path = "/drops/drop-1/public") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/drops/:id/public" element={<PublicDropPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PublicDropPage", () => {
  beforeEach(() => {
    mockedApiFetchText.mockReset();
  });

  it("shows the loading shell before the public HTML resolves", () => {
    mockedApiFetchText.mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(screen.getByText("Preparing the public launch page")).toBeInTheDocument();
    expect(screen.getByText("Loading drop")).toBeInTheDocument();
  });

  it("shows a coming-soon shell for unpublished drops", async () => {
    mockedApiFetchText.mockRejectedValue(new MockApiError("Not found", 404));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("This drop exists, but it is not public yet")).toBeInTheDocument();
    });

    expect(screen.getByText("Waiting for publish")).toBeInTheDocument();
    expect(screen.getByText("Public URL")).toBeInTheDocument();
  });

  it("shows an error shell when the public drop request fails", async () => {
    mockedApiFetchText.mockRejectedValue(new MockApiError("Server unavailable", 500));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("This public drop could not be loaded")).toBeInTheDocument();
    });

    expect(screen.getByText("Server unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("keeps the generated HTML as the main experience when published", async () => {
    mockedApiFetchText.mockResolvedValue("<html><body>Live launch</body></html>");

    renderPage();

    await waitFor(() => {
      expect(mockedApiFetchText).toHaveBeenCalledWith("/public/drops/drop-1", {
        skipAuth: true,
      });
    });

    expect(screen.getByText("Live drop")).toBeInTheDocument();
    expect(screen.getByTitle("Published drop")).toHaveAttribute(
      "srcdoc",
      "<html><body>Live launch</body></html>"
    );
  });
});
