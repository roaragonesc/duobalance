import { beforeMount } from '@playwright/experimental-ct-react/hooks'
import { resetServices } from '../serviceState'

beforeMount(async ({ hooksConfig }) => {
  resetServices(hooksConfig ?? {})
})
