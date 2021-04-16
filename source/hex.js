
const canvas = document.createElement("canvas")
const context = canvas.getContext("2d")
canvas.style["image-rendering"] = "pixelated"

on.load(() => {
	document.body.appendChild(canvas)
    document.body.style["margin"] = "0"
    canvas.style["background-color"] = "rgb(23, 29, 40)"
    trigger("resize")
})

on.resize(() => {
    canvas.width = innerWidth
    canvas.height = innerHeight
})

const WORLD_WIDTH = 100
const WORLD_HEIGHT = 100
const WORLD_AREA = WORLD_WIDTH * WORLD_HEIGHT

const VOXEL_INNER_WIDTH = 8
const VOXEL_INNER_HEIGHT = 8
const VOXEL_PADDING_X = 2
const VOXEL_PADDING_Y = 2
const VOXEL_WIDTH = VOXEL_INNER_WIDTH + VOXEL_PADDING_X
const VOXEL_HEIGHT = VOXEL_INNER_HEIGHT + VOXEL_PADDING_Y
const VOXEL_OFFSET = VOXEL_WIDTH / 2

const SPACE_ELEMENT = 0
const SPACE_UP = 1
const SPACE_DOWN = 2
const SPACE_RIGHT_UP = 3
const SPACE_RIGHT_DOWN = 4
const SPACE_LEFT_UP = 5
const SPACE_LEFT_DOWN = 6
const SPACE_LENGTH = 7

const ELEMENT_EMPTY = 0
const ELEMENT_VOID = 1
const ELEMENT_SAND = 2
const ELEMENT_LENGTH = 3

const elementColours = new Map()
elementColours.set(ELEMENT_EMPTY, "rgb(224, 224, 224)")
elementColours.set(ELEMENT_VOID, "rgb(224, 224, 224)")
elementColours.set(ELEMENT_SAND, "rgb(255, 204, 70)")

const spaceElements = new Uint32Array(WORLD_AREA)

const drawWorld = () => {
	let id = 0
	let x = 0
	let xDraw = 0
	let yDraw = 0
	let isOddRow = false
	while (id < WORLD_AREA) {
		const element = spaceElements[id]
		const colour = elementColours.get(element)
		context.fillStyle = colour
		context.fillRect(xDraw, yDraw, VOXEL_INNER_WIDTH, VOXEL_INNER_HEIGHT)
		id++
		x++
		if (x >= WORLD_WIDTH) {
			x = 0
			xDraw = isOddRow? 0 : VOXEL_OFFSET
			yDraw += VOXEL_HEIGHT
			isOddRow = !isOddRow
		}
		else {
			xDraw += VOXEL_WIDTH
		}
	}
}

const tick = () => {
	drawWorld()
	requestAnimationFrame(tick)
}

requestAnimationFrame(tick)
