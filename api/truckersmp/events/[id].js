/**
 * Vercel Serverless Function — TruckersMP Event Info
 * GET /api/truckersmp/events/:id
 * Proxies to https://api.truckersmp.com/v2/events/:id server-side.
 *
 * Key finding: sending a browser User-Agent triggers Cloudflare JS challenge.
 * A plain fetch with no custom User-Agent (Node default) works fine directly.
 */
async function fetchWithFallback(targetUrl) {
  const attempts = [
    // Attempt 1: Direct fetch — NO browser User-Agent (avoids Cloudflare trigger)
    async () => {
      return await fetch(targetUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });
    },
    // Attempt 2: Via allorigins JSON wrapper (reliable fallback if direct fails)
    async () => {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.contents && !json.contents.includes('<!DOCTYPE html') && !json.contents.includes('Just a moment')) {
          return {
            ok: true,
            status: 200,
            text: async () => json.contents,
          };
        }
      }
      throw new Error('allorigins returned Cloudflare page');
    },
    // Attempt 3: Via allorigins raw (last resort)
    async () => {
      return await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
    },
  ];

  let lastError = null;
  for (let i = 0; i < attempts.length; i++) {
    try {
      const response = await attempts[i]();
      if (response.ok) {
        const text = await response.text();
        if (!text.includes('<!DOCTYPE html') && !text.includes('Just a moment')) {
          const data = JSON.parse(text);
          return { status: response.status, data };
        }
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('All fetch attempts failed');
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing event id' });
  }

  try {
    const targetUrl = `https://api.truckersmp.com/v2/events/${id}`;
    const result = await fetchWithFallback(targetUrl);
    res.status(result.status).json(result.data);
  } catch (err) {
    console.error('[TMP Event] Error:', err);
    res.status(503).json({ error: 'TruckersMP API temporarily unavailable (CF)' });
  }
}
