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

## 2026-11-06 - Insecure Data URI Export leading to Data Truncation/Corruption
**Vulnerability:** The CSV export feature used `encodeURI()` with a Data URI (`data:text/csv...`) to trigger the download. This method is insecure and fragile because `encodeURI` does not properly encode characters like `#`, which are interpreted as fragment identifiers by the browser. This could lead to silent data truncation or export failure if users included such characters in their data (e.g., in `groupTag`). Furthermore, Data URIs have strict length limitations in some browsers, potentially breaking exports for users with large transaction histories.

**Learning:** Data URIs should not be used for exporting user-generated content or large files due to encoding complexities and size limits. `encodeURIComponent` is required for Data URIs, but `Blob` objects provide a far more robust, performant, and secure alternative for client-side file generation and downloading.

**Prevention:** Replaced the Data URI construction with a `Blob` containing the CSV content, generated an Object URL using `URL.createObjectURL(blob)`, and used that for the download link. Also ensured memory is freed using `URL.revokeObjectURL(url)`.

## 2026-11-07 - Missing Input Length Limits on Data Imports (DoS Risk)
**Vulnerability:** The data import feature allowed users to upload JSON backup files or paste CSV data of unlimited size. A malicious user or bot could exploit this by providing an excessively large file or text string, which would cause the application to hang or crash when `JSON.parse` or other synchronous parsing operations were executed (Client-Side Denial of Service).

**Learning:** Client-side parsing of large datasets is resource-intensive and blocks the main thread. It's crucial to enforce reasonable upper bounds on file sizes and input lengths before attempting to process or load them into state, protecting the application's availability.

**Prevention:** Enforced a 5MB size limit on the JSON file upload input (`file.size > 5 * 1024 * 1024`) and added a `maxLength={5000000}` attribute to the raw text input areas in `BackupRestoreModal` and `ImportModal`.

## 2026-11-07 - Memory Leak in Backup Export
**Vulnerability:** The backup export feature generated a `Blob` containing the user's transaction data and created an Object URL using `URL.createObjectURL(blob)`, but failed to call `URL.revokeObjectURL(url)` after the download was triggered. This caused the sensitive transaction data to remain in memory for the lifetime of the document, increasing the risk of data exposure if the browser memory was inspected or dumped.

**Learning:** Object URLs are a convenient way to trigger client-side downloads, but they tie up memory and can linger indefinitely if not explicitly cleaned up.

**Prevention:** Added `URL.revokeObjectURL(url)` immediately after triggering the download click event in `BackupRestoreModal` to ensure the memory is freed and sensitive data is purged from the browser's active memory pool.

## 2026-11-08 - User Enumeration via Authentication Error Messages
**Vulnerability:** The login form returned distinct error messages for "user not found" (`auth/user-not-found`) and "wrong password" (`auth/wrong-password`). An attacker could exploit this to determine whether a specific email address is registered in the system (User Enumeration), which aids in targeted phishing or credential stuffing attacks.

**Learning:** Authentication endpoints must never reveal whether an account exists or not during a failed login attempt. The feedback provided to the user should be identical regardless of whether the username was wrong or the password was wrong.

**Prevention:** Consolidate error messages for invalid credentials into a single, generic message like "账号密码不正确，请重试" (Invalid email or password).

## 2026-11-09 - High Severity Vulnerabilities via Outdated Networking Dependency
**Vulnerability:** The project relied on `umi-request`, a networking library that brought in multiple high-severity vulnerabilities through its dependencies (`node-fetch` and `isomorphic-fetch`). These dependencies had known CVEs (e.g. `node-fetch` forwards secure headers to untrusted sites), posing significant security risks to the application.

**Learning:** Third-party libraries, especially those handling networking or sensitive operations, can quickly become vectors for attack if their dependency chains are not actively maintained. When native APIs (like `fetch`) are available and sufficient, using them reduces the attack surface and dependency management overhead.

**Prevention:** Removed `umi-request` and its vulnerable dependencies. Refactored the network request wrapper (`src/utils/request.ts`) to use the native `fetch` API directly, eliminating the vulnerability while preserving functionality.

## 2026-11-10 - Missing Timeouts on External API Calls (DoS Risk)
**Vulnerability:** The native `fetch` API implementation in the network request wrapper (`src/utils/request.ts`) lacked explicit timeouts. If an external API or service became unresponsive, the requests would hang indefinitely, potentially exhausting client resources, freezing parts of the UI, or making the application vulnerable to slow-rate Denial of Service (DoS) behaviors.

**Learning:** Unlike some legacy networking libraries (like `axios` or `umi-request`), the native `fetch` API does not have a default timeout mechanism. Security and stability in depth require explicitly bounding the maximum duration of any external operation to protect client availability.

**Prevention:** Implemented an `AbortController` coupled with a `setTimeout` in the request wrapper to force an abort signal if the `fetch` call exceeds a safe duration (default 10s), ensuring all requests fail securely and predictably rather than hanging indefinitely.

## 2026-11-11 - Information Leakage via Error Messages
**Vulnerability:** The application's error handling utility (`getFirebaseErrorMessage`) returned raw, unhandled error strings directly to the user when an unexpected authentication error occurred. This could expose sensitive backend details, such as API keys, internal IDs, or stack traces, to the client interface.
**Learning:** Security by default dictates that error messages shown to users should always be generic and safe. Any detailed error information needed for debugging must be securely logged internally (e.g., to the console or an error tracking service) and never echoed directly back to the client UI.
**Prevention:** Modified `getFirebaseErrorMessage` to log unhandled errors securely to `console.error` while returning a generic fallback message ("发生未知错误，请稍后重试"). Also added a type check before calling `.includes` on the error object to prevent client-side crashes when the error is not a string.
