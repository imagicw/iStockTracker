## 2026-01-31 - CSV Injection in Export
**Vulnerability:** The CSV export function in `StockTracker` was vulnerable to Formula Injection (CSV Injection). If a user entered a stock name or other field starting with `=`, `+`, `-`, or `@`, the exported CSV file could execute arbitrary formulas when opened in Excel, potentially leading to command execution.

**Learning:** Client-side data exports must be sanitized just like server-side inputs. Even if the data comes from a "trusted" database, if the user controlled the input originally, it can be malicious when re-exported.

**Prevention:** Sanitize all fields during CSV export by prepending a single quote `'` to any field starting with injection characters (`=`, `+`, `-`, `@`, `\t`, `\r`). Also ensure proper CSV escaping (wrapping in double quotes and escaping internal quotes).

## 2026-06-15 - Insecure Data Restore in Backup
**Vulnerability:** The data restore function blindly trusted user-provided JSON content. A malicious file could introduce invalid data types, perform Mass Assignment (overwriting fields not intended to be modifiable), or cause application instability.

**Learning:** Client-side data restore features are effectively "file uploads" and must be treated with the same scrutiny as server-side inputs. Never trust the structure or content of imported data.

**Prevention:** Implemented strict schema validation and sanitization (`validateImportData`) for all imported data. Whitelisted allowed fields and enforced type checks before processing.

## 2026-06-16 - Missing Client-Side Password Policy
**Vulnerability:** The application allowed registration with weak passwords (e.g., "123456") directly via `registerWithEmail`, relying solely on the backend provider's minimum requirements. This could lead to account compromise through credential stuffing or brute-force attacks.

**Learning:** Authentication providers (like Firebase) handle storage securely but may not enforce strict password complexity policies by default. Client-side validation is a necessary first line of defense.

**Prevention:** Implemented a robust `validatePassword` utility enforcing minimum length, mixed case, and numeric characters. Integrated this validation into the registration flow to reject weak passwords before API submission.
