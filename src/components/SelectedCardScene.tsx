import { ContactShadows, OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { DoubleSide, SRGBColorSpace } from 'three'
import type { GreedIslandCard } from '../types'

interface SelectedCardSceneProps {
  card: GreedIslandCard
}

const CARD_WIDTH = 2.22
const CARD_HEIGHT = 3.18
const CARD_DEPTH = 0.075
const CARD_FACE_Z = CARD_DEPTH / 2 + 0.003
const CARD_FRAME_Z = CARD_DEPTH / 2 + 0.001
const EDGE_COLOR = '#f0ece4'   // off-white card stock
const FRAME_COLOR = '#0c0a12'  // near-black card border
const CARD_BACK_PATH = `${import.meta.env.BASE_URL}card-back-local.png`

const toAssetPath = (assetPath: string) =>
  assetPath.startsWith('http')
    ? assetPath
    : `${import.meta.env.BASE_URL}${assetPath.replace(/^\//, '')}`

function InteractiveCard({ card }: SelectedCardSceneProps) {
  const { gl } = useThree()
  const [frontTexture, backTexture] = useTexture([
    toAssetPath(card.localImage),
    CARD_BACK_PATH,
  ])

  useEffect(() => {
    const anisotropy = gl.capabilities.getMaxAnisotropy()

    ;[frontTexture, backTexture].forEach((texture) => {
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = anisotropy
      texture.needsUpdate = true
    })
  }, [backTexture, frontTexture, gl])

  return (
    <group rotation={[-0.16, 0.34, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH]} />
        <meshPhysicalMaterial
          color={EDGE_COLOR}
          metalness={0.0}
          roughness={0.50}
          clearcoat={0.10}
          clearcoatRoughness={0.40}
        />
      </mesh>

      <mesh position={[0, 0, CARD_FACE_Z]}>
        <planeGeometry args={[CARD_WIDTH - 0.1, CARD_HEIGHT - 0.1]} />
        <meshStandardMaterial
          map={frontTexture}
          side={DoubleSide}
          metalness={0.04}
          roughness={0.66}
        />
      </mesh>

      <mesh position={[0, 0, CARD_FRAME_Z]}>
        <planeGeometry args={[CARD_WIDTH - 0.03, CARD_HEIGHT - 0.03]} />
        <meshStandardMaterial
          color={FRAME_COLOR}
          metalness={0.18}
          roughness={0.8}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      <mesh position={[0, 0, -CARD_FACE_Z]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_WIDTH - 0.1, CARD_HEIGHT - 0.1]} />
        <meshStandardMaterial
          map={backTexture}
          side={DoubleSide}
          metalness={0.08}
          roughness={0.7}
        />
      </mesh>
    </group>
  )
}

export default function SelectedCardScene({ card }: SelectedCardSceneProps) {
  return (
    <Canvas dpr={[1, 1.7]} gl={{ antialias: true, alpha: true }} shadows>
      <PerspectiveCamera makeDefault position={[0, 0.1, 6.8]} fov={34} />
      <ambientLight intensity={1.3} color="#ffffff" />
      <spotLight
        position={[4.8, 6.2, 7.8]}
        intensity={100}
        angle={0.3}
        penumbra={0.6}
        color="#ffffff"
        castShadow={false}
      />
      <pointLight position={[-4.2, -1.5, 5.5]} intensity={22} color="#7ab0ff" />
      <pointLight position={[4.8, 2.8, -4.8]} intensity={12} color="#ff8888" />

      <InteractiveCard card={card} />

      <ContactShadows
        position={[0, -2.2, 0]}
        scale={7.2}
        opacity={0.38}
        blur={2.6}
        far={5}
        resolution={512}
        color="#04060a"
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan
        enableZoom
        minDistance={4.2}
        maxDistance={9}
        rotateSpeed={0.9}
        panSpeed={0.65}
        zoomSpeed={0.95}
      />
    </Canvas>
  )
}
