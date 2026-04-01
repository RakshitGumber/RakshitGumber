---
name: portfolio-repo-guidelines
description: Repo-local guidance for working in this portfolio app. Use when editing this codebase, especially web/Vite/TanStack Router changes, dependency or config updates, and scoped feature work that must preserve the existing theme/router stack and avoid touching unrelated files.
---

Work in this repository with minimal, scoped changes.

## Rules

- Read the current file contents first and assume other workers may have concurrent edits.
- Edit only the files required by the request. Do not touch routes, components, or features outside scope.
- Use `apply_patch` for manual edits.
- Preserve the existing web stack: Vite, React 19, TanStack Router, Tailwind 4, Framer Motion, Lenis, and the current theme/provider setup.
- When adding tooling such as MDX, keep the change local to `web/package.json`, `web/vite.config.ts`, and type shims unless the task explicitly asks for more.
- Prefer additive changes over rewrites. Keep config diffs small and easy to review.
- Never revert or overwrite edits you did not make.
- After editing, report the exact files changed.
