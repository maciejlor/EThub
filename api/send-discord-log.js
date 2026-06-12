export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Uses environment variables for security. Do NOT hardcode tokens here!
  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const DISCORD_CHANNEL_ID = process.env.DISCORD_LOG_CHANNEL_ID;

  if (!DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) {
    return res.status(500).json({ error: 'Missing Discord environment variables.' });
  }

  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Discord API Error:', data);
      return res.status(response.status).json({ error: 'Failed to send discord log', details: data });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('API endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
