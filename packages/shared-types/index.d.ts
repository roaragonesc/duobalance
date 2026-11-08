export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    fields?: string[]
  }
}
