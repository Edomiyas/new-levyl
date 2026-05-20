export async function callAnthropic(body: object): Promise<any> {
  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error('Anthropic API error: ' + err)
  }

  return response.json()
}
