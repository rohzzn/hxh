import { copyFile, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const cardsDir = path.join(rootDir, 'cards')
const dataPath = path.join(rootDir, 'src', 'data', 'greed-island-card-sets.json')
const imageDir = path.join(rootDir, 'public', 'card-images')
const backTargetPath = path.join(rootDir, 'public', 'card-back-local.png')

const sets = JSON.parse(await readFile(dataPath, 'utf8'))
const cards = [
  ...sets.specified,
  ...sets.freeSlots,
  ...sets.spells,
  ...sets.gameMaster,
]

const normalize = (value) =>
  value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/^\[[^\]]+\]\s*-\s*/, '')
    .replace(/^\d+\s*-\s*/, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const toSafeSegment = (value) => value.replace(/[\\/:*?"<>|]/g, '_')

const manualMap = {
  'gameMaster:-000': '[-000] - Debug.png',
  'gameMaster:-001': '[-001] - Master.png',
  'gameMaster:-002': '[-002] - Limits of None.png',
  'gameMaster:-003': '[-003] - Eliminate.png',
  'freeSlots:?': '10338 - Gatekeeper.png',
  'freeSlots:7018': 'Cards Back.png',
}

await mkdir(imageDir, { recursive: true })

const files = (await readdir(cardsDir)).filter((name) => name.toLowerCase().endsWith('.png'))
const normalizedFiles = new Map(files.map((name) => [normalize(name), name]))
const syncedFileNames = new Set()

const findLocalFile = (card) => {
  const manual = manualMap[`${card.collection}:${card.number}`]
  if (manual) {
    return manual
  }

  const byNumber = files.find(
    (name) => name.startsWith(`${card.number} - `) || name.startsWith(`[${card.number}] - `),
  )
  if (byNumber) {
    return byNumber
  }

  const byName = normalizedFiles.get(normalize(card.name))
  if (byName) {
    return byName
  }

  const byAlias = card.alias ? normalizedFiles.get(normalize(card.alias)) : undefined
  if (byAlias) {
    return byAlias
  }

  return 'Cards Back.png'
}

for (const card of cards) {
  const localFileName = findLocalFile(card)
  const sourcePath = path.join(cardsDir, localFileName)
  const extension = path.extname(localFileName) || '.png'
  const targetFileName = `${toSafeSegment(card.collection)}-${toSafeSegment(card.number)}${extension}`
  const targetPath = path.join(imageDir, targetFileName)

  await copyFile(sourcePath, targetPath)
  syncedFileNames.add(targetFileName)
  card.localImage = `/card-images/${targetFileName}`
}

const existingSyncedFiles = await readdir(imageDir)

await Promise.all(
  existingSyncedFiles
    .filter((name) => !syncedFileNames.has(name))
    .map((name) => unlink(path.join(imageDir, name))),
)

await copyFile(path.join(cardsDir, 'Cards Back.png'), backTargetPath)
await writeFile(dataPath, `${JSON.stringify(sets, null, 2)}\n`, 'utf8')

console.log(`Synced ${cards.length} local card images from the cards folder.`)
