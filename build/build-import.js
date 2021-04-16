
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
elementColours.set(ELEMENT_EMPTY, "rgb(45, 56, 77)")
elementColours.set(ELEMENT_VOID, "rgb(23, 29, 40)")
elementColours.set(ELEMENT_SAND, "rgb(255, 204, 70)")

const spaceElements = new Uint32Array(WORLD_AREA)

const getSpacePositionFromCanvasPosition = (cx, cy) => {
	const y = Math.floor(cy / VOXEL_HEIGHT)
	const ox = y % 2 !== 0? VOXEL_OFFSET : 0
	const x = Math.floor((cx - ox) / VOXEL_WIDTH)
	return [x, y]
}

const getSpaceIdFromPosition = (x, y) => {
	return WORLD_WIDTH * y + x
}

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

let dropperElement = ELEMENT_SAND
const update = () => {
	if (Mouse.Left) {
		const [mx, my] = Mouse.position
		const [x, y] = getSpacePositionFromCanvasPosition(mx, my)
		if (x >= WORLD_WIDTH) return
		if (y >= WORLD_HEIGHT) return
		if (x < 0) return
		if (y < 0) return
		const id = getSpaceIdFromPosition(x, y)
		spaceElements[id] = dropperElement
	}
}

const tick = () => {
	update()
	drawWorld()
	requestAnimationFrame(tick)
}

requestAnimationFrame(tick)
