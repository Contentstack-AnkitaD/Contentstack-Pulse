# API Notes

## Contentstack Management API

- **Base:** `https://api.contentstack.io`
- **Auth:** Management token (or API key + token) in headers.
- **Use:** Fetch entries, content types, assets, and references for the health audit.
- **Start:** Fetch entries (and schemas) first; everything else builds on that.

## Gemini (Google AI Studio)

- **Audit prompt:** Send a sample of flagged entries (JSON); ask for top 3 health problems, priority order, and one-line fix per issue type. Output drives the AI Insights panel.
- **Chatbot prompt:** Send user message + stack alias; expect JSON: `{ "command", "explanation", "safe" }`. Use `command` for CLI execution; if `safe: false`, show confirmation before running.

## CLI Bridge (Node.js)

- Use `child_process.exec()` (or `execSync`) to run `csdx` commands.
- Pass stack alias and args as in the PRD (e.g. `csdx cm:entries:export --content-type [ct]`).
- Stream or capture stdout/stderr and return to the chat UI.
