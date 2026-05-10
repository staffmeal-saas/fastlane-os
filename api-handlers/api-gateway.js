const validateKey = require('./validate-key');

module.exports = async function apiGateway(req, res) {
  // 1. Validate API key
  const ctx = await validateKey(req);
  if (ctx.error) {
    return res.status(ctx.status).json({ success: false, error: ctx.error });
  }

  // 2. Parse action
  const { action, params } = req.body || {};
  if (!action) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'action requis' } });
  }

  // 3. Load handlers lazily
  const handlerMap = {
    create_client: require('./actions/create-client'),
    update_client: require('./actions/update-client'),
  };
  // ... add more as they are created

  const handler = handlerMap[action];
  if (!handler) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Action '${action}' introuvable` } });
  }

  // 4. Execute
  try {
    const result = await handler(params, ctx);
    await logApiCall(req, ctx, action, 'success', result);
    return res.status(200).json({
      success: true,
      data: result,
      meta: { at: new Date().toISOString() }
    });
  } catch (err) {
    await logApiCall(req, ctx, action, 'error', { message: err.message });
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message }
    });
  }
};

async function logApiCall(req, ctx, action, status, result) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.HASURA_ENDPOINT || 'http://localhost:8080',
    process.env.HASURA_ADMIN_SECRET || process.env.GRAPHQL_ADMIN_SECRET,
    { auth: { persistSession: false } }
  );
  try {
    await supabase.from('api_logs').insert({
      api_key_id: ctx.keyId,
      user_id: ctx.userId,
      action,
      status,
      result: typeof result === 'object' ? result : { value: result },
      ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent']
    });
  } catch (e) {
    console.error('Failed to log API call:', e.message);
  }
}
