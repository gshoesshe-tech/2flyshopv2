// Keep API requests and login cookies on the website's own origin.
export async function onRequest({ request }) {
  const incoming = new URL(request.url);
  const upstream = new URL("https://2fly-api.gshoeswho.workers.dev");
  upstream.pathname = incoming.pathname;
  upstream.search = incoming.search;
  const headers = new Headers(request.headers);
  headers.delete("host");
  try {
    const response = await fetch(new Request(upstream.toString(), {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual"
    }));
    const result = new Response(response.body, response);
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch {
    return new Response(JSON.stringify({ error: "Product API is temporarily unavailable." }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  }
}
