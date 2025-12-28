**Series A Technical Appendix**

- **Five-point investor summary**

1. Cryptographic Isolation: SmartCare stores patient PII and encrypted medical payloads such that the plaintext master keys never coexist with authentication credentials. Master keys are client-generated and stored only as wrapped blobs in an isolated vault table; application servers only hold wrapped key material and cannot decrypt PII without user possession of the unwrapped master key.

2. Asymmetric Identity: All sessions and service-level assertions use RS256 asymmetric JWTs. Private keys are stored in a secure secrets manager and rotated via CI, while public keys are embedded in audit records and exported artifacts to ensure non-repudiation and traceability.

3. Metadata Minimization: Audit logs record minimal actionable metadata. IP addresses are pseudonymized using HMAC-SHA256 with a rotated encryption key; timestamps and minimal role/context are retained for auditability while removing direct identifiers.

4. Defense-in-Depth: Cookie-based HttpOnly Secure SameSite session tokens, strict CORS, HSTS, CSP, rate limiting, and fail-secure startup checks (service refuses to start without required keys) reduce attack surface and prevent accidental data leaks.

5. Recovery and Sovereignty: Users hold keys to their data. Recovery codes and MFA provide controlled, auditable recovery paths that are one-time-use and server-logged. Administrative access cannot retroactively decrypt user vaults without cooperating with the key holder.


- **Definitions in SmartCare context**

**Cryptographic Isolation**: The separation of raw plaintext secrets (user master keys) from authentication and application logic. In SmartCare this is implemented by client-side key generation and encryption, server-side storage of only wrapped master keys in the `vault_keys`/`vault_entries` table, and never writing unwrapped master keys to database or logs.

**Asymmetric Identity**: Using public/private key pairs for identity assertions. The server issues RS256-signed tokens with a private key that never leaves a secure vault. Verification is done with the public key; signatures and public key fingerprints are embedded in exported FHIR bundles for traceability.

**Metadata Minimization**: Recording only the minimum metadata necessary for auditing and operational needs. SmartCare pseudonymizes IPs and avoids storing extraneous personally identifiable attributes in audit logs or exported telemetry, reducing the blast radius in case of compromise.
