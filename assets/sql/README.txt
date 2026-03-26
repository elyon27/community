# CrownMind Supabase Backend + Admin Helpers

This package contains the Join Circle backend plus admin-friendly SQL helpers.

## Run in this order
1. `schema-community-join.sql`
2. `schema-community-join-admin.sql`

## What the admin SQL adds
- `community_join_dashboard` view
- `community_join_stats` view
- `community_join_daily_rollup` view
- optional commented admin read policy
- sample SQL in `admin-queries.sql`

## Recommended Supabase usage
Open **SQL Editor** and run the schema files. Then test with:

```sql
select * from public.community_join_dashboard limit 50;
select * from public.community_join_stats order by metric;
```

## Important security note
Do **not** expose a service role key in frontend code.
If you later want a real web-based admin panel, use:
- Supabase Auth for admin login
- a server route or protected app page
- RLS read policy limited to your admin account(s)
