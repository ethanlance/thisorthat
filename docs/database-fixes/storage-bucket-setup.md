# Storage Bucket Setup - Fixed ✅

## Issue #3: Bucket Not Found (404)

**Error:**
```
{statusCode: "404", error: "Bucket not found", message: "Bucket not found"}
```

**Problem:**
The application code references a Supabase Storage bucket called `poll-images`, but it didn't exist in the Supabase project.

---

## Solution Applied

Created the storage bucket with proper configuration and RLS policies.

### Bucket Configuration

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'poll-images',
  'poll-images',
  true,  -- Public bucket (images accessible to everyone)
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);
```

**Bucket Settings:**
- **Name:** `poll-images`
- **Access:** Public (read-only for everyone)
- **File Size Limit:** 5MB per file
- **Allowed Types:** JPEG, JPG, PNG, GIF, WebP

---

### Storage Policies

| Policy Name | Action | Description |
|-------------|--------|-------------|
| Public Access | SELECT | Anyone can view/download images |
| Authenticated users can upload poll images | INSERT | Logged-in users can upload |
| Users can update their poll images | UPDATE | Authenticated users can update |
| Users can delete their poll images | DELETE | Authenticated users can delete |

---

## How Image Upload Works

1. **User selects images** → Client validates file type and size
2. **Poll created** → Uses placeholder URLs (from previous fix)
3. **Images upload to Supabase Storage** → Stored in `poll-images` bucket
4. **Public URLs generated** → `https://[project].supabase.co/storage/v1/object/public/poll-images/[filename]`
5. **Poll updated** → Placeholder URLs replaced with real URLs
6. **Images accessible** → Anyone can view via public URL

---

## File Naming Convention

Images are stored with this naming pattern:
```
{poll-id}-{option}.{extension}

Examples:
- 123e4567-e89b-12d3-a456-426614174000-a.png  (Option A)
- 123e4567-e89b-12d3-a456-426614174000-b.jpg  (Option B)
```

This ensures:
- ✅ Unique filenames (poll ID is UUID)
- ✅ Easy identification (option a or b)
- ✅ Proper cleanup (can find all images for a poll)

---

## Verification

### Bucket Exists:
```json
{
  "id": "poll-images",
  "name": "poll-images",
  "public": true,
  "file_size_limit": 5242880,
  "allowed_mime_types": ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
}
```

### Policies Active:
- ✅ Public Access (SELECT)
- ✅ Authenticated Upload (INSERT)
- ✅ Authenticated Update (UPDATE)
- ✅ Authenticated Delete (DELETE)

---

## Testing

### Test Image Upload:

1. **Go to Create Poll** (`/poll/create`)
2. **Select two images** (JPEG, PNG, GIF, or WebP under 5MB)
3. **Add labels and description**
4. **Click "Create Poll"**
5. **Expected:** ✅ Poll created, images visible

### Verify in Supabase Dashboard:

1. Go to **Storage** tab in Supabase Dashboard
2. Click **poll-images** bucket
3. Should see uploaded images: `{poll-id}-a.{ext}` and `{poll-id}-b.{ext}`

---

## Next Steps

Poll creation should now work completely end-to-end:

1. ✅ RLS policies fixed (no infinite recursion)
2. ✅ Image URL constraints fixed (placeholder URLs)
3. ✅ Storage bucket created (no 404 errors)

**Ready to create polls!** 🎉

---

## Troubleshooting

### If images still fail to upload:

**Check file size:**
```
Maximum: 5MB per image
Error: "Payload too large"
```

**Check file type:**
```
Allowed: JPEG, JPG, PNG, GIF, WebP
Error: "Invalid mime type"
```

**Check authentication:**
```
Must be logged in to upload
Error: "Not authenticated"
```

---

## Storage Location

**Code reference:**
- `apps/web/src/lib/storage/image-upload.ts` - Upload/delete functions
- Bucket name: `'poll-images'` (hardcoded)

**Supabase Dashboard:**
- Project: `uxjvuvneaqwgtqhovyuw`
- Storage → Buckets → `poll-images`

---

**Status:** ✅ **COMPLETE** - Storage bucket configured and ready
**Applied:** January 27, 2025 via Supabase MCP

