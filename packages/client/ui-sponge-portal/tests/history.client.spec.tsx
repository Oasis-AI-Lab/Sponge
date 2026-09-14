// @vitest-environment jsdom
/**
 * HistoryPage: the session-history page lists the non-blank Host sessions by
 * last update (most recent first), opens the chosen session through the
 * injected resume verb, and shows an honest "no sessions" empty state rather
 * than fabrication. The session rows ride the global useSessions hook — the
 * spec feeds a fixed snapshot and asserts the derived, user-visible list.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type {
  SessionId, SessionListPhase, SessionListState, SessionSummary,
} from '@oasisailab/sponge-client-runtime/client'
import type { HistoryPageProps } from '../src/client/contract/slots.ts'
import { HistoryPage } from '../src/client/history/HistoryPage.tsx'
import { en } from '../src/client/locales.ts'
import { makeTranslate } from '@oasisailab/sponge-client-test-runtime'

const t: HistoryPageProps['t'] = makeTranslate(en)
const sid = (id: string) => id as SessionId
// The history page never reads workspaces; it rides the global standard seat.
const neverWorkspaces = (() => { throw new Error('history must not read workspaces') }) as never

afterEach(() => {
  cleanup()
})

function summary(id: string, updatedAt: number, overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: sid(id), displayTitle: id, blank: false, running: false, updatedAt, ...overrides,
  }
}

function listState(rows: SessionSummary[]): SessionListState {
  const byId: Record<SessionId, SessionSummary> = {}
  for (const row of rows) byId[row.id] = row
  return {
    ids: rows.map(r => r.id), byId, current: undefined, phase: 'ready' as SessionListPhase,
    subagentsByParent: {}, jobsBySession: {}, currentAddress: undefined,
  }
}

function hookOf(state: SessionListState): HistoryPageProps['useSessions'] {
  return sel => sel(state)
}

function mountPage(rows: SessionSummary[]) {
  const open = vi.fn()
  render(<HistoryPage useSessions={hookOf(listState(rows))} useWorkspaces={neverWorkspaces} open={open} t={t} route={{ name: 'history' }} />)
  return { open }
}

describe('HistoryPage surface', () => {
  it('renders the empty state when there are no sessions', () => {
    mountPage([])
    expect(screen.getByText('No sessions yet')).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('hides blank sessions', () => {
    mountPage([
      summary('a', 100),
      summary('blank', 200, { blank: true, displayTitle: 'New Session' }),
    ])
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(1)
    expect(screen.queryByText('New Session')).toBeNull()
  })

  it('sorts sessions by last update descending and opens the chosen one', () => {
    const { open } = mountPage([
      summary('old', 100, { displayTitle: 'Old chat' }),
      summary('new', 300, { displayTitle: 'New chat' }),
      summary('mid', 200, { displayTitle: 'Mid chat' }),
    ])
    const titles = screen.getAllByText(/chat$/).map(el => el.textContent)
    expect(titles).toEqual(['New chat', 'Mid chat', 'Old chat'])
    fireEvent.click(screen.getByRole('button', { name: 'Resume session "New chat"' }))
    expect(open).toHaveBeenCalledWith(sid('new'))
  })
})
