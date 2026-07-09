const getConfiguredBaseUrl = () => {
  const configured = (
    import.meta.env.VITE_APP_URL ||
    import.meta.env.VITE_PUBLIC_URL ||
    import.meta.env.VITE_FRONTEND_URL ||
    ''
  ).trim()

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin
    if (currentOrigin && currentOrigin !== 'http://localhost:3000' && currentOrigin !== 'http://localhost:5173') {
      return currentOrigin
    }
  }

  return 'https://bachelorhub-production.up.railway.app'
}

export const buildShareUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const baseUrl = getConfiguredBaseUrl()
  return `${baseUrl}/#${normalizedPath}`
}
