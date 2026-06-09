/**
 * Vercel Serverless Function — TruckersMP VTC Events (hosted + attending)
 * GET /api/truckersmp/vtc/:id/events?type=hosted|attending
 * Proxies server-side to bypass Cloudflare.
 */
export default async function handler(req, res) {
  const { id, type } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing VTC id' });
  }

  // type=attending fetches /events/attending, otherwise /events
  const path = type === 'attending'
    ? `https://api.truckersmp.com/v2/vtc/${id}/events/attending`
    : `https://api.truckersmp.com/v2/vtc/${id}/events`;

  try {
    const response = await fetch(path, {
      headers: {
        'User-Agent': 'EThub/1.0 (https://github.com/maciejlor/EThub)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const text = await response.text();

    if (text.includes('<!DOCTYPE html') || text.includes('Just a moment')) {
      console.error('[TMP Events] Cloudflare blocked the request');
      return res.status(503).json({ error: 'TruckersMP API temporarily unavailable (CF)' });
    }

    const data = JSON.parse(text);
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[TMP Events] Error:', err);
    res.status(500).json({ error: 'Failed to fetch VTC events' });
  }
}
