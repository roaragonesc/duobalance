import { record, serviceError } from './serviceState'

export async function confirmEmail(...args: unknown[]) {
  record('confirmEmail', ...args)
  serviceError()
}

export async function resendConfirmation(...args: unknown[]) {
  record('resendConfirmation', ...args)
  serviceError()
}

export async function requestPasswordReset(...args: unknown[]) {
  record('requestPasswordReset', ...args)
  serviceError()
}
