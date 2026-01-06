import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, files, siteId, accessToken } = body

    if (!projectId || !files) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const netlifyToken = accessToken || process.env.NETLIFY_ACCESS_TOKEN
    if (!netlifyToken) {
      return NextResponse.json({ error: 'Netlify access token required' }, { status: 400 })
    }

    const deployResponse = await createNetlifyDeploy(netlifyToken, files, siteId)

    return NextResponse.json(deployResponse)
  } catch (error) {
    console.error('Netlify deployment error:', error)
    return NextResponse.json({ error: 'Deployment failed' }, { status: 500 })
  }
}

async function createNetlifyDeploy(
  token: string,
  files: Record<string, string>,
  siteId?: string
): Promise<{ success: boolean; url?: string; sslUrl?: string; deployId?: string; error?: string }> {
  try {
    const fileEntries = Object.entries(files).map(([path, content]) => {
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path
      return [normalizedPath, content] as [string, string]
    })
    
    const deployData = {
      files: Object.fromEntries(fileEntries),
      functions: undefined,
      headers: [
        { path: '/*', headers: [{ 'Cache-Control': 'no-cache' }] },
        { path: '/assets/*', headers: [{ 'Cache-Control': 'public, max-age=31536000' }] },
      ],
    }

    if (siteId) {
      const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deployData),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Netlify deploy error:', error)
        return { success: false, error: `Deploy failed: ${error}` }
      }

      const data = await response.json()
      return {
        success: true,
        deployId: data.id,
        url: data.url,
        sslUrl: data.ssl_url,
      }
    }

    const response = await fetch('https://api.netlify.com/api/v1/deploys', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...deployData,
        site_name: `ckick-${Date.now()}`,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Netlify deploy error:', error)
      return { success: false, error: `Deploy failed: ${error}` }
    }

    const data = await response.json()
    return {
      success: true,
      deployId: data.id,
      url: data.url,
      sslUrl: data.ssl_url,
    }
  } catch (error) {
    console.error('Netlify deployment error:', error)
    return { success: false, error: String(error) }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const deployId = searchParams.get('deployId')

  if (!deployId) {
    return NextResponse.json({ error: 'Deploy ID required' }, { status: 400 })
  }

  const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN
  if (!netlifyToken) {
    return NextResponse.json({ error: 'Netlify token not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(`https://api.netlify.com/api/v1/deploys/${deployId}`, {
      headers: {
        Authorization: `Bearer ${netlifyToken}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to get deploy status' }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({
      state: data.state,
      url: data.url,
      sslUrl: data.ssl_url,
      error: data.error_message,
    })
  } catch (error) {
    console.error('Netlify status check error:', error)
    return NextResponse.json({ error: 'Failed to check deploy status' }, { status: 500 })
  }
}
