import './styles/index.scss'
import './index.html'

import * as THREE from 'three'

import World from './classes/World'
import CustomCamera from './classes/CustomCamera'

const cloneFbx = (fbx) => {
    const clone = fbx.clone(true)
    clone.animations = fbx.animations
    clone.skeleton = { bones: [] }

    const skinnedMeshes = {}

    fbx.traverse(node => {
        if (node.isSkinnedMesh) {
            skinnedMeshes[node.name] = node
        }
    })

    const cloneBones = {}
    const cloneSkinnedMeshes = {}

    clone.traverse(node => {
        if (node.isBone) {
            cloneBones[node.name] = node
        }

        if (node.isSkinnedMesh) {
            cloneSkinnedMeshes[node.name] = node
        }
    })

    for (let name in skinnedMeshes) {
        const skinnedMesh = skinnedMeshes[name]
        const skeleton = skinnedMesh.skeleton
        const cloneSkinnedMesh = cloneSkinnedMeshes[name]

        const orderedCloneBones = []

        for (let i=0; i<skeleton.bones.length; i++) {
            const cloneBone = cloneBones[skeleton.bones[i].name]
            orderedCloneBones.push(cloneBone)
        }

        cloneSkinnedMesh.bind(
            new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
            cloneSkinnedMesh.matrixWorld)

        // For animation to work correctly:
        clone.skeleton.bones.push(cloneSkinnedMesh)
        clone.skeleton.bones.push(...orderedCloneBones)
    }

    return clone
}

class Fish {
    constructor(world) {
        this.world = world
        this.velocity = 1.
        this.bounds = new THREE.Vector3(30, 15, 5)

        // Load mesh
        const fish1 = world.loadedFbx['fish1']
        const fishIdle = world.loadedFbx['fishIdle']
        this.mesh = cloneFbx(fish1)
        this.mesh.animations = [...fishIdle.animations]
        this.mesh.animations[0].name = 'idle'
        this.mesh.animations.forEach(clip => clip.resetDuration())
        const mixer = new THREE.AnimationMixer(this.mesh)
        world.addAnimationMixer(mixer)
        this.animationMixer = mixer
        world.scene.add(this.mesh)
        Object.assign(this.mesh.scale, { x: 0.2, y: 0.2, z: 0.2 })
        Object.assign(this.mesh.position, {
            y: this.bounds.y,
            z: Math.random()*this.bounds.z
        })

        this.playAnimation('idle')

        this.destination = new THREE.Vector3()
        Object.assign(this.destination, {
            x: Math.random()*this.bounds.x-this.bounds.x/2,
            y: 2.+Math.random()*this.bounds.y
        })
        this.startDirectionTimer()

        world.onRender(t => this.render(t))
    }

    playAnimation(name) {
        if (this.lastAnimation === name) return

        const lastClip = THREE.AnimationClip.findByName(this.mesh, this.lastAnimation)
        const nextClip = THREE.AnimationClip.findByName(this.mesh, name)
        if (nextClip instanceof THREE.AnimationClip) {
            const existingAction = this.animationMixer.existingAction(lastClip)
            this.animationMixer.stopAllAction()
            if (existingAction) {
                this.animationMixer.clipAction(nextClip).play().crossFadeFrom(existingAction, 0.2)
            } else {
                this.animationMixer.clipAction(nextClip).play()
            }
        }
        this.lastAnimation = name
    }

    startDirectionTimer() {
        this.directionTimer = setInterval(() => {
            const rnd = Math.random()*100
            if (rnd > 50) {
                Object.assign(this.destination, {
                    x: Math.random()*this.bounds.x-this.bounds.x/2,
                    y: 2.+Math.random()*this.bounds.y
                })
            }
        }, 2500)
    }

    destroy() {
        clearInterval(this.directionTimer)
        this.directionTimer = null
    }

    render(t) {
        const ROT_RIGHT = Math.PI
        const ROT_LEFT = 0
        const mesh = this.mesh
        const pos = mesh.position
        const dest = this.destination
        const distX = dest.x-pos.x
        const distY = dest.y-pos.y
        const v = this.velocity
        const rot = mesh.rotation
        if (distX > 0 && rot.y < ROT_RIGHT) {
            rot.y = Math.min(rot.y+Math.PI*2.*v*t, ROT_RIGHT)
        } else if (distX < 0 && rot.y > ROT_LEFT) {
            rot.y = Math.max(rot.y-Math.PI*2.*v*t, ROT_LEFT)
        } else {
            pos.x = pos.x+(distX*v*t)
            pos.y = pos.y+(distY*v*t)
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const world = new World(window)
    const camera = new CustomCamera(world)
    Object.assign(camera.position, { y: 10, z: 40 })

    const w = 80
    const h = 20
    const d = 30
    const t = 0.2

    const sandTexture = new THREE.TextureLoader().load('/assets/materials/sand.jpg')
    const sandMaterial = new THREE.MeshLambertMaterial({ map: sandTexture })
    const sandGeometry = new THREE.BoxGeometry(w, 1, d)
    const seabed = new THREE.Mesh(sandGeometry, sandMaterial)
    Object.assign(seabed.position, { y: -0.5, z: d/4 })
    world.scene.add(seabed)

    world.loadFbx('fish1', '/assets/models/fish1/fish1.fbx', false)
    world.loadFbx('fishIdle', '/assets/models/fish1/fish1@idle.fbx', false)
    const fishes = []
    world.onLoaded(() => {
        let startingFish = 1
        ;(function moreFish() {
            if (startingFish-- > 0) {
                fishes.push(new Fish(world))
                setTimeout(moreFish, 1000+Math.round(Math.random()*1500))
            }
        })()
    })

    world.render()

    const btnAddFish = document.querySelector('.add-fish')
    btnAddFish.addEventListener('click', event => {
        fishes.push(new Fish(world))
    })
})
