module.exports = async function publishDocument(params, ctx) {
  const { id } = params || {};
  if (!id) throw new Error('id est requis');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.HASURA_ENDPOINT || 'http://localhost:8080',
    process.env.HASURA_ADMIN_SECRET,
    { auth: { persistSession: false } }
  );

  // Fetch current state
  const { data: existing, error: fetchError } = await supabase
    .from('documents')
    .select('is_published')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error('document non trouve');

  const newPublishedState = !existing.is_published;
  const { data, error } = await supabase
    .from('documents')
    .update({
      is_published: newPublishedState,
      published_at: newPublishedState ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};