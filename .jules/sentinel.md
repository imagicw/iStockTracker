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

## 2026-02-21 - Unsanitized CSV/Text Import
**Vulnerability:** The "Paste Excel/CSV Data" feature in `ImportModal` parsed raw text and directly inserted it into the application state without any sanitization or validation. This bypassed the existing security controls used for JSON backups, allowing potential Stored XSS or Denial of Service via malformed data.

**Learning:** Different entry points for similar data (e.g., JSON restore vs. CSV paste) must share the same validation logic. Consistency is key to avoiding security gaps.

**Prevention:** Refactored `src/utils/validation.ts` to export a reusable `sanitizeTransactionInput` function and integrated it into both the JSON restore and the CSV/Text import flows.

## 2026-07-02 - Missing Input Length Limits on Authentication (DoS Risk)
**Vulnerability:** The login and registration form inputs for email and password lacked maximum length boundaries. An attacker or a misbehaving bot could submit exceedingly large strings, potentially causing ReDoS (Regular Expression Denial of Service) during client-side regex checks or backend hash exhaustion leading to DoS.

**Learning:** It is easy to assume backend services will reject overly large payloads, but handling those payloads securely without consuming excessive resources is not guaranteed. Defense in depth demands that client applications proactively cap user input size before it triggers regex processing or API calls.

**Prevention:** Added strict `maxLength` attributes to all authentication input fields (`maxLength={255}` for email and `maxLength={128}` for password) in the `Login.tsx` component to enforce sensible boundaries directly at the point of entry.
