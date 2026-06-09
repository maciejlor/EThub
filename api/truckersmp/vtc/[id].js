/**
 * Vercel Serverless Function — TruckersMP VTC Info
 * GET /api/truckersmp/vtc/:id
 * Proxies to https://api.truckersmp.com/v2/vtc/:id server-side,
 * bypassing Cloudflare browser challenges that block dumb rewrites.
 */
export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing VTC id' });
  }

  try {
    const response = await fetch(`https://api.truckersmp.com/v2/vtc/${id}`, {
      headers: {
        'User-Agent': 'EThub/1.0 (https://github.com/maciejlor/EThub)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const text = await response.text();

    // Detect Cloudflare HTML block
    if (text.includes('<!DOCTYPE html') || text.includes('Just a moment')) {
      console.error('[TMP VTC] Cloudflare blocked the request');
      return res.status(503).json({ error: 'TruckersMP API temporarily unavailable (CF)' });
    }

    const data = JSON.parse(text);
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[TMP VTC] Error:', err);
    res.status(500).json({ error: 'Failed to fetch VTC info' });
  }
}
