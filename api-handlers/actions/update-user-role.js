module.exports = async function updateUserRole(params, ctx) {
  const { user_id, client_id, role } = params || {};
  if (!user_id || !client_id) throw new Error('user_id et client_id sont requis');
  if (!role || !['owner', 'collaborator'].includes(role)) {
    throw new Error('role doit etre "owner" ou "collaborator"');
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.HASURA_ENDPOINT || 'http://localhost:8080',
    process.env.HASURA_ADMIN_SECRET,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('client_members')
    .update({ role })
    .eq('user_id', user_id)
    .eq('client_id', client_id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};
