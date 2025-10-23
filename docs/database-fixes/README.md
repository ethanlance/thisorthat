# Database Fix: Poll Shares RLS Infinite Recursion

## Problem

When fetching polls, you're getting this error:
```
"infinite recursion detected in policy for relation \"poll_shares\""
```

### Root Cause

The RLS policies have a **circular dependency**:

1. `polls` table SELECT policy checks: `id IN (SELECT poll_id FROM poll_shares WHERE user_id = auth.uid())`
2. `poll_shares` table SELECT policy likely checks: `poll_id IN (SELECT id FROM polls WHERE ...)`
3. This creates an infinite loop: **polls → poll_shares → polls → poll_shares → ...**

## Solution

The `poll_shares` table RLS policies must **NOT reference the `polls` table** to break the circular dependency.

### Steps to Fix

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to **SQL Editor**

2. **Run the fix script**
   - Copy the contents of `fix-poll-shares-rls.sql` in this directory
   - Paste into SQL Editor
   - Click **Run** or press `Cmd/Ctrl + Enter`

3. **Verify the fix**
   - Go back to your application
   - Refresh the page
   - Try creating a poll again
   - The error should be resolved

### What the fix does

- **Removes** any existing `poll_shares` policies that reference `polls`
- **Creates** simple policies that only check `user_id` and `shared_by` fields
- **Delegates** poll ownership checks to the application layer (your services)
- **Trusts** PostgreSQL foreign key constraints for data integrity

### After the fix

Your RLS policies will work like this:

```
polls table:
  ✅ Can reference poll_shares (SELECT poll_id FROM poll_shares)

poll_shares table:
  ❌ CANNOT reference polls (breaks circular dependency)
  ✅ Can only check user_id and shared_by columns
```

## Alternative Quick Fix (if you're in a hurry)

If you need to unblock development immediately, you can temporarily disable RLS on `poll_shares`:

```sql
-- WARNING: This makes poll_shares readable by anyone
-- Only use for development, NOT production
ALTER TABLE poll_shares DISABLE ROW LEVEL SECURITY;
```

**Remember to re-enable RLS later with the proper policies!**

## Verification

After applying the fix, test these scenarios:

1. ✅ Create a new poll (should work now)
2. ✅ View public polls on homepage
3. ✅ Vote on a poll
4. ✅ View poll results

If you still see errors, check the Supabase logs for more details.

