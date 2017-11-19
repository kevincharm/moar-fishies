import * as THREE from 'three'

export default class CustomCamera extends THREE.PerspectiveCamera {
    constructor(world) {
        super(45, world.window.innerWidth/world.window.innerHeight, 0.1, 250)
        this.world = world

        this.attachControl()
        world.onLoaded(() => {
            // Setting the camera AFTER meshes have loaded prevents glitchiness
            world.setCamera(this)
        })
    }

    attachControl(container = this.world.renderer.domElement) {
        const wnd = this.world.window
        const doc = wnd.document
        wnd.addEventListener('resize', () => {
            this.aspect = wnd.innerWidth/wnd.innerHeight
            this.updateProjectionMatrix()
        })
    }
}
