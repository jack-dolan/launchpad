from __future__ import annotations

import asyncio
import os
import re
from datetime import datetime
from textwrap import dedent

from agents import Agent, Runner
from agents.mcp import MCPServerManager, MCPServerStdio

from app.config import settings

LANDING_PAGE_AGENT_INSTRUCTIONS = dedent(
    """
    You are landing-page-generator, an expert at creating premium eCommerce drop landing pages.

    Use the connected Codex MCP server tools when they help you reason about the implementation,
    but your final answer must always be a complete single-file HTML document with all CSS and
    JavaScript inline.

    The page must:
    - include a hero section with the product name and a compelling tagline
    - include a JavaScript countdown timer that counts down to the drop date
    - include a product description section
    - include a "Notify Me" email capture form with client-side behavior only
    - be responsive across desktop and mobile
    - match the requested vibe and aesthetic
    - avoid all external dependencies, fonts, scripts, stylesheets, and images

    Return only the final HTML document. Do not wrap it in Markdown fences. Do not include any
    explanation before or after the HTML.
    """
).strip()

DEFAULT_GENERATION_DIRECTION = "Create the first polished landing page version for this drop."

_codex_manager: MCPServerManager | None = None
_landing_page_agent: Agent[None] | None = None
_service_lock = asyncio.Lock()


def _build_codex_server() -> MCPServerStdio:
    return MCPServerStdio(
        params={
            "command": "npx",
            "args": ["-y", "@openai/codex", "mcp-server"],
        },
        cache_tools_list=True,
        name="codex-mcp-server",
    )


def _build_landing_page_agent(mcp_server: MCPServerStdio) -> Agent[None]:
    return Agent(
        name="landing-page-generator",
        model="gpt-4.1",
        instructions=LANDING_PAGE_AGENT_INSTRUCTIONS,
        mcp_servers=[mcp_server],
    )


async def startup_codex_service() -> None:
    """Start the shared Codex MCP server and landing page agent once for the app lifetime."""
    global _codex_manager, _landing_page_agent

    async with _service_lock:
        if _codex_manager is not None and _landing_page_agent is not None:
            return

        if settings.openai_api_key:
            os.environ.setdefault("OPENAI_API_KEY", settings.openai_api_key)

        codex_server = _build_codex_server()
        manager = MCPServerManager(
            [codex_server],
            connect_in_parallel=True,
            strict=False,
        )
        await manager.connect_all()

        if not manager.active_servers:
            error_messages = "; ".join(str(error) for error in manager.errors.values())
            await manager.cleanup_all()
            raise RuntimeError(
                "Unable to start the Codex MCP server."
                f"{f' {error_messages}' if error_messages else ''}"
            )

        _codex_manager = manager
        _landing_page_agent = _build_landing_page_agent(manager.active_servers[0])


async def shutdown_codex_service() -> None:
    """Cleanup the shared Codex MCP server when the app stops."""
    global _codex_manager, _landing_page_agent

    async with _service_lock:
        manager = _codex_manager
        _codex_manager = None
        _landing_page_agent = None

        if manager is not None:
            await manager.cleanup_all()


async def generate_landing_page(
    name: str,
    description: str,
    vibe: str,
    drop_date: datetime,
    previous_html: str | None = None,
    iteration_prompt: str | None = None,
) -> str:
    """Generate or iterate on a landing page HTML document using the shared Codex-backed agent."""
    await startup_codex_service()

    if _landing_page_agent is None:
        raise RuntimeError("Landing page agent is not available")

    prompt = build_generation_prompt(
        name=name,
        description=description,
        vibe=vibe,
        drop_date=drop_date,
        previous_html=previous_html,
        iteration_prompt=iteration_prompt,
    )

    result = await Runner.run(_landing_page_agent, prompt, max_turns=20)
    try:
        final_output = result.final_output_as(str, raise_if_incorrect_type=True)
    finally:
        result.release_agents()

    return extract_html_document(final_output)


def build_generation_prompt(
    name: str,
    description: str,
    vibe: str,
    drop_date: datetime,
    previous_html: str | None = None,
    iteration_prompt: str | None = None,
) -> str:
    """Build the user prompt sent to the landing page generator agent."""
    drop_date_text = drop_date.isoformat()
    creative_direction = (iteration_prompt or "").strip()

    if previous_html and creative_direction:
        return dedent(
            f"""
            Update the existing landing page HTML for this product drop.

            Drop brief:
            - Product name: {name}
            - Description: {description}
            - Vibe: {vibe}
            - Drop date: {drop_date_text}

            Change request:
            {creative_direction}

            Existing HTML:
            ```html
            {previous_html}
            ```

            Keep the result as a single self-contained HTML file with inline CSS and JavaScript.
            Preserve any working countdown or notify-form behavior unless the change request
            explicitly asks you to replace it.
            Return only the full updated HTML document.
            """
        ).strip()

    direction = creative_direction or DEFAULT_GENERATION_DIRECTION
    return dedent(
        f"""
        Create a landing page from scratch for this product drop.

        Drop brief:
        - Product name: {name}
        - Description: {description}
        - Vibe: {vibe}
        - Drop date: {drop_date_text}
        - Additional creative direction: {direction}

        Build a premium single-file HTML landing page with inline CSS and JavaScript only.
        Return only the final HTML document.
        """
    ).strip()


def extract_html_document(output: str) -> str:
    """Extract a clean HTML document from the agent response."""
    stripped_output = output.strip()

    fenced_match = re.search(
        r"```(?:html)?\s*(<!DOCTYPE html>.*?</html>|<html.*?</html>)\s*```",
        stripped_output,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if fenced_match:
        return fenced_match.group(1).strip()

    document_match = re.search(
        r"(<!DOCTYPE html>.*?</html>|<html.*?</html>)",
        stripped_output,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if document_match:
        return document_match.group(1).strip()

    if stripped_output.lower().startswith("<!doctype html>") or stripped_output.lower().startswith(
        "<html"
    ):
        return stripped_output

    raise RuntimeError("Codex did not return a valid HTML document")
