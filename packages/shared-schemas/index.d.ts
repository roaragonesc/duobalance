import type { ApiErrorResponse } from '@duobalance/shared-types'

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse
