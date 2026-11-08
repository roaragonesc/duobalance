export function isApiErrorResponse(value) {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false
  const error = value.error
  if (
    typeof error !== 'object' ||
    error === null ||
    !('code' in error) ||
    typeof error.code !== 'string' ||
    !('message' in error) ||
    typeof error.message !== 'string'
  ) {
    return false
  }

  return !('fields' in error) || (
    Array.isArray(error.fields) && error.fields.every((field) => typeof field === 'string')
  )
}
