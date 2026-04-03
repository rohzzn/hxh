import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cheerio from 'cheerio'

const SOURCE_URL =
  'https://hunterxhunter.fandom.com/api.php?action=parse&page=Greed_Island_Card_Lists&prop=text&formatversion=2&format=json'

const toAbsoluteUrl = (href) =>
  href ? new URL(href, 'https://hunterxhunter.fandom.com').toString() : ''

const toScaledImage = (imageUrl, width = 520) => {
  if (!imageUrl.includes('/revision/latest?')) {
    return imageUrl
  }

  return imageUrl.replace(
    '/revision/latest?',
    `/revision/latest/scale-to-width-down/${width}?`,
  )
}

const cleanText = (value) => value.replace(/\s+/g, ' ').trim()

const parseRankLimit = (rankLimit) => {
  const [rank = '', acquisitionLimit = ''] = rankLimit.split('-', 2)

  return {
    rank,
    acquisitionLimit,
  }
}

const extractNameAndAlias = ($, cell) => {
  const link = $(cell).find('a').first()
  const linkedName = cleanText(link.text())
  const leftoverText = cleanText($(cell).clone().find('a').remove().end().text())
  const name = linkedName || leftoverText
  const aliasRaw = linkedName ? leftoverText : ''

  return {
    link,
    name,
    alias: aliasRaw.replace(/^\((.*)\)$/, '$1'),
  }
}

const buildStandardCard = ($, row, collection) => {
  const cells = $(row).find('td')
  const { link, name, alias } = extractNameAndAlias($, cells[2])
  const rankLimit = cleanText($(cells[3]).text())
  const { rank, acquisitionLimit } = parseRankLimit(rankLimit)
  const imageUrl = toAbsoluteUrl($(cells[0]).find('a').attr('href'))

  return {
    collection,
    number: cleanText($(cells[1]).text()),
    name,
    alias,
    rank,
    acquisitionLimit,
    rankLimit,
    description: cleanText($(cells[4]).text()),
    imageUrl,
    thumbnailUrl: toScaledImage(imageUrl),
    wikiUrl: toAbsoluteUrl(link.attr('href')),
    localImage: '',
  }
}

const buildSpellCard = ($, row) => {
  const cells = $(row).find('td')
  const { link, name } = extractNameAndAlias($, cells[2])
  const rankLimit = cleanText($(cells[5]).text())
  const { rank, acquisitionLimit } = parseRankLimit(rankLimit)
  const imageUrl = toAbsoluteUrl($(cells[0]).find('a').attr('href'))

  return {
    collection: 'spells',
    number: cleanText($(cells[1]).text()),
    name,
    alias: '',
    rank,
    acquisitionLimit,
    rankLimit,
    description: cleanText($(cells[4]).text()),
    imageUrl,
    thumbnailUrl: toScaledImage(imageUrl),
    wikiUrl: toAbsoluteUrl(link.attr('href')),
    localImage: '',
    spellClass: cleanText($(cells[3]).text()),
  }
}

const buildGameMasterCard = ($, row) => {
  const cells = $(row).find('td')
  const { link, name } = extractNameAndAlias($, cells[2])
  const spellClass = cleanText($(cells[3]).text())
  const imageUrl = toAbsoluteUrl($(cells[0]).find('a').attr('href'))

  return {
    collection: 'gameMaster',
    number: cleanText($(cells[1]).text()),
    name,
    alias: '',
    rank: '*S',
    acquisitionLimit: '1',
    rankLimit: '*S-1',
    description: cleanText($(cells[4]).text()),
    imageUrl,
    thumbnailUrl: toScaledImage(imageUrl),
    wikiUrl: toAbsoluteUrl(link.attr('href')),
    localImage: '',
    spellClass,
  }
}

const extractSets = (html) => {
  const $ = cheerio.load(html)
  const tables = $('table')

  return {
    specified: tables
      .eq(0)
      .find('tr')
      .slice(1)
      .map((_, row) => buildStandardCard($, row, 'specified'))
      .get(),
    freeSlots: tables
      .eq(1)
      .find('tr')
      .slice(1)
      .map((_, row) => buildStandardCard($, row, 'freeSlots'))
      .get(),
    spells: tables
      .eq(3)
      .find('tr')
      .slice(1)
      .map((_, row) => buildSpellCard($, row))
      .get(),
    gameMaster: tables
      .eq(4)
      .find('tr')
      .slice(1)
      .map((_, row) => buildGameMasterCard($, row))
      .get(),
  }
}

const main = async () => {
  const response = await fetch(SOURCE_URL)

  if (!response.ok) {
    throw new Error(`Failed to fetch source page: ${response.status}`)
  }

  const data = await response.json()
  const sets = extractSets(data.parse.text)

  const outputDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'src',
    'data',
  )

  await mkdir(outputDir, { recursive: true })
  await writeFile(
    path.join(outputDir, 'greed-island-card-sets.json'),
    `${JSON.stringify(sets, null, 2)}\n`,
    'utf8',
  )

  console.log(
    `Generated ${sets.specified.length} specified cards, ${sets.freeSlots.length} free-slot cards, ${sets.spells.length} spell cards, and ${sets.gameMaster.length} Game Master cards.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
