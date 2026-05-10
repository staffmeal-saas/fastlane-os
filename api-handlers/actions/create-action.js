module.exports = async function createAction(params, ctx) {
  const { campaign_id, client_id, title, description, status, priority, credits_reserved, credits_consumed, assigned_to, due_date } = params || {};
  if (!campaign_id) throw new Error('campaign_id est requis');
  if (!client_id) throw new Error('client_id est requis');
  if (!title) throw new Error('title est requis');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.HASURA_ENDPOINT || 'http://localhost:8080',
    process.env.HASURA_ADMIN_SECRET,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('actions')
    .insert({
      campaign_id,
      client_id,
      title,
      description: description || null,
      status: status || 'a_valider',
      priority: priority || 'medium',
      credits_reserved: credits_reserved || 0,
      credits_consumed: credits_consumed || 0,
      assigned_to: assigned_to || null,
      due_date: due_date || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};
