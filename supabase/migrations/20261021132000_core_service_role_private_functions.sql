-- Server-side admin clients must be able to execute private helpers reached by
-- table triggers. service_role is a backend-only secret and already bypasses RLS.
grant execute on all functions in schema private to service_role;
alter default privileges in schema private grant execute on functions to service_role;
