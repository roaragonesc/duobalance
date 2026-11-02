import { useOutletContext } from 'react-router'
import type { Workspace } from './services/spaceService'

export type ActiveWorkspace = {
  displayName: string
  space: NonNullable<Workspace['space']>
  /** Refreshes the name shown across the app after editing the profile. */
  setDisplayName: (name: string) => void
}

// AppLayout loads the workspace once and shares it with every app screen.
export function useActiveWorkspace(): ActiveWorkspace {
  return useOutletContext<ActiveWorkspace>()
}
