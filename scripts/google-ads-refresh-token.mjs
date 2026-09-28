/**
 * Generates GOOGLE_ADS_REFRESH_TOKEN for the dashboard's Google Ads sync.
 * Run once for DMR (the token is reused for every client), by a DMR user
 * who has access to the MCC:
 *
 *   GOOGLE_ADS_CLIENT_ID=... GOOGLE_ADS_CLIENT_SECRET=... npm run google-ads:token
 *
 * (Or put both in .env.local.) It prints a sign-in link; sign in with the DMR
 * Google account, approve, and the refresh token is printed here. Paste it
 * into Vercel as GOOGLE_ADS_REFRESH_TOKEN, then redeploy. Never commit it.
 *
 * The OAuth client must be a "Desktop app" client, or a "Web application"
 * client with http://localhost:8765 listed under Authorized redirect URIs.
 */
import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const PORT = 8765
const REDIRECT_URI = `http://localhost:${PORT}`
const SCOPE = 'https://www.googleapis.com/auth/adwords'

const envFile = new URL('../.env.local', import.meta.url)
const fileEnv = existsSync(envFile)
  ? Object.fromEntries(
      readFileSync(envFile, 'utf8')
        .split('\n')
        .filter((line) => line.trim() && !line.trim().startsWith('#') && line.includes('='))
        .map((line) => {
          const i = line.indexOf('=')
          return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
        }),
    )
  : {}

const clientId = process.env.GOOGLE_ADS_CLIENT_ID || fileEnv.GOOGLE_ADS_CLIENT_ID
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || fileEnv.GOOGLE_ADS_CLIENT_SECRET
if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET (env or .env.local) first.')
  process.exit(1)
}

const state = randomBytes(16).toString('hex')
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: SCOPE,
  access_type: 'offline',
  prompt: 'consent', // forces Google to issue a refresh token every time
  state,
}).toString()

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', REDIRECT_URI)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  if (!code && !error) {
    res.writeHead(404).end()
    return
  }
  const finish = (status, message) => {
    res.writeHead(status, { 'Content-Type': 'text/plain' }).end(message)
    server.close()
  }
  if (error) {
    console.error('Google returned an error:', error)
    return finish(400, `Google returned an error: ${error}`)
  }
  if (url.searchParams.get('state') !== state) return finish(400, 'State mismatch, run the script again.')

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })
  const json = await tokenRes.json()
  if (!json.refresh_token) {
    console.error('No refresh token returned:', json.error ?? json)
    return finish(500, 'No refresh token returned. See the terminal.')
  }
  finish(200, 'Done. The refresh token is in your terminal; you can close this tab.')
  console.log('\nGOOGLE_ADS_REFRESH_TOKEN (paste into Vercel, never commit):\n')
  console.log(json.refresh_token + '\n')
})

server.listen(PORT, () => {
  console.log('Sign in with the DMR Google account that has MCC access:\n')
  console.log(authUrl.toString() + '\n')
})
