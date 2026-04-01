# Morrison Consulting Website

## Overview
Personal consulting website for Tony Morrison — Transformation & Programme Director.
Static single-page site with no build tools or framework.

## Architecture
- Single `index.html` file with inline CSS and JS (no separate files)
- CSS custom properties defined in `:root` for theming
- Fonts: Playfair Display (headings), DM Sans (body) via Google Fonts
- Color scheme: dark background (#1A1A1A), gold accent (#D4A017), white text

## Development
- No build step — edit `index.html` directly
- Open in browser to preview: `open index.html` or use a local server
- No dependencies or package manager

## Style Guidelines
- Use existing CSS custom variables (--black, --gold, --white, --off-white, etc.)
- Use existing font variables (--font-display, --font-body)
- Maintain responsive design patterns already in place
- Keep all CSS and JS inline within index.html

## Assets
- `headshot.jpg` — profile photo
