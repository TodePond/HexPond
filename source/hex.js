
const canvas = document.createElement("canvas")
const context = canvas.getContext("2d")
//canvas.style["image-rendering"] = "pixelated"

on.load(() => {
	document.body.appendChild(canvas)
    document.body.style["margin"] = "0"
    canvas.style["background-color"] = "rgb(23, 29, 40)"
    trigger("resize")
})

on.resize(() => {
    canvas.width = innerWidth
    canvas.height = innerHeight
	drawWorld()
})

const WORLD_WIDTH = 200
const WORLD_HEIGHT = 200
const WORLD_AREA = WORLD_WIDTH * WORLD_HEIGHT

// https://en.wikipedia.org/wiki/Hexagon
const HEX_RAT = 0.8660254

const VOXEL_INNER_WIDTH = 5
const VOXEL_INNER_HEIGHT = 5
const VOXEL_PADDING_X = 0
const VOXEL_PADDING_Y = 0
const VOXEL_WIDTH = VOXEL_INNER_WIDTH + VOXEL_PADDING_X
const VOXEL_HEIGHT = VOXEL_INNER_HEIGHT + VOXEL_PADDING_Y
const VOXEL_OFFSET = VOXEL_WIDTH / 2
const VOXEL_WIDTH_HEX = VOXEL_WIDTH * 0.8660254

const EW_UP = 0
const EW_DOWN = 1
const EW_RIGHT_UP = 2
const EW_RIGHT_DOWN = 3
const EW_LEFT_UP = 4
const EW_LEFT_DOWN = 5
const EW_LENGTH = 6

const ELEMENT_EMPTY = 0
const ELEMENT_VOID = 1
const ELEMENT_SAND = 2
const ELEMENT_WALL = 3
const ELEMENT_WATER = 4
const ELEMENT_LENGTH = 5

const elementColours = new Map()
elementColours.set(ELEMENT_EMPTY, "rgb(45, 56, 77)")
elementColours.set(ELEMENT_VOID, "rgb(23, 29, 40)")
elementColours.set(ELEMENT_SAND, "rgb(255, 204, 70)")
elementColours.set(ELEMENT_WALL, "rgb(65, 76, 97)")
elementColours.set(ELEMENT_WATER, "rgb(70, 128, 255)")

const elementBehaves = new Map()
elementBehaves.set(ELEMENT_SAND, (origin) => {
	const below = getNeighbour(origin, EW_DOWN)
	const belowElement = spaceElements[below]
	if (belowElement === ELEMENT_EMPTY || belowElement === ELEMENT_WATER) {
		setSpace(below, ELEMENT_SAND)
		setSpace(origin, belowElement)
		return
	}

	const slide = getNeighbour(origin, oneIn(2)? EW_LEFT_DOWN : EW_RIGHT_DOWN)
	const slideElement = spaceElements[slide]
	if (slideElement === ELEMENT_EMPTY || slideElement === ELEMENT_WATER) {
		setSpace(slide, ELEMENT_SAND)
		setSpace(origin, slideElement)
	}
})

elementBehaves.set(ELEMENT_WATER, (origin) => {
	const below = getNeighbour(origin, EW_DOWN)
	const belowElement = spaceElements[below]
	if (belowElement === ELEMENT_EMPTY) {
		setSpace(below, ELEMENT_WATER)
		setSpace(origin, ELEMENT_EMPTY)
		return
	}
	
	const right = oneIn(2)
	const slide = getNeighbour(origin, right? EW_RIGHT_DOWN : EW_LEFT_DOWN)
	const slideElement = spaceElements[slide]
	if (slideElement === ELEMENT_EMPTY) {
		setSpace(slide, ELEMENT_WATER)
		setSpace(origin, ELEMENT_EMPTY)
		return
	}
	
	const slide2 = getNeighbour(origin, right? EW_LEFT_DOWN : EW_RIGHT_DOWN)
	const slide2Element = spaceElements[slide2]
	if (slide2Element === ELEMENT_EMPTY) {
		setSpace(slide2, ELEMENT_WATER)
		setSpace(origin, ELEMENT_EMPTY)
		return
	}

	const slip = getNeighbour(origin, right? EW_LEFT_UP : EW_RIGHT_UP)
	const slipElement = spaceElements[slip]
	if (slipElement === ELEMENT_EMPTY) {
		setSpace(slip, ELEMENT_WATER)
		setSpace(origin, ELEMENT_EMPTY)
		return
	}

	const slip2 = getNeighbour(origin, right? EW_RIGHT_UP : EW_LEFT_UP)
	const slip2Element = spaceElements[slip2]
	if (slip2Element === ELEMENT_EMPTY) {
		setSpace(slip2, ELEMENT_WATER)
		setSpace(origin, ELEMENT_EMPTY)
	}
})

const spaceElements = new Uint32Array(WORLD_AREA)
const spaceNeighbours = new Int32Array(WORLD_AREA * EW_LENGTH)
const spaceNeighbourOffsets = new Uint32Array(WORLD_AREA)
const spacePositions = new Float32Array(WORLD_AREA * 2)

for (let i = 0; i < WORLD_AREA; i++) {
	spaceNeighbourOffsets[i] = i*6 //V8 why
}

const getNeighbour = (space, neighbour) => {
	const offset = spaceNeighbourOffsets[space] + neighbour
	return spaceNeighbours[offset]
}

let previousElement = -1
const setSpace = (id, element) => {
	if (id === -1) return
	spaceElements[id] = element
	const poffset = id * 2
	const xDraw = spacePositions[poffset]
	const yDraw = spacePositions[poffset + 1]
	if (previousElement !== element) {
		const colour = elementColours.get(element)
		context.fillStyle = colour //slow
		previousElement = element
	}
	fillHexagon(xDraw, yDraw)
}

const getSpacePositionFromCanvasPosition = (cx, cy) => {
	const x = Math.floor((cx / HEX_RAT) / VOXEL_WIDTH)
	const oy = x % 2 !== 0? VOXEL_OFFSET : 0
	const y = Math.floor((cy - oy) / VOXEL_HEIGHT)
	return [x, y]
}

const safelyGetSpaceIdFromPosition = (x, y) => {
	if (x < 0) return -1
	if (y < 0) return -1
	if (x >= WORLD_WIDTH) return -1
	if (y >= WORLD_HEIGHT) return -1
	return getSpaceIdFromPosition(x, y)
}

const getSpaceIdFromPosition = (x, y) => {
	return WORLD_WIDTH * y + x
}

const HALF_VOXEL_HEIGHT = VOXEL_HEIGHT / 2
const HALF_INNER_VOXEL_HEIGHT = VOXEL_INNER_HEIGHT / 2
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
		fillHexagon(xDraw, yDraw + (isOddColumn? HALF_VOXEL_HEIGHT : 0))
		id++
		x++
		isOddColumn = !isOddColumn
		if (x >= WORLD_WIDTH) {
			x = 0
			xDraw = 0
			yDraw += VOXEL_HEIGHT
		}
		else {
			xDraw += VOXEL_WIDTH_HEX
		}
	}
}

const HEX_EDGE_BIT = (VOXEL_INNER_WIDTH - (VOXEL_INNER_WIDTH * HEX_RAT))
const fillHexagon = (x, y) => {
	context.beginPath()

	const yPlusHalfInner = y + HALF_INNER_VOXEL_HEIGHT
	const yPlusInner = y + VOXEL_INNER_HEIGHT
	const xPlusEdge = x + HEX_EDGE_BIT
	const xPlusInner = x + VOXEL_INNER_HEIGHT
	const xPlusInnerSubEdge = xPlusInner - HEX_EDGE_BIT

	context.moveTo(x, yPlusHalfInner)
	context.lineTo(xPlusEdge, y)
	context.lineTo(xPlusInnerSubEdge, y)
	context.lineTo(xPlusInner, yPlusHalfInner)
	context.lineTo(xPlusInnerSubEdge, yPlusInner)
	context.lineTo(xPlusEdge, yPlusInner)
	context.lineTo(x, yPlusHalfInner)
	context.closePath()
	context.fill()
}

const drawSpace = (x, y, element) => {
	context.fillStyle = elementColours.get(element)
	const xDraw = x * VOXEL_WIDTH_HEX
	const yDraw = y * VOXEL_HEIGHT
	const isOddColumn = x % 2 !== 0
	fillHexagon(xDraw, yDraw + (isOddColumn? HALF_VOXEL_HEIGHT : 0))
}

const getCanvasPosition = (x, y) => {
	const xDraw = x * VOXEL_WIDTH_HEX
	const yDraw = y * VOXEL_HEIGHT
	const isOddColumn = x % 2 !== 0
	return [xDraw, yDraw + (isOddColumn? HALF_VOXEL_HEIGHT : 0)]
}

const FIRE_SCALE = 1.0
const FIRE_COUNT = WORLD_AREA * FIRE_SCALE
let dropperElement = ELEMENT_SAND
let dropperPreviousPosition = [undefined, undefined]
const update = () => {

	// Behaviour
	for (let i = 0; i < FIRE_COUNT; i++) {
		const id = Random.Uint32 % WORLD_AREA
		const element = spaceElements[id]
		const behave = elementBehaves.get(element)
		if (behave !== undefined) {
			behave(id)
		}
	}

	// Drop Shenanigens
	if (Mouse.Left) {
		const [mx, my] = Mouse.position
		const [sx, sy] = getSpacePositionFromCanvasPosition(mx, my)
		if (sx >= WORLD_WIDTH || sy >= WORLD_HEIGHT || sx < 0 || sy < 0) {
			dropperPreviousPosition = [undefined, undefined]
		}
		else {
			const [px, py] = dropperPreviousPosition
			if (px === undefined || py === undefined) {
				drop(sx, sy)
			}
			else {
				const [dx, dy] = [mx - px, my - py]
				const dmax = Math.max(Math.abs(dx), Math.abs(dy))
				if (dmax === 0) {
					drop(sx, sy)
				}
				else {
					const [rx, ry] = [dx / dmax, dy / dmax]
					let [ix, iy] = dropperPreviousPosition
					for (let i = 0; i < dmax; i++) {
						ix += rx
						iy += ry
						const [x, y] = getSpacePositionFromCanvasPosition(ix, iy)
						drop(x, y)
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

let dropperSize = 2
on.keydown(e => {
	if (e.key === "]") dropperSize++
	else if (e.key === "[") dropperSize--
})

const drop = (dx, dy) => {
	for (let x = dx - dropperSize; x < dx + dropperSize; x++) {
		for (let y = dy - dropperSize; y < dy + dropperSize; y++) {
			const id = safelyGetSpaceIdFromPosition(x, y)
			setSpace(id, dropperElement)
		}
	}
}


const tick = () => {
	update()
	requestAnimationFrame(tick)
}


for (let y = 0; y < WORLD_HEIGHT; y++) {
	for (let x = 0; x < WORLD_WIDTH; x++) {
		const id = getSpaceIdFromPosition(x, y)
		const noffset = id * EW_LENGTH
		spaceNeighbours[noffset + EW_UP] = safelyGetSpaceIdFromPosition(x, y-1)
		spaceNeighbours[noffset + EW_DOWN] = safelyGetSpaceIdFromPosition(x, y+1)
		spaceNeighbours[noffset + EW_RIGHT_UP] = safelyGetSpaceIdFromPosition(x+1, y-(x % 2 === 0? 1 : 0))
		spaceNeighbours[noffset + EW_RIGHT_DOWN] = safelyGetSpaceIdFromPosition(x+1, y + (x % 2 !== 0? 1 : 0))
		spaceNeighbours[noffset + EW_LEFT_UP] = safelyGetSpaceIdFromPosition(x-1, y-(x % 2 === 0? 1 : 0))
		spaceNeighbours[noffset + EW_LEFT_DOWN] = safelyGetSpaceIdFromPosition(x-1, y+(x % 2 !== 0? 1 : 0))

		const poffset = id * 2
		const [xDraw, yDraw] = getCanvasPosition(x, y)
		spacePositions[poffset + 0] = xDraw
		spacePositions[poffset + 1] = yDraw
	}
}

requestAnimationFrame(tick)
requestAnimationFrame(drawWorld)
