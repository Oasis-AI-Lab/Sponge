// @vitest-environment jsdom
/**
 * ContainerHome: the M1 container home is a blank-page scaffold — a title and
 * a subtitle naming what lands in later milestones. It honestly carries no
 * fabricated resident/count data yet; the route share is irrelevant to its
 * render but rides the four-share props form like every chain entry.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ContainerHomeProps } from '../src/client/contract/slots.ts'
import { ContainerHome } from '../src/client/home/ContainerHome.tsx'
import { en } from '../src/client/locales.ts'

const t: ContainerHomeProps['t'] = key => (en as Record<string, string>)[key] ?? key
const neverHook = (() => { throw new Error('home must not read global hooks') }) as never

afterEach(() => {
  cleanup()
})

describe('ContainerHome surface', () => {
  it('renders the container title and the M1 scaffold subtitle', () => {
    render(<ContainerHome useSessions={neverHook} useWorkspaces={neverHook} t={t} route={{ name: 'home' }} />)
    expect(screen.getByRole('heading', { name: 'Container' })).toBeTruthy()
    expect(screen.getByText(/standard surface — resident profiles and structure/i)).toBeTruthy()
  })
})
