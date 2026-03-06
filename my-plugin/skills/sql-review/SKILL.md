---
name: sql-review
description: Review SQL Server scripts, stored procedures, and migrations for correctness, performance, and team conventions. Use when working in a database repository.
profiles: [sql]
---

# SQL review

## Trigger

The user is writing or modifying SQL Server scripts, stored procedures, functions, or migration files.

## Workflow

1. Identify the type of change: DDL (schema), DML (data), stored procedure, function, or migration.
2. Check for correctness:
   - Verify column types, nullability, and default constraints.
   - Ensure foreign key relationships are valid.
   - Confirm idempotency for migrations (IF NOT EXISTS guards).
3. Check for performance:
   - Flag missing indexes on columns used in WHERE, JOIN, or ORDER BY.
   - Warn about SELECT * usage.
   - Identify implicit conversions in predicates.
   - Flag cursors — prefer set-based operations.
4. Check for safety:
   - Destructive operations (DROP, TRUNCATE) must have explicit confirmation.
   - Data migrations must be reversible or documented as one-way.
   - No dynamic SQL without parameterization (SQL injection risk).
5. Verify naming conventions (see sql-conventions rule).

## Output

A structured review with:
- Summary of the change and its risk level (low / medium / high)
- Specific findings with line references
- Suggested improvements or rewrites
