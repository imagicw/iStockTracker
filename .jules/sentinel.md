## 2024-05-23 - Client-side Password Validation
**Vulnerability:** Weak password requirements allowed users to create accounts with simple passwords (e.g., "123456"), relying solely on Firebase's default minimal checks (6 characters).
**Learning:** Client-side validation improves security posture and user experience by providing immediate feedback on password complexity rules before even attempting to hit the authentication service.
**Prevention:** Implemented a `validatePassword` function in the Login component to enforce:
- Minimum 8 characters
- At least one letter
- At least one number
This ensures a baseline of password complexity for all new registrations.
