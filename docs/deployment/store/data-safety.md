# Google Play Data safety — DRAFT

- Collected: name, email address, phone number, user IDs, photos, notes and uploaded job files.
- Purpose: app functionality and account management only.
- Data is associated with the user and their organisation.
- No advertising and no cross-app tracking.
- Data is encrypted in transit; confirm the final at-rest statement with Supabase plan documentation.
- Users cannot self-register. Provide `<ACCOUNT_DELETION_URL>` for deletion requests and document how the platform admin fulfils them.
- Declare Supabase and any later email, crash, analytics or push providers as service providers where the Play form requires it.
- Confirm whether optional photos count as optional collection and whether any diagnostics SDK has been added before submission.
