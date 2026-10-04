# SmartCare Disaster Recovery & Business Continuity

## Backup Strategy
1. **Automated Continuous Backups**: Managed by Supabase with Point-In-Time Recovery (PITR) enabled.
2. **Schema Invariants**: The authoritative schema is stored in Git at `supabase/migrations/`. In a catastrophic loss scenario, the schema can be re-instantiated in seconds using `supabase db reset` or `supabase db push`.

## Key Recovery & Vault Safety
- User master keys are protected using client-side cryptographic split seeds (`recovery_seeds`) and multi-factor recovery codes (`mfa_recovery_codes`).
- In disaster recovery, encrypted master keys in `vault_entries` cannot be decrypted without client authentication keys.

> **CRITICAL RULE**:
> Production database schema is migration-controlled. Never modify production schema manually.
