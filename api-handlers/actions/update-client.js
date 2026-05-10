module.exports = async function updateClient(params, ctx) {
  const { id, ...fields } = params || {};
  if (!id) throw new Error('id est requis');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.HASURA_ENDPOINT || 'http://localhost:8080',
    process.env.HASURA_ADMIN_SECRET,
    { auth: { persistSession: false } }
  );

  // Remove readonly fields
  delete fields.created_at;
  delete fields.id;

  const { data, error } = await supabase
    .from('clients')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};