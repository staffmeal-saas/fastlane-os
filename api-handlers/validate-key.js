const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client — use env vars for HASURA_ENDPOINT and HASURA_ADMIN_SECRET
const supabase = createClient(
  process.env.HASURA_ENDPOINT || 'http://localhost:8080',
  process.env.HASURA_ADMIN_SECRET || process.env.GRAPHQL_ADMIN_SECRET,
  { auth: { persistSession: false } }
);

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

module.exports = async function validateKey(req) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return { error: { code: 'UNAUTHORIZED', message: 'Clé API manquante' }, status: 401 };
  }

  const prefix = apiKey.substring(0, 12);
  const keyHash = hashKey(apiKey);

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, key_hash, is_active')
    .eq('key_prefix', prefix)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { error: { code: 'UNAUTHORIZED', message: 'Clé inactive ou introuvable' }, status: 401 };
  }

  if (data.key_hash !== keyHash) {
    return { error: { code: 'UNAUTHORIZED', message: 'Clé invalide' }, status: 401 };
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  // Fetch user email and role from auth.users via admin secret REST API
  let email = null;
  let role = null;
  try {
    const authEndpoint = (process.env.NHOST_AUTH_URL || 'http://localhost:4000') + '/api/v1/users/' + data.user_id;
    const authRes = await fetch(authEndpoint, {
      headers: {
        'Authorization': 'Bearer ' + (process.env.NHOST_ADMIN_SECRET || process.env.HASURA_ADMIN_SECRET),
        'Content-Type': 'application/json'
      }
    });
    if (authRes.ok) {
      const authData = await authRes.json();
      email = authData.email || null;
      role = authData.avatar_url || null; // role stored via metadata or claim
    }
  } catch (e) {
    // auth endpoint unavailable — email remains null
    console.warn('Could not fetch user email from auth.users:', e.message);
  }

  return {
    userId: data.user_id,
    keyId: data.id,
    email,
    role
  };
};
