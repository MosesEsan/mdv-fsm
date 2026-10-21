-- Trusted server-side admin clients write through the same trigger functions as
-- authenticated users. Let service_role resolve those private trigger helpers;
-- it already bypasses RLS and is never exposed to clients.
grant usage on schema private to service_role;
