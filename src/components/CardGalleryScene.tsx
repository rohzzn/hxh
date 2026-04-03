import { PerspectiveCamera, Sparkles, useCursor, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  DoubleSide,
  Group,
  MathUtils,
  PerspectiveCamera as ThreePerspectiveCamera,
  SRGBColorSpace,
  Texture,
} from 'three'
import type { GreedIslandCard } from '../types'

interface CardGallerySceneProps {
  cards: GreedIslandCard[]
  selectedCard: GreedIslandCard | null
  onSelect: (card: GreedIslandCard | null) => void
}

interface GalleryCardProps {
  backTexture: Texture
  card: GreedIslandCard
  index: number
  onSelect: (card: GreedIslandCard) => void
  position: [number, number, number]
  selected: boolean
  texture: Texture
}

interface GalleryLayout {
  boardHeight: number
  boardWidth: number
  columns: number
  rows: number
}

interface ResponsiveCameraProps {
  cameraRef: RefObject<ThreePerspectiveCamera | null>
  layout: GalleryLayout
}

const CARD_WIDTH = 1.08
const CARD_HEIGHT = 1.56
const CARD_DEPTH = 0.04
const CARD_THICKNESS = CARD_DEPTH * 1.18
const CARD_FACE_Z = CARD_THICKNESS / 2 + 0.0025
const CARD_FRAME_Z = CARD_THICKNESS / 2 + 0.001
const GAP_X = 1.26
const GAP_Y = 1.82
const EDGE_COLOR = '#f0ece4'   // off-white card stock
const FRAME_COLOR = '#0c0a12'  // near-black card border
const CARD_BACK_PATH = `${import.meta.env.BASE_URL}card-back-local.png`
const CAMERA_FOV = 38

const toAssetPath = (assetPath: string) =>
  assetPath.startsWith('http')
    ? assetPath
    : `${import.meta.env.BASE_URL}${assetPath.replace(/^\//, '')}`

const getLayout = (totalCards: number): GalleryLayout => {
  const columns = totalCards <= 20 ? 5 : totalCards <= 40 ? 8 : 10
  const rows = Math.ceil(totalCards / columns)

  return {
    columns,
    rows,
    boardWidth: (columns - 1) * GAP_X + CARD_WIDTH + 1.6,
    boardHeight: (rows - 1) * GAP_Y + CARD_HEIGHT + 1.6,
  }
}

function ResponsiveCamera({ cameraRef, layout }: ResponsiveCameraProps) {
  const { size } = useThree()

  useEffect(() => {
    const camera = cameraRef.current
    const aspect = size.width / Math.max(size.height, 1)

    if (!camera) {
      return
    }

    const halfFov = MathUtils.degToRad(CAMERA_FOV / 2)
    const verticalDistance = layout.boardHeight / (2 * Math.tan(halfFov))
    const horizontalDistance =
      layout.boardWidth / (2 * Math.tan(halfFov) * aspect)
    const distance = Math.max(verticalDistance, horizontalDistance) + 7

    camera.position.set(0, 0, distance)
    camera.aspect = aspect
    camera.fov = CAMERA_FOV
    camera.updateProjectionMatrix()
  }, [cameraRef, layout.boardHeight, layout.boardWidth, size])

  return null
}

