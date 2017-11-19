import './styles/index.scss'
import './index.html'

import * as THREE from 'three'

import World from './classes/World'
import CustomCamera from './classes/CustomCamera'

class Fish {
    constructor(world) {
        this.world = world

        const fish1 = world.loadedFbx['fish1']
        this.mesh = fish1.clone()
        world.scene.add(this.mesh)
        Object.assign(this.mesh.scale, { x: 0.1, y: 0.1, z: 0.1 })
        this.mesh.rotation.y = Math.PI/2

        this.destination = new THREE.Vector3()
        this.directionTimer = setInterval(() => {
            Object.assign(this.destination, {
                x: Math.random()*10,
                y: Math.random()*10
            })
        }, 2500)

        world.onRender(t => this.render(t))
    }

    destroy() {
        clearInterval(this.directionTimer)
        this.directionTimer = null
    }

    render(t) {
        const mesh = this.mesh
        const pos = mesh.position
        const dest = this.destination
        const distX = dest.x-pos.x
        const distY = dest.y-pos.y
        const rot = mesh.rotation
        if (distX > 0 && rot.y < Math.PI/2) {
            rot.y = Math.min(rot.y+Math.PI*2.*t, Math.PI/2)
        } else if (distX < 0 && rot.y > -Math.PI/2) {
            rot.y = Math.max(rot.y-Math.PI*2.*t, -Math.PI/2)
        } else {
            pos.x = pos.x+(distX*1.*t)
            pos.y = pos.y+(distY*1.*t)
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const world = new World(window)
    world.scene.background.set(0x77bbcc)
    const camera = new CustomCamera(world)
    Object.assign(camera.position, { y: 5, z: 20 })

    world.loadFbx('fish1', '/assets/models/fish1/fish1.fbx', false)
    world.onLoaded(() => {
        new Fish(world)
    })

    world.render()
    world.showGrid()
})
