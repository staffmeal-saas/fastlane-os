module.exports = async function createCampaign(params, ctx) {
  const { client_id, name, description, objectives, status, start_date, end_date, kpi_targets, kpi_results, credits_budget } = params || {};
  if (!client_id) throw new Error('client_id est requis');
  if (!name) throw new Error('name est requis');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.HASURA_ENDPOINT || 'http://localhost:8080',
    process.env.HASURA_ADMIN_SECRET,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      client_id,
      name,
      description: description || null,
      objectives: objectives || null,
      status: status || 'draft',
      start_date: start_date || null,
      end_date: end_date || null,
      kpi_targets: kpi_targets || '{}',
      kpi_results: kpi_results || '{}',
      credits_budget: credits_budget || 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};