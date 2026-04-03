export type GreedIslandCollectionKey =
  | 'specified'
  | 'freeSlots'
  | 'spells'
  | 'gameMaster'

export interface GreedIslandCard {
  collection: GreedIslandCollectionKey
  number: string
  name: string
  alias: string
  rank: string
  acquisitionLimit: string
  rankLimit: string
  description: string
  imageUrl: string
  thumbnailUrl: string
  localImage: string
  wikiUrl: string
  spellClass?: string
}

export interface GreedIslandCardSets {
  specified: GreedIslandCard[]
  freeSlots: GreedIslandCard[]
  spells: GreedIslandCard[]
  gameMaster: GreedIslandCard[]
}
