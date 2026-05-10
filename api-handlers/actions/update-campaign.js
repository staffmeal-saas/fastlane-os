module.exports = async function updateCampaign(params, ctx) {
  const { id, ...fields } = params || {};
  if (!id) throw new Error('id est requis');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.HASURA_ENDPOINT || 'http://localhost:8080',
    process.env.HASURA_ADMIN_SECRET,
    { auth: { persistSession: false } }
  );

  delete fields.created_at;

  const { data, error } = await supabase
    .from('campaigns')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};