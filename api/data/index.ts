import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'

const DATA_KEY = 'ecom_dashboard_data'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for frontend access
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const data = await kv.get<any[]>(DATA_KEY)
      return res.json({ success: true, data: data || [] })
    } catch (err) {
      console.error('GET error:', err)
      return res.status(500).json({ success: false, error: 'Failed to fetch data' })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body as any
      const { action, records } = body
      
      if (action === 'import') {
        const existing = await kv.get<any[]>(DATA_KEY) || []
        const merged = [...records, ...existing]
        await kv.set(DATA_KEY, merged)
        return res.json({ success: true, count: merged.length })
      }
      
      if (action === 'clear') {
        await kv.set(DATA_KEY, [])
        return res.json({ success: true })
      }
      
      return res.status(400).json({ success: false, error: 'Unknown action' })
    } catch (err) {
      console.error('POST error:', err)
      return res.status(500).json({ success: false, error: 'Failed to process request' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await kv.set(DATA_KEY, [])
      return res.json({ success: true })
    } catch (err) {
      console.error('DELETE error:', err)
      return res.status(500).json({ success: false, error: 'Failed to clear data' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
