import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // CORSヘッダーを設定
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (request.method === 'OPTIONS') {
    return response.status(200).end()
  }

  const { id } = request.query

  if (!id || typeof id !== 'string') {
    return response.status(400).json({ error: 'Slide ID is required' })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from('slides')
      .select('slide_json')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return response.status(404).json({ error: 'Slide not found' })
    }

    if (!data || !data.slide_json) {
      return response.status(404).json({ error: 'Slide data not found' })
    }

    // JSONをパースして返す
    const slideData = JSON.parse(data.slide_json)

    // Content-Type: application/json で返す
    response.setHeader('Content-Type', 'application/json')
    return response.status(200).json(slideData)
  } catch (err) {
    console.error('API error:', err)
    return response.status(500).json({ error: 'Internal server error' })
  }
}
