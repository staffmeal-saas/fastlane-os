module.exports = async function deleteAction(params, ctx) {
  const { id } = params || {};
  if (!id) throw new Error('id est requis');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.HASURA_ENDPOINT || 'http://localhost:8080',
    process.env.HASURA_ADMIN_SECRET,
    { auth: { persistSession: false } }
  );

  const { error } = await supabase
    .from('actions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { id };
};
