
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

const VOXEL_INNER_WIDTH = 40
const VOXEL_INNER_HEIGHT = 40
const VOXEL_PADDING_X = 5
const VOXEL_PADDING_Y = 5
const VOXEL_WIDTH = VOXEL_INNER_WIDTH + VOXEL_PADDING_X
const VOXEL_HEIGHT = VOXEL_INNER_HEIGHT + VOXEL_PADDING_Y
const VOXEL_OFFSET = VOXEL_WIDTH / 2

// https://en.wikipedia.org/wiki/Hexagon
const HEX_RAT = 0.8660254

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
	const x = Math.floor((cx / HEX_RAT) / VOXEL_WIDTH)
	const oy = x % 2 !== 0? VOXEL_OFFSET : 0
	const y = Math.floor((cy - oy) / VOXEL_HEIGHT)
	return [x, y]
}

const getSpaceIdFromPosition = (x, y) => {
	return WORLD_WIDTH * y + x
}

const drawWorld = () => {

	context.fillStyle = "rgb(23, 29, 40)"
	context.fillRect(0, 0, canvas.height, canvas.width)

	let id = 0
	let x = 0
	let xDraw = 0
	let yDraw = 0
	let isOddColumn = false
	while (id < WORLD_AREA) {
		const element = spaceElements[id]
		const colour = elementColours.get(element)
		context.fillStyle = colour
		//context.fillRect(xDraw, yDraw, VOXEL_INNER_WIDTH, VOXEL_INNER_HEIGHT)
		fillHexagon(xDraw * 0.8660254, yDraw + (isOddColumn? VOXEL_HEIGHT / 2 : 0), VOXEL_INNER_WIDTH)
		id++
		x++
		isOddColumn = !isOddColumn
		if (x >= WORLD_WIDTH) {
			x = 0
			xDraw = 0
			yDraw += VOXEL_HEIGHT
		}
		else {
			xDraw += VOXEL_WIDTH
		}
	}
}

const fillHexagon = (x, y, size) => {
	context.beginPath()

	const edgeBit = (size - (size * HEX_RAT))
	edgeBit.d9

	const left = [x, y + size/2]
	const topLeft = [x + edgeBit, y]
	const topRight = [x + size - edgeBit, y]
	const right = [x + size, y + size/2]
	const bottomRight = [x + size - edgeBit, y + size]
	const bottomLeft = [x + edgeBit, y + size]

	context.moveTo(...left)
	context.lineTo(...topLeft)
	context.lineTo(...topRight)
	context.lineTo(...right)
	context.lineTo(...bottomRight)
	context.lineTo(...bottomLeft)
	context.lineTo(...left)
	context.closePath()
	context.fill()
}

let dropperElement = ELEMENT_SAND
let dropperPreviousPosition = [undefined, undefined]
const update = () => {
	if (Mouse.Left) {
		const [mx, my] = Mouse.position
		const [sx, sy] = getSpacePositionFromCanvasPosition(mx, my)
		if (sx >= WORLD_WIDTH || sy >= WORLD_HEIGHT || sx < 0 || sy < 0) {
			dropperPreviousPosition = [undefined, undefined]
		}
		else {
			const [px, py] = dropperPreviousPosition
			if (px === undefined || py === undefined) {
				const id = getSpaceIdFromPosition(sx, sy)
				spaceElements[id] = dropperElement
			}
			else {
				const [dx, dy] = [mx - px, my - py]
				const dmax = Math.max(Math.abs(dx), Math.abs(dy))
				if (dmax === 0) {
					const id = getSpaceIdFromPosition(sx, sy)
					spaceElements[id] = dropperElement
				}
				else {
					const [rx, ry] = [dx / dmax, dy / dmax]
					let [ix, iy] = dropperPreviousPosition
					for (let i = 0; i < dmax; i++) {
						ix += rx
						iy += ry
						const [x, y] = getSpacePositionFromCanvasPosition(ix, iy)
						const id = getSpaceIdFromPosition(Math.floor(x), Math.floor(y))
						spaceElements[id] = dropperElement
					}
				}
			}
			dropperPreviousPosition = [mx, my]
		}
	}
	else {
		dropperPreviousPosition = [undefined, undefined]
	}
}

const tick = () => {
	update()
	drawWorld()
	requestAnimationFrame(tick)
}

requestAnimationFrame(tick)
