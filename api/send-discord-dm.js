export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { discordId, content, components } = req.body;
  if (!discordId || !content) {
    return res.status(400).json({ error: 'Missing discordId or content' });
  }

  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  if (!DISCORD_BOT_TOKEN) {
    return res.status(500).json({ error: 'Missing Discord environment variables.' });
  }

  try {
    // 1. Create DM channel
    const channelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient_id: discordId }),
    });

    const channelData = await channelRes.json();
    if (!channelRes.ok) {
      console.error('Failed to create DM channel:', channelData);
      return res.status(channelRes.status).json({ error: 'Failed to create DM channel', details: channelData });
    }

    const channelId = channelData.id;

    // 2. Send message
    const msgRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, components }),
    });

    const msgData = await msgRes.json();
    if (!msgRes.ok) {
      console.error('Failed to send DM:', msgData);
      return res.status(msgRes.status).json({ error: 'Failed to send DM', details: msgData });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('API endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
