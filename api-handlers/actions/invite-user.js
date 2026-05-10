module.exports = async function inviteUser(params, ctx) {
  const { email, client_id, role = 'collaborator' } = params || {};
  if (!email || !client_id) throw new Error('email et client_id sont requis');

  const fetch = require('node-fetch');
  const adminSecret = process.env.HASURA_ADMIN_SECRET;
  const hasuraEndpoint = process.env.HASURA_ENDPOINT || 'http://localhost:8080';

  // Generate temporary password
  const tempPassword = 'TempPass123!' + Math.random().toString(36).slice(2);

  // Create auth user via Hasura GraphQL mutation
  const mutation = `
    mutation CreateUser($email: String!, $password: String!) {
      insert_auth_users(objects: { email: $email, password: $password, display_name: "", enabled: true }) {
        returning { id email }
      }
    }
  `;

  const resp = await fetch(`${hasuraEndpoint}/v1/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': adminSecret
    },
    body: JSON.stringify({
      query: mutation,
      variables: { email, password: tempPassword }
    })
  });

  const json = await resp.json();
  if (json.errors) throw new Error(json.errors[0].message);

  const user = json.data.insert_auth_users.returning[0];

  // Insert into client_members
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(hasuraEndpoint, adminSecret, {
    auth: { persistSession: false }
  });

  const { data: member, error: memberErr } = await supabase
    .from('client_members')
    .insert({ client_id, user_id: user.id, role })
    .select()
    .single();

  if (memberErr) throw new Error(memberErr.message);

  return {
    id: user.id,
    email: user.email,
    client_member_id: member.id,
    role
  };
};
