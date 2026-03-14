import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, prompt, image, mimeType } = await req.json()
    const client = new Anthropic({ apiKey: Deno.env.get('CLAUDE_API_KEY') })

    let result: string | object

    if (action === 'recognize') {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
            { type: 'text', text: prompt },
          ],
        }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      result = JSON.parse(text)

    } else if (action === 'analyze') {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })
      result = response.content[0].type === 'text' ? response.content[0].text : ''

    } else if (action === 'generate') {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
      result = JSON.parse(text)

    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
