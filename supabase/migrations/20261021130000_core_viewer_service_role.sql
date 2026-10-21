-- The viewer write guard runs for every public-table write, including service-role
-- writes used by controlled admin tooling and demo seeds. Run the guard as its
-- owner so it can call private.is_viewer() without exposing the private schema.
alter function private.block_viewer_writes() security definer;