function GalleryCard({
  backTexture,
  card,
  index,
  onSelect,
  position,
  selected,
  texture,
}: GalleryCardProps) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useFrame((_, delta) => {
    if (!group.current) {
      return
    }

    const targetZ = selected ? 1.1 : hovered ? 0.32 : 0
    const targetScale = selected ? 1.08 : hovered ? 1.04 : 1
    const hoverRotationY = index % 2 === 0 ? 0.12 : -0.12
    const targetRotationY = selected ? 0.03 : hovered ? hoverRotationY : 0
    const targetRotationX = selected ? -0.1 : hovered ? -0.18 : 0

    group.current.position.z = MathUtils.damp(
      group.current.position.z,
      targetZ,
      7,
      delta,
    )
    group.current.scale.x = MathUtils.damp(group.current.scale.x, targetScale, 7, delta)
    group.current.scale.y = MathUtils.damp(group.current.scale.y, targetScale, 7, delta)
    group.current.scale.z = MathUtils.damp(group.current.scale.z, targetScale, 7, delta)
    group.current.rotation.x = MathUtils.damp(
      group.current.rotation.x,
      targetRotationX,
      7,
      delta,
    )
    group.current.rotation.y = MathUtils.damp(
      group.current.rotation.y,
      targetRotationY,
      7,
      delta,
    )
  })

  return (
    <group
      ref={group}
      position={position}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(card)
      }}
      onPointerEnter={(event) => {
        event.stopPropagation()
        setHovered(true)
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_THICKNESS]} />
        <meshStandardMaterial
          color={EDGE_COLOR}
          metalness={0.0}
          roughness={0.55}
          emissive={selected ? '#e52222' : hovered ? '#991111' : '#000000'}
          emissiveIntensity={selected ? 0.12 : hovered ? 0.06 : 0}
        />
      </mesh>

      <mesh position={[0, 0, CARD_FACE_Z]}>
        <planeGeometry args={[CARD_WIDTH - 0.07, CARD_HEIGHT - 0.07]} />
        <meshStandardMaterial
          map={texture}
          side={DoubleSide}
          metalness={0.02}
          roughness={0.68}
        />
      </mesh>

      <mesh position={[0, 0, CARD_FRAME_Z]}>
        <planeGeometry args={[CARD_WIDTH - 0.02, CARD_HEIGHT - 0.02]} />
        <meshStandardMaterial
          color={FRAME_COLOR}
          metalness={0.16}
          roughness={0.78}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      <mesh position={[0, 0, -CARD_FACE_Z]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_WIDTH - 0.07, CARD_HEIGHT - 0.07]} />
        <meshStandardMaterial
          map={backTexture}
          side={DoubleSide}
          metalness={0.1}
          roughness={0.72}
        />
      </mesh>
    </group>
  )
}

function GalleryRig({
  cards,
  selectedCard,
  onSelect,
  layout,
}: CardGallerySceneProps & { layout: GalleryLayout }) {
  const { gl } = useThree()
  const textureUrls = useMemo(
    () => cards.map((card) => toAssetPath(card.localImage)),
    [cards],
  )
  const textures = useTexture(textureUrls)
  const backTexture = useTexture(CARD_BACK_PATH)

  useEffect(() => {
    const anisotropy = gl.capabilities.getMaxAnisotropy()

    textures.forEach((texture) => {
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = anisotropy
      texture.needsUpdate = true
    })
  }, [gl, textures])

  const positions = useMemo(
    () =>
      cards.map((_, index) => {
        const column = index % layout.columns
        const row = Math.floor(index / layout.columns)
        const x = (column - (layout.columns - 1) / 2) * GAP_X
        const y = ((layout.rows - 1) / 2 - row) * GAP_Y

        return [x, y, 0] as [number, number, number]
      }),
    [cards, layout.columns, layout.rows],
  )

  return (
    <group position={[0, 0, 0]}>
      <Sparkles
        count={Math.max(36, Math.round(cards.length * 0.9))}
        scale={[layout.boardWidth + 8, layout.boardHeight + 6, 7]}
        size={2.2}
        speed={0.22}
        color="#ffcc40"
        opacity={0.28}
      />

      {cards.map((card, index) => (
        <GalleryCard
          key={`${card.collection}-${card.number}`}
          backTexture={backTexture}
          card={card}
          index={index}
          onSelect={onSelect}
          position={positions[index]}
          selected={selectedCard?.collection === card.collection && selectedCard?.number === card.number}
          texture={textures[index]}
        />
      ))}
    </group>
  )
}

export default function CardGalleryScene({
  cards,
  selectedCard,
  onSelect,
}: CardGallerySceneProps) {
  const cameraRef = useRef<ThreePerspectiveCamera>(null)
  const layout = useMemo(() => getLayout(cards.length), [cards.length])

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={(event) => {
        if (event.type === 'click') {
          onSelect(null)
        }
      }}
      shadows={false}
    >
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 33]} fov={CAMERA_FOV} />
      <ResponsiveCamera cameraRef={cameraRef} layout={layout} />
      <ambientLight intensity={1.1} color="#ffffff" />
      <directionalLight position={[0, 3, 10]} intensity={2.0} color="#ffffff" />
      <pointLight position={[-10, 8, 10]} intensity={18} color="#6aabff" />
      <pointLight position={[10, -4, 8]} intensity={14} color="#ff6666" />
      <GalleryRig
        cards={cards}
        selectedCard={selectedCard}
        onSelect={onSelect}
        layout={layout}
      />
    </Canvas>
  )
}
