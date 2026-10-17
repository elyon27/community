-- Read-only setup verification; run in Community after setup.
select tablename, rowsecurity from pg_tables
where schemaname='public' and tablename in ('community_profiles','community_chamber_entries');
select tablename, policyname, cmd, roles, qual, with_check from pg_policies
where schemaname='public' and tablename in ('community_profiles','community_chamber_entries');
select grantee,table_name,privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name in ('community_profiles','community_chamber_entries')
and grantee in ('anon','authenticated') order by table_name,grantee,privilege_type;
