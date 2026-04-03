import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import greedIslandCardSets from './data/greed-island-card-sets.json'
import type {
  GreedIslandCard,
  GreedIslandCardSets,
  GreedIslandCollectionKey,
} from './types'
import './App.css'

const CardGalleryScene = lazy(() => import('./components/CardGalleryScene'))
const SelectedCardScene = lazy(() => import('./components/SelectedCardScene'))

const cardSets = greedIslandCardSets as GreedIslandCardSets

const tabConfig: Array<{
  key: GreedIslandCollectionKey
  label: string
  shortLabel: string
}> = [
  { key: 'specified', label: 'Specified Slots', shortLabel: 'Specified Slot' },
  { key: 'freeSlots',  label: 'Free Slots',      shortLabel: 'Free Slot'     },
  { key: 'spells',     label: 'Spell Cards',      shortLabel: 'Spell Card'    },
  { key: 'gameMaster', label: 'Game Master',      shortLabel: 'Game Master'   },
]

const sortedCardSets: GreedIslandCardSets = {
  specified:  [...cardSets.specified].sort((a, b) => Number(a.number) - Number(b.number)),
  freeSlots:  [...cardSets.freeSlots].sort((a, b) => Number(a.number) - Number(b.number)),
  spells:     [...cardSets.spells].sort((a, b) => Number(a.number) - Number(b.number)),
  gameMaster: [...cardSets.gameMaster].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true }),
  ),
}

const allCards = [
  ...sortedCardSets.specified,
  ...sortedCardSets.freeSlots,
  ...sortedCardSets.spells,
  ...sortedCardSets.gameMaster,
]

type Theme = 'dark' | 'light'

export default function App() {
  const [activeTab,    setActiveTab]    = useState<GreedIslandCollectionKey>('specified')
  const [search,       setSearch]       = useState('')
  const [selectedCard, setSelectedCard] = useState<GreedIslandCard | null>(null)
  const [theme,        setTheme]        = useState<Theme>('dark')

  // Apply theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const activeTabMeta = tabConfig.find((t) => t.key === activeTab) ?? tabConfig[0]

  const activeCards = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sortedCardSets[activeTab]

    return allCards.filter((card) => {
      const sc = card.spellClass?.toLowerCase() ?? ''
      return (
        card.number.toLowerCase().includes(query) ||
        card.name.toLowerCase().includes(query) ||
        card.alias.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query) ||
        sc.includes(query)
      )
    })
  }, [activeTab, search])

  const displayedCard =
    selectedCard &&
    activeCards.find(
      (c) => c.collection === selectedCard.collection && c.number === selectedCard.number,
    )
      ? selectedCard
      : null

  useEffect(() => {
    if (!selectedCard) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCard(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedCard])

  return (
    <main className="app-shell">

      {/* ══ TITLE BANNER ══════════════════════════════════ */}
      <div className="title-banner" aria-label="Site title">
        <div className="title-series-block">
          <span className="title-series">
            HUNTER <span className="title-x">×</span> HUNTER
          </span>
          <span className="title-series-jp">ハンター×ハンター</span>
        </div>

        <div className="title-center-block">
          <h1 className="title-main">GREED ISLAND</h1>
          <span className="title-sub">グリードアイランド · CARD ARCHIVE</span>
        </div>

        <div className="title-stat-block">
          <span className="title-stat-label">Total Cards</span>
          <span className="title-stat-value">{allCards.length}</span>
        </div>
      </div>

      {/* ══ NAV HEADER ════════════════════════════════════ */}
      <header className="app-header">
        <nav className="tab-bar" role="tablist" aria-label="Greed Island card collections">
          {tabConfig.map((tab) => (
            <button
              key={tab.key}
              className={`tab-button${tab.key === activeTab ? ' is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={tab.key === activeTab}
              onClick={() => {
                setActiveTab(tab.key)
                setSelectedCard(null)
              }}
            >
              {tab.label}
              <span className="tab-count">{sortedCardSets[tab.key].length}</span>
            </button>
          ))}
        </nav>

        <div className="header-search">
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              aria-label="Search all cards"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards…"
              className="search-input"
            />
          </div>
        </div>

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        >
          {theme === 'dark' ? (
            /* Sun icon */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            /* Moon icon */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </header>

      {/* ══ 3-D GALLERY ═══════════════════════════════════ */}
      <div className="canvas-shell">
        <Suspense
          fallback={
            <div className="scene-loader" aria-hidden="true">
              <span className="scene-loader-ring" />
            </div>
          }
        >
          <CardGalleryScene
            cards={activeCards}
            selectedCard={displayedCard}
            onSelect={setSelectedCard}
          />
        </Suspense>
      </div>

      {/* ══ DETAIL OVERLAY ════════════════════════════════ */}
      {displayedCard ? (
        <div className="detail-overlay" role="presentation">
          <button
            className="detail-dismiss"
            type="button"
            aria-label="Close card details"
            onClick={() => setSelectedCard(null)}
          />

          <aside
            className="detail-sheet"
            aria-label={`${displayedCard.name} card details`}
          >
            <span className="corner-tl" aria-hidden="true" />
            <span className="corner-tr" aria-hidden="true" />
            <span className="corner-bl" aria-hidden="true" />
            <span className="corner-br" aria-hidden="true" />

            <button
              className="detail-close"
              type="button"
              aria-label="Close card details"
              onClick={() => setSelectedCard(null)}
            >
              ✕
            </button>

            {/* 3-D Card viewer */}
            <div className="detail-visual">
              <div className="detail-art">
                <Suspense
                  fallback={
                    <div className="detail-art-loader" aria-hidden="true">
                      <span className="scene-loader-ring" />
                    </div>
                  }
                >
                  <SelectedCardScene card={displayedCard} />
                </Suspense>
              </div>
            </div>

            {/* Card info */}
            <div className="detail-copy">
              <p className="detail-kicker">
                {tabConfig.find((t) => t.key === displayedCard.collection)?.shortLabel ??
                  activeTabMeta.shortLabel}
                {' '}·{' '}#{displayedCard.number}
              </p>

              <h1>{displayedCard.name}</h1>

              {displayedCard.alias ? (
                <p className="detail-alias">"{displayedCard.alias}"</p>
              ) : null}

              <div className="detail-meta" role="list" aria-label="Card metadata">
                <div className="meta-chip meta-chip--rank" role="listitem">
                  <span>Rank Limit</span>
                  <strong>{displayedCard.rankLimit}</strong>
                </div>
                <div className="meta-chip meta-chip--copies" role="listitem">
                  <span>Copies</span>
                  <strong>{displayedCard.acquisitionLimit}</strong>
                </div>
                {displayedCard.spellClass ? (
                  <div className="meta-chip meta-chip--class" role="listitem">
                    <span>Spell Class</span>
                    <strong>{displayedCard.spellClass}</strong>
                  </div>
                ) : null}
              </div>

              <p className="detail-description">{displayedCard.description}</p>
            </div>
          </aside>
        </div>
      ) : null}

    </main>
  )
}
