import {
  Box2,
  Box3,
  Color,
  Cylindrical,
  Euler,
  Frustum,
  Interpolant,
  Line3,
  MathUtils,
  Matrix3,
  Matrix4,
  Plane,
  Quaternion,
  Ray,
  Sphere,
  Spherical,
  Triangle,
  Vector2,
  Vector3,
  Vector4,
  AdditiveBlending,
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  TextureLoader,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import rawCoords from './coords.gift'
import { Frame } from './Exporter'
import { fragmentShader, vertexShader } from './shaders'

const coords = rawCoords.map(coord => {
  return new Vector3(coord.x, coord.y, coord.z)
})

const averageCoord = new Vector3()
for (const coord of coords) {
  averageCoord.add(coord)
}
averageCoord.divideScalar(coords.length)
const boundingBox = new Box3()
boundingBox.setFromPoints(coords)

interface State {
  time: number
  duration: number
  coords: Vector3[]
  colors: Color[]
  init: () => void
  update: () => void
}

interface EventMap {
  'record-finish': (data: Frame[]) => void
  'record-start': () => void
  'record-stop': () => void
}

export class MainApp {
  private readonly renderer: WebGLRenderer
  private readonly scene: Scene
  private readonly camera: PerspectiveCamera
  private readonly state: State
  private readonly controls: OrbitControls
  private lights!: BufferGeometry

  private accumulatedTime = 0
  private previousTime = -1
  private recordedFrames: Frame[] = []
  private progressBar: HTMLDivElement
  private fpsControl: HTMLInputElement

  public recording = false
  public fps = 25

  private prerecorded = false

  private recordFinishCallback?: (data: Frame[]) => void
  private recordStartCallback?: () => void
  private recordStopCallback?: () => void

  public constructor () {
    this.progressBar = document.querySelector<HTMLDivElement>('#progressBar')!
    this.fpsControl = document.querySelector<HTMLInputElement>('#fpsLabel input')!

    this.fpsControl.oninput = () => {
      const value = Number(this.fpsControl.value)
      if (!this.fpsControl.validity.valid) {
        return
      }
      this.fps = value
      if (this.prerecorded) {
        this.resetState()
      }
    }

    const canvas = document.querySelector<HTMLCanvasElement>('#mainCanvas')!
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(70, 1, 0.01, 100)
    this.camera.position.x = 5
    this.camera.position.z = averageCoord.z
    this.camera.up.set(0, 0, 1)
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.target.copy(averageCoord)

    this.createLights()

    this.state = {
      time: 0,
      duration: 60,
      coords: coords.map(coord => new Vector3(coord.x, coord.y, coord.z)),
      colors: coords.map(_ => new Color(1, 1, 1)),

      init () {},
      update () {}
    }

    this.renderer = new WebGLRenderer({ canvas, antialias: true })
    this.renderer.setAnimationLoop(this.animation.bind(this))

    const updateSize = () => {
      const { width, height } = canvas.parentElement!.getBoundingClientRect()
      this.renderer.setSize(width, height)
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
    }

    updateSize()
    window.onresize = updateSize
  }

  public addEventListener<T extends keyof EventMap> (event: T, callback: EventMap[T]) {
    switch (event) {
      case 'record-finish':
        this.recordFinishCallback = callback
        break
      case 'record-start':
        this.recordStartCallback = callback as () => void
        break
      case 'record-stop':
        this.recordStopCallback = callback as () => void
        break
    }
  }

  public startRecording () {
    this.recording = true
    this.recordedFrames = []
    this.accumulatedTime = 0
    this.resetState()
    this.recordStartCallback?.()
  }

  public stopRecording () {
    this.recording = false
    this.recordStopCallback?.()
  }

  public updateCode (code: string) {
    try {
      const func = new Function(
        'app',
        'N',
        'COORDS',
        'BBOX',

        'Box2',
        'Box3',
        'Color',
        'Cylindrical',
        'Euler',
        'Frustum',
        'Interpolant',
        'Line3',
        'MathUtils',
        'Matrix3',
        'Matrix4',
        'Plane',
        'Quaternion',
        'Ray',
        'Sphere',
        'Spherical',
        'Triangle',
        'Vector2',
        'Vector3',
        'Vector4',
        code
      )

      func(
        this.state,
        this.state.colors.length,
        this.state.coords,
        boundingBox,
        Box2,
        Box3,
        Color,
        Cylindrical,
        Euler,
        Frustum,
        Interpolant,
        Line3,
        MathUtils,
        Matrix3,
        Matrix4,
        Plane,
        Quaternion,
        Ray,
        Sphere,
        Spherical,
        Triangle,
        Vector2,
        Vector3,
        Vector4
      )
      this.resetState()
      this.prerecorded = false
    } catch (e) {
      console.error(e)
    }
  }

  public playFrames (frames: Frame[]) {
    let index = 0
    this.state.init = () => {
      this.state.duration = frames.length / this.fps
      index = 0
    }

    this.state.update = () => {
      for (let i = 0; i < this.state.colors.length; i++) {
        this.state.colors[i] = frames[index].colors[i]
      }
      index++
      if (index === frames.length) {
        index = 0
      }
    }
    this.resetState()
    this.prerecorded = true
  }

  private animation (time: number) {
    const msPerFrame = 1000 / this.fps
    const skip = this.previousTime === -1
    const delta = time - this.previousTime
    this.previousTime = time
    if (skip) {
      return
    }
    this.accumulatedTime += this.recording ? 5 * delta : delta
    while (this.accumulatedTime >= msPerFrame) {
      this.accumulatedTime -= msPerFrame
      this.state.time += msPerFrame / 1000

      if (this.state.time >= this.state.duration) {
        if (this.recording) {
          this.finishRecording()
        }
        this.resetState()
      } else {
        this.updateState()
        if (this.recording) {
          this.recordFrame()
        }
      }
    }

    this.controls.update()

    this.renderer.render(this.scene, this.camera)
  }

  private resetState () {
    this.state.time = 0
    this.state.init()
    this.state.update()
  }

  private updateState () {
    try {
      this.state.update()
    } catch (e) {
      // TODO: handle exception
      console.error(e)
      this.state.update = () => {}
    }
    const colors = this.lights.attributes.color
    const colorsArray = colors.array as number[]
    for (let i = 0; i < this.state.colors.length; i++) {
      // Use fallbacks wherever possible to prevent weird values from 'crashing' the app
      const color = this.state.colors[i] || { r: 0, g: 0, b: 0 }
      colorsArray[i * 3] = color.r || 0
      colorsArray[i * 3 + 1] = color.g || 0
      colorsArray[i * 3 + 2] = color.b || 0
    }

    colors.needsUpdate = true

    this.progressBar.style.width = `${this.state.time / this.state.duration * 100}%`
  }

  private finishRecording () {
    this.recording = false
    this.recordFinishCallback?.(this.recordedFrames)
    this.recordStopCallback?.()
  }

  private recordFrame () {
    this.recordedFrames.push({
      colors: this.state.colors.map(color => color.clone())
    })
  }

  private createLights () {
    const positions = [] as number[]
    const colors = [] as number[]

    // There are some incorrectly scanned lights which all have the same coordinate. To make sure we render only
    // one light per coordinate, we have to do some filtering...
    const processedCoords = new Set<string>()
    for (const coord of coords) {
      const key = `${coord.x}|${coord.y}|${coord.z}`
      if (processedCoords.has(key)) {
        // ...and just move the invalid lights out of sight
        positions.push(0, 0, -10000)
      } else {
        positions.push(coord.x, coord.y, coord.z)
      }
      processedCoords.add(key)
      colors.push(1, 1, 1)
    }
    const geometry = this.lights = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3).setUsage(DynamicDrawUsage))
    const lightsObject = new Points(geometry, new ShaderMaterial({
      uniforms: {
        pointTexture: { value: new TextureLoader().load('/flare.png') }
      },
      vertexShader,
      fragmentShader,
      blending: AdditiveBlending,
      depthTest: false,
      transparent: true,
      vertexColors: true
    }))

    this.scene.add(lightsObject)
  }
}
