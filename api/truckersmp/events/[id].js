/**
 * Vercel Serverless Function — TruckersMP Event Info
 * GET /api/truckersmp/events/:id
 * Proxies to https://api.truckersmp.com/v2/events/:id server-side,
 * bypassing Cloudflare browser challenges.
 */
export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing event id' });
  }

  try {
    const response = await fetch(`https://api.truckersmp.com/v2/events/${id}`, {
      headers: {
        'User-Agent': 'EThub/1.0 (https://github.com/maciejlor/EThub)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const text = await response.text();

    // Detect Cloudflare HTML block
    if (text.includes('<!DOCTYPE html') || text.includes('Just a moment')) {
      console.error('[TMP Event] Cloudflare blocked the request');
      return res.status(503).json({ error: 'TruckersMP API temporarily unavailable (CF)' });
    }

    const data = JSON.parse(text);
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[TMP Event] Error:', err);
    res.status(500).json({ error: 'Failed to fetch event info' });
  }
}
