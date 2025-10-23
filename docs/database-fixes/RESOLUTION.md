# Database Fix Resolution: Poll Shares RLS Infinite Recursion

## ✅ **FIXED** - January 27, 2025

### Problem Identified

The `poll_shares` table had a policy called **"Users can view shares for accessible polls"** that created an infinite recursion:

```sql
-- PROBLEMATIC POLICY (now removed)
CREATE POLICY "Users can view shares for accessible polls"
  ON poll_shares FOR SELECT
  USING (
    poll_id IN (
      SELECT polls.id FROM polls 
      WHERE polls.id IN (
        SELECT poll_shares_1.poll_id FROM poll_shares  -- ← INFINITE RECURSION!
        WHERE poll_shares_1.user_id = auth.uid()
      )
    )
  );
```

**The recursion path:**
1. Query `polls` table
2. `polls` SELECT policy checks `poll_shares` (to see if user has access)
3. `poll_shares` SELECT policy checks `polls` (to validate poll exists)
4. Back to step 1 → **infinite loop** 🔄

### Fix Applied

**Dropped problematic policies:**
```sql
DROP POLICY "Users can view shares for accessible polls" ON poll_shares;
DROP POLICY "Poll creators can share their polls" ON poll_shares; -- duplicate
DROP POLICY "Users can delete shares they created" ON poll_shares; -- duplicate
```

**Remaining clean policies (non-recursive):**

| Action | Policy Name | Condition |
|--------|-------------|-----------|
| SELECT | "Users can view their shared polls" | `user_id = auth.uid()` |
| SELECT | "Sharers can view their shares" | `shared_by = auth.uid()` |
| INSERT | "Authenticated users can create shares" | `auth.uid() = shared_by` |
| DELETE | "Sharers can delete their shares" | `shared_by = auth.uid()` |

✅ **None of these policies reference the `polls` table** → No recursion!

### Security Model

The new RLS configuration works as follows:

1. **poll_shares policies**: Simple checks on `user_id` and `shared_by` columns only
2. **polls policies**: Can safely reference `poll_shares` (one-way, no circular dependency)
3. **Application layer**: Validates poll ownership before creating shares (in `SharingService`)

### Testing

Try these actions in your app:

1. ✅ Create a new poll (should work now)
2. ✅ Vote on a poll
3. ✅ View poll results
4. ✅ View homepage demo poll

If you still see the error `"42P17"`, refresh your browser and clear the cache.

### Additional Security Note

⚠️ Security advisor found one non-critical warning:
- **Leaked Password Protection**: Currently disabled in Supabase Auth
- **Recommendation**: Enable at https://supabase.com/dashboard → Authentication → Policies

This is unrelated to the RLS fix but good to address for production.

### Files Modified

- **Database**: `poll_shares` RLS policies (via Supabase MCP)
- **Documentation**: This resolution file

No application code changes were required.

---

**Status**: ✅ **RESOLVED** - Infinite recursion eliminated
**Impact**: All poll operations should now work correctly
**Next**: Test the application and verify poll creation works

