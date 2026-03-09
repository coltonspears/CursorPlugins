---
name: code-review
description: Perform a structured code review on staged or recent changes. Use when the user asks for a review, CR, or feedback on their code.
---

# Code review

## Trigger

The user asks for a code review, feedback on changes, or help improving code quality.

## Workflow

1. Identify the files that changed (use git diff or staged files).
2. For each file, check for:
   - Correctness — logic errors, off-by-one, null handling.
   - Clarity — naming, structure, unnecessary complexity.
   - Consistency — follows project conventions and existing patterns.
   - Security — injection risks, secret exposure, unsafe deserialization.
3. Group findings by severity: blocking, suggestion, nit.
4. Present a summary table followed by per-file details.

## Output

A markdown review with:
- Summary table (file, severity, finding)
- Per-file sections with line references and suggested fixes
- An overall verdict: approve, request changes, or comment only
