## 2026-01-31 - CSV Injection in Export
**Vulnerability:** The CSV export function in `StockTracker` was vulnerable to Formula Injection (CSV Injection). If a user entered a stock name or other field starting with `=`, `+`, `-`, or `@`, the exported CSV file could execute arbitrary formulas when opened in Excel, potentially leading to command execution.

**Learning:** Client-side data exports must be sanitized just like server-side inputs. Even if the data comes from a "trusted" database, if the user controlled the input originally, it can be malicious when re-exported.

**Prevention:** Sanitize all fields during CSV export by prepending a single quote `'` to any field starting with injection characters (`=`, `+`, `-`, `@`, `\t`, `\r`). Also ensure proper CSV escaping (wrapping in double quotes and escaping internal quotes).
