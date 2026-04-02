# Markdown for Slackers

Paste markdown from Claude Code, GitHub, or anywhere else — get Slack-ready output.

**[Open it](https://m-rk.github.io/markdown-for-slackers/)** — or just open `index.html` in a browser. No build step, no dependencies.

## What it does

Converts markdown to Slack's mrkdwn format:

| Markdown | Slack |
|---|---|
| `**bold**` | `*bold*` |
| `_italic_` | `_italic_` |
| `~~strike~~` | `~strike~` |
| `# Heading` | `*Heading*` |
| `[text](url)` | `<url\|text>` |
| `- item` | `• item` |
| `---` | `———` |
| ` ``` `code` ``` ` | ` ``` `code` ``` ` (lang stripped) |
| Tables | Fixed-width code block |

Two output modes:
- **Copy as mrkdwn** — plain text for Slack's message box
- **Copy as Rich Text** — HTML for the clipboard so bold, italic, code, and links paste with formatting intact

## Options

- **Strip leading whitespace** — removes the leading space Ghostty and other terminals add when copying (default: on). With this off, lines starting with a space are treated as plain text per the markdown spec — so ` ### Heading` won't be converted to bold.
- **Unwrap soft line breaks** — merges terminal-wrapped lines back into paragraphs (default: on)
- **Strip ANSI codes** — removes terminal escape sequences (default: on)
- **Normalize code block indent** — re-indents code blocks to 2 spaces (default: on)

## Tips

- In Ghostty, use `Cmd+Shift+C` to copy without trailing soft linebreaks
- In Slack, use `Shift+Enter` for a newline without sending
