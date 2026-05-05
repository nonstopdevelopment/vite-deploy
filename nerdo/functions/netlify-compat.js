export async function handler(event, context) {
  let parsedBody = null

  if (event.body) {
    try {
      parsedBody = JSON.parse(event.body)
    } catch {
      parsedBody = event.body
    }
  }

  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
    body: JSON.stringify({
      ok: true,
      mode: 'netlify-compatible',
      method: event.httpMethod,
      path: event.path,
      rawQuery: event.rawQuery,
      query: event.queryStringParameters,
      multiValueQuery: event.multiValueQueryStringParameters,
      body: parsedBody,
      functionName: context.functionName,
      hasEnv: Boolean(context.env),
      url: context.url?.toString(),
    }),
  }
}
