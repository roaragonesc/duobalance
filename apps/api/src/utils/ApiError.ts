/** Error público de aplicación que el middleware convierte al contrato HTTP estándar. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  /** Asocia estado, código estable y mensaje seguro sin exponer la causa interna. */
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}
