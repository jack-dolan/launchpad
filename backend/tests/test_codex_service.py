import pytest

from app.codex_service import LandingPageValidationError, validate_landing_page_html


def test_validate_landing_page_html_accepts_valid_document() -> None:
    html = """
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Launchpad</title>
        <style>body { font-family: sans-serif; }</style>
      </head>
      <body>
        <h1>Ready</h1>
        <script>console.log("inline");</script>
      </body>
    </html>
    """

    validated = validate_landing_page_html(html)

    assert validated.startswith("<!DOCTYPE html>")
    assert "<body>" in validated


def test_validate_landing_page_html_rejects_malformed_document() -> None:
    with pytest.raises(
        LandingPageValidationError,
        match="full HTML document",
    ):
        validate_landing_page_html("<section>Only a fragment</section>")


def test_validate_landing_page_html_rejects_external_dependencies() -> None:
    html = """
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.example.com/app.js"></script>
      </head>
      <body>
        <h1>External dependency</h1>
      </body>
    </html>
    """

    with pytest.raises(
        LandingPageValidationError,
        match="external scripts",
    ):
        validate_landing_page_html(html)
