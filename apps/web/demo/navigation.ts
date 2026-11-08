export function demoUrl(path: string, parameters: Record<string, string> = {}): string {
  const query = new URLSearchParams(parameters).toString()
  const route = `${path}${query ? `?${query}` : ''}`
  if (import.meta.env.MODE === 'pages-demo') {
    const url = new URL(import.meta.env.BASE_URL, window.location.origin)
    url.hash = route
    return url.toString()
  }
  return new URL(route, window.location.origin).toString()
}
