/* ========== Tipos de Respuesta de API ========== */

/**
 * Error de API
 */
export type ApiError = {
  code: string
  message: string
  details?: Record<string, unknown>
}

/**
 * Resultado genérico de API (success/error)
 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }
