// Supabase Edge Function to generate goals using Anthropic API
// This avoids CORS issues by proxying the API call from the server side

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface GoalRequest {
  yearDescription: string
}

interface GoalResponse {
  goals: Array<{
    title: string
    category: string
    rationale: string
  }>
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { yearDescription } = (await req.json()) as GoalRequest

    if (!yearDescription?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Year description is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Get API key from environment
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: corsHeaders }
      )
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
    })

    if (!response.ok) {
      const error = await response.text()
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${error}` }),
        { status: response.status, headers: corsHeaders }
      )
    }

    const data = await response.json()
    const content = data.content[0].text
    const parsed: GoalResponse = JSON.parse(content)

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: corsHeaders,
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
