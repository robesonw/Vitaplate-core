import { createClient } from '@supabase/supabase-js';

function getStorage() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ─── Ensure buckets exist ─────────────────────────────────────────────────────
export async function ensureAllBuckets() {
  const supabase = getStorage();
  const buckets = [
    { name: 'lab-results',      public: false },
    { name: 'progress-photos',  public: true  },
    { name: 'recipe-images',    public: true  },
    { name: 'user-uploads',     public: false },
  ];

  for (const bucket of buckets) {
    try {
      const { data: existing } = await supabase.storage.getBucket(bucket.name);
      if (!existing) {
        await supabase.storage.createBucket(bucket.name, {
          public:           bucket.public,
          fileSizeLimit:    20 * 1024 * 1024, // 20MB
          allowedMimeTypes: bucket.name.includes('photo') || bucket.name.includes('image')
            ? ['image/jpeg', 'image/png', 'image/webp']
            : undefined,
        });
        console.log(`✅ Created bucket: ${bucket.name}`);
      }
    } catch (err) {
      console.warn(`⚠️  Bucket ${bucket.name}:`, err.message);
    }
  }
}

// ─── Upload any file ──────────────────────────────────────────────────────────
export async function uploadFile({ buffer, fileName, mimeType, bucket, userId, folder }) {
  const supabase = getStorage();
  const ext      = fileName.split('.').pop() || 'bin';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path     = folder ? `${folder}/${userId}/${safeName}` : `${userId}/${safeName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return { path, publicUrl, fileName: safeName };
}

// ─── Upload progress photo ────────────────────────────────────────────────────
export async function uploadProgressPhoto({ buffer, fileName, mimeType, userId }) {
  return uploadFile({
    buffer, fileName, mimeType, userId,
    bucket: 'progress-photos',
    folder: 'photos',
  });
}

// ─── Upload recipe image ──────────────────────────────────────────────────────
export async function uploadRecipeImage({ buffer, fileName, mimeType, userId }) {
  return uploadFile({
    buffer, fileName, mimeType, userId,
    bucket: 'recipe-images',
    folder: 'recipes',
  });
}

// ─── Get Unsplash food image (free, no auth needed) ──────────────────────────
export async function getFoodImage(query) {
  try {
    // Use Unsplash source API — no auth required, returns a random relevant image
    const cleanQuery = encodeURIComponent(`${query} food meal healthy`);
    const url = `https://source.unsplash.com/400x300/?${cleanQuery}`;
    return { url, source: 'unsplash' };
  } catch {
    return { url: '', source: null };
  }
}
