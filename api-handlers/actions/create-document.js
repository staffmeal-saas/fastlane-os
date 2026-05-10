module.exports = async function createDocument(params, ctx) {
  const { client_id, title, type, campaign_id, description, file_id, file_url, file_size } = params || {};
  if (!client_id) throw new Error('client_id est requis');
  if (!title) throw new Error('title est requis');
  if (!type) throw new Error('type est requis');

  const validTypes = ['strategy', 'audit', 'report', 'script', 'bilan', 'pdf', 'other'];
  if (!validTypes.includes(type)) {
    throw new Error(`type invalide. Valeurs autorisees: ${validTypes.join(', ')}`);
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.HASURA_ENDPOINT || 'http://localhost:8080',
    process.env.HASURA_ADMIN_SECRET,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('documents')
    .insert({
      client_id,
      title,
      type,
      campaign_id: campaign_id || null,
      description: description || null,
      file_id: file_id || null,
      file_url: file_url || null,
      file_size: file_size || null,
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};