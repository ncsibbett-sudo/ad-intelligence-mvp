# Supabase Migrations

This directory contains database migrations for the Ad Intelligence platform.

## How to Run Migrations

### Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the migration file
4. Paste and run the SQL

### Using Supabase CLI (Alternative)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

## Migration Files

### `20241120_add_google_ads_fields.sql`

**Purpose**: Adds Google Ads OAuth and account fields to the users table

**Changes**:
- Adds `google_refresh_token` column (TEXT)
- Adds `google_access_token` column (TEXT)
- Adds `google_token_expires_at` column (TIMESTAMP WITH TIME ZONE)
- Adds `google_customer_id` column (TEXT)
- Adds `google_account_name` column (TEXT)
- Creates index on `google_customer_id`

**When to run**: Before deploying Google Ads integration features

**Rollback**: Use `20241120_add_google_ads_fields_rollback.sql`

## Migration Strategy

### Phase 1: Add Google Integration (Current)
- ✅ Add Google Ads columns to users table
- ✅ Keep Meta fields for backward compatibility
- Deploy Google Ads features alongside Meta

### Phase 2: Deprecate Meta (Future)
- Hide Meta UI for new users
- Keep Meta functionality working for existing users
- Show migration prompts

### Phase 3: Remove Meta (Future)
- Remove Meta columns from database
- Delete Meta API routes and client code
- Full transition to Google Ads only

## Best Practices

1. **Always test migrations locally first** using a development Supabase project
2. **Backup your database** before running migrations in production
3. **Run migrations during low-traffic periods**
4. **Keep rollback migrations** for quick recovery if needed
5. **Document all schema changes** in this README

## Verifying Migrations

After running a migration, verify it succeeded:

```sql
-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name LIKE 'google_%';

-- Check if index exists
SELECT indexname
FROM pg_indexes
WHERE tablename = 'users'
AND indexname = 'idx_users_google_customer_id';
```

## Troubleshooting

**Issue**: Migration fails with "column already exists"
- **Solution**: The migration uses `IF NOT EXISTS` clauses, so this shouldn't happen. If it does, the column may have been manually added.

**Issue**: Permission denied
- **Solution**: Ensure you're using the service role key or have sufficient permissions in Supabase dashboard.

**Issue**: Need to rollback a migration
- **Solution**: Run the corresponding `_rollback.sql` file.
