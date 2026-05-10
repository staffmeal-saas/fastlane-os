module.exports = async function updateAction(params, ctx) {
  const { id, ...fields } = params || {};
  if (!id) throw new Error('id est requis');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.HASURA_ENDPOINT || 'http://localhost:8080',
    process.env.HASURA_ADMIN_SECRET,
    { auth: { persistSession: false } }
  );

  delete fields.created_at;
  delete fields.id;

  const now = new Date().toISOString();
  const updates = { ...fields, updated_at: now };

  if (fields.status === 'terminee') {
    updates.completed_at = now;
  }

  const { data, error } = await supabase
    .from('actions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};
