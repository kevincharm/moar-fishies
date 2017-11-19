import * as THREE from 'three'
import '../lib/THREEPlugins'

export default class World {
    constructor(wnd) {
        this.window = wnd
        this.clock = new THREE.Clock()
        this.isLoading = true
        this.loader = THREE.DefaultLoadingManager
        this.onLoadedCallbacks = []
        this.loader.onLoad = () => {
            this.isLoading = false
            while (this.onLoadedCallbacks.length) {
                const cb = this.onLoadedCallbacks.pop()
                cb()
            }
        }
        this.loader.onError = url => console.error(`There was an error loading ${url}`)

        this.setupRenderer()
        this.setupScene()
        this.setupLighting()

        // Auto resize engine
        wnd.addEventListener('resize', () => {
            this.renderer.setSize(wnd.innerWidth, wnd.innerHeight)
        })

        this.onRenderCallbacks = []
        this.animationMixers = []
        this.loadedFbx = {}
    }

    drawGridQuadrant(signX, signZ) {
        const GRID_SIZE = 10
        const GRID_N = 20

        const sX = signX > 0 ? 1 : -1
        const sZ = signZ > 0 ? 1 : -1
        for (let i=0; i<GRID_N; i++) {
            for (let j=0; j<GRID_N; j++) {
                const offX = i*GRID_SIZE*sX
                const offZ = j*GRID_SIZE*sZ
                const geo = new THREE.BufferGeometry()
                const verts = new Float32Array([
                    offX,            0,    offZ,
                    offX,            0,    offZ+GRID_SIZE,
                    offX+GRID_SIZE,  0,    offZ+GRID_SIZE,
                    offX+GRID_SIZE,  0,    offZ,
                    offX,            0,    offZ
                ])
                geo.addAttribute('position', new THREE.BufferAttribute(verts, 3))
                const mat = new THREE.LineBasicMaterial({ color: 0 })
                const line = new THREE.Line(geo, mat)
                this.scene.add(line)
            }
        }
    }

    setupRenderer() {
        const renderer = new THREE.WebGLRenderer({ alpha: true })
        renderer.setSize(this.window.innerWidth, this.window.innerHeight)
        this.renderer = renderer
        this.window.document.body.appendChild(renderer.domElement)
    }

    setupScene() {
        const scene = new THREE.Scene()
        this.scene = scene
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        this.scene.add(ambientLight)
        this.ambientLight = ambientLight
        const pointLight = new THREE.PointLight(0xffffff, 0.75, 100)
        Object.assign(pointLight.position, { x: -10, y: 20, z: 10 })
        this.scene.add(pointLight)
        this.pointLight = pointLight
        const pointLight2 = new THREE.PointLight(0xffffff, 0.75, 100)
        Object.assign(pointLight2.position, { x: 10, y: 20, z: -10 })
        this.scene.add(pointLight2)
        this.pointLight2 = pointLight2
    }

    addAnimationMixer(mixer) {
        this.animationMixers.push(mixer)
    }

    loadFbx(name, filename, addToScene = false, cb = () => {}) {
        const fbxLoader = new THREE.FBXLoader(this.loader)
        fbxLoader.load(filename, object => {
            object.name = name
            if (this.loadedFbx[name]) {
                console.log(`Warning: overwriting existing FBX '${name}'!`)
            }
            this.loadedFbx[name] = object
            if (addToScene) this.scene.add(object)
            cb(null, object)
        }, xhr => {
            // console.log(xhr.loaded/xhr.total*100 + '% loaded')
        }, xhr => {
            const errMsg = `Error loading FBX '${name}': ${JSON.stringify(xhr)}!`
            console.error(errMsg)
            cb(new Error(errMsg), null)
        })
    }

    onLoaded(cb) {
        if (typeof cb !== 'function') {
            throw new Error(`${cb} must be a function!`)
        }

        if (this.isLoading) {
            this.onLoadedCallbacks.push(cb)
        } else {
            // Already loaded, invoke callback immediately
            cb()
        }
    }

    onRender(cb) {
        if (typeof cb !== 'function') {
            throw new Error(`${cb} must be a function!`)
        } else {
            this.onRenderCallbacks.push(cb)
        }
    }

    setCamera(camera) {
        this.camera = camera
    }

    render() {
        // Store the delta so it can be passed around (for consistency)
        const clockDelta = this.clock.getDelta()
        // Run animations
        this.animationMixers.forEach(mixer => mixer.update(clockDelta))
        // Run onRender subscriptions
        this.onRenderCallbacks.forEach(cb => cb(clockDelta))
        // Render current frame only if camera available
        if (this.camera) {
            this.renderer.render(this.scene, this.camera)
        } else {
            // console.error('No camera has been setup yet!')
        }
        // Next frame
        requestAnimationFrame(() => this.render())
    }
}
