const stage = Stage.make()
const {canvas, context} = stage

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