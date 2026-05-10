module.exports = async function createClient(params, ctx) {
  const { name, status, offer_id, industry, website } = params || {};
  if (!name) throw new Error('name est requis');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.HASURA_ENDPOINT || 'http://localhost:8080',
    process.env.HASURA_ADMIN_SECRET,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('clients')
    .insert({ name, status: status || 'sprint', offer_id: offer_id || null, industry: industry || null, website: website || null })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};