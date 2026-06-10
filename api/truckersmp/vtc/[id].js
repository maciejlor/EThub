/**
 * Vercel Serverless Function — TruckersMP VTC Info
 * GET /api/truckersmp/vtc/:id
 * Proxies to https://api.truckersmp.com/v2/vtc/:id server-side,
 * using a robust fallback proxy mechanism to bypass Cloudflare blocks.
 */
async function fetchWithFallback(targetUrl) {
  const attempts = [
    // Attempt 1: Direct fetch
    async () => {
      return await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
    },
    // Attempt 2: Via cors.eu.org
    async () => {
      return await fetch(`https://cors.eu.org/${targetUrl}`);
    },
    // Attempt 3: Via allorigins
    async () => {
      return await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
    }
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
    return res.status(400).json({ error: 'Missing VTC id' });
  }

  try {
    const targetUrl = `https://api.truckersmp.com/v2/vtc/${id}`;
    const result = await fetchWithFallback(targetUrl);
    res.status(result.status).json(result.data);
  } catch (err) {
    console.error('[TMP VTC] Error:', err);
    res.status(503).json({ error: 'TruckersMP API temporarily unavailable (CF)' });
  }
}
