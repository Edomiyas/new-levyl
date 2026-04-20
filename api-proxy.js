/**
 * Simple backend proxy for Anthropic API
 * Run with: node api-proxy.js
 * This avoids CORS issues by proxying API calls from the server side
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/generate-goals', async (req, res) => {
  try {
    const { yearDescription } = req.body;

    if (!yearDescription?.trim()) {
      return res.status(400).json({ error: 'Year description is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured in server' });
    }

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are a goal-setting assistant. The user will describe their ideal year. Extract specific, actionable goals from their description. Each goal must have a title and a category. Categories are dynamic — infer them from what the user wrote (e.g. 'Health & Fitness', 'Financial', 'Family', 'Career', 'Relationships', 'Learning', 'Spiritual', 'Creative', 'Travel', 'Community'). Do not use a fixed list — only use categories that genuinely appear in what the user wrote. Return ONLY valid JSON, no markdown, no explanation. Format: { "goals": [{ "title": string, "category": string, "rationale": string }] }`,
        messages: [{ role: 'user', content: yearDescription }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${error}` });
    }

    const data = await response.json();
    const content = data.content[0].text;
    const parsed = JSON.parse(content);

    res.json(parsed);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API proxy running at http://localhost:${PORT}`);
  console.log('Make sure ANTHROPIC_API_KEY is set in environment variables');
});
