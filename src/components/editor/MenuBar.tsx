import { useRef, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useEditor } from '@/context/EditorContext'
import {
  exportFlattenedPng,
  exportJpeg,
  exportProjectJson,
  parseProjectJson,
  restoreProject,
} from '@/lib/canvas/export'
import { createLayer } from '@/lib/canvas/layers'
import {
  gaussianBlur,
  sharpen,
  pixelate,
  addNoise,
  emboss,
} from '@/lib/canvas/filters'
import { grayscale } from '@/lib/canvas/adjustments'

export function MenuBar() {
  const { state, dispatch, commitHistory, updateActiveLayerCanvas } =
    useEditor()
  const fileRef = useRef<HTMLInputElement>(null)
  const openRef = useRef<HTMLInputElement>(null)

  const [newOpen, setNewOpen] = useState(false)
  const [newW, setNewW] = useState(800)
  const [newH, setNewH] = useState(600)
  const [newBg, setNewBg] = useState('#ffffff')

  const [jpegOpen, setJpegOpen] = useState(false)
  const [jpegQ, setJpegQ] = useState(90)

  const [filterOpen, setFilterOpen] = useState<string | null>(null)
  const [filterVal, setFilterVal] = useState(5)

  const [canvasSizeOpen, setCanvasSizeOpen] = useState(false)
  const [cw, setCw] = useState(state.canvasWidth)
  const [ch, setCh] = useState(state.canvasHeight)

  const applyFilter = (fn: (ctx: CanvasRenderingContext2D) => void, name: string) => {
    updateActiveLayerCanvas(fn)
    commitHistory(name)
    setFilterOpen(null)
  }

  const flatten = () => {
    const canvas = document.createElement('canvas')
    canvas.width = state.canvasWidth
    canvas.height = state.canvasHeight
    const ctx = canvas.getContext('2d')!
    for (const layer of state.layers) {
      if (!layer.visible) continue
      ctx.save()
      ctx.globalAlpha = layer.opacity / 100
      ctx.drawImage(layer.canvas, layer.x, layer.y)
      ctx.restore()
    }
    const flat = createLayer(state.canvasWidth, state.canvasHeight, 'Flattened')
    flat.canvas.getContext('2d')!.drawImage(canvas, 0, 0)
    dispatch({ type: 'SET_LAYERS', layers: [flat] })
    dispatch({ type: 'SET_ACTIVE_LAYER', id: flat.id })
    commitHistory('Flatten Image')
  }

  const rotateCanvas = (dir: 'cw' | 'ccw') => {
    const w = state.canvasHeight
    const h = state.canvasWidth
    const layers = state.layers.map((l) => {
      const nc = document.createElement('canvas')
      nc.width = w
      nc.height = h
      const ctx = nc.getContext('2d')!
      ctx.translate(w / 2, h / 2)
      ctx.rotate(dir === 'cw' ? Math.PI / 2 : -Math.PI / 2)
      ctx.drawImage(l.canvas, -l.canvas.width / 2, -l.canvas.height / 2)
      return { ...l, canvas: nc }
    })
    dispatch({ type: 'SET_CANVAS_SIZE', width: w, height: h })
    dispatch({ type: 'SET_LAYERS', layers })
    commitHistory(`Rotate ${dir === 'cw' ? 'CW' : 'CCW'}`)
  }

  const flip = (axis: 'h' | 'v') => {
    state.layers.forEach((l) => {
      const ctx = l.canvas.getContext('2d')!
      const temp = document.createElement('canvas')
      temp.width = l.canvas.width
      temp.height = l.canvas.height
      const tctx = temp.getContext('2d')!
      tctx.save()
      if (axis === 'h') {
        tctx.translate(l.canvas.width, 0)
        tctx.scale(-1, 1)
      } else {
        tctx.translate(0, l.canvas.height)
        tctx.scale(1, -1)
      }
      tctx.drawImage(l.canvas, 0, 0)
      tctx.restore()
      ctx.clearRect(0, 0, l.canvas.width, l.canvas.height)
      ctx.drawImage(temp, 0, 0)
    })
    dispatch({ type: 'BUMP_RENDER' })
    commitHistory(axis === 'h' ? 'Flip Horizontal' : 'Flip Vertical')
  }

  const mergeDown = () => {
    const idx = state.layers.findIndex((l) => l.id === state.activeLayerId)
    if (idx <= 0) return
    const below = state.layers[idx - 1]!
    const above = state.layers[idx]!
    const ctx = below.canvas.getContext('2d')!
    ctx.drawImage(above.canvas, above.x, above.y)
    const layers = state.layers.filter((l) => l.id !== above.id)
    dispatch({ type: 'SET_LAYERS', layers })
    commitHistory('Merge Down')
  }

  const menus = [
    {
      label: 'File',
      items: [
        { label: 'New...', action: () => setNewOpen(true), shortcut: 'Ctrl+N' },
        { label: 'Open...', action: () => openRef.current?.click() },
        { label: 'Save as PNG', action: () => exportFlattenedPng(state.layers, state.canvasWidth, state.canvasHeight) },
        { label: 'Save as JPEG...', action: () => setJpegOpen(true) },
        { label: 'Export JSON...', action: () => exportProjectJson(state.layers, state.canvasWidth, state.canvasHeight, state.activeLayerId) },
        { label: 'Open JSON...', action: () => fileRef.current?.click() },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', action: () => dispatch({ type: 'UNDO' }), shortcut: 'Ctrl+Z' },
        { label: 'Redo', action: () => dispatch({ type: 'REDO' }), shortcut: 'Ctrl+Y' },
        { label: 'Deselect', action: () => dispatch({ type: 'SET_SELECTION', selection: null }), shortcut: 'Ctrl+D' },
      ],
    },
    {
      label: 'Image',
      items: [
        { label: 'Canvas Size...', action: () => { setCw(state.canvasWidth); setCh(state.canvasHeight); setCanvasSizeOpen(true) } },
        { label: 'Rotate 90° CW', action: () => rotateCanvas('cw') },
        { label: 'Rotate 90° CCW', action: () => rotateCanvas('ccw') },
        { label: 'Flip Horizontal', action: () => flip('h') },
        { label: 'Flip Vertical', action: () => flip('v') },
        { label: 'Flatten Image', action: flatten },
      ],
    },
    {
      label: 'Layer',
      items: [
        { label: 'New Layer', action: () => dispatch({ type: 'ADD_LAYER' }) },
        { label: 'Duplicate Layer', action: () => state.activeLayerId && dispatch({ type: 'DUPLICATE_LAYER', id: state.activeLayerId }) },
        { label: 'Delete Layer', action: () => state.activeLayerId && dispatch({ type: 'DELETE_LAYER', id: state.activeLayerId }) },
        { label: 'Merge Down', action: mergeDown },
      ],
    },
    {
      label: 'Filter',
      items: [
        { label: 'Gaussian Blur...', action: () => { setFilterVal(5); setFilterOpen('blur') } },
        { label: 'Sharpen', action: () => applyFilter(sharpen, 'Sharpen') },
        { label: 'Add Noise...', action: () => { setFilterVal(25); setFilterOpen('noise') } },
        { label: 'Pixelate...', action: () => { setFilterVal(8); setFilterOpen('pixelate') } },
        { label: 'Emboss', action: () => applyFilter(emboss, 'Emboss') },
        { label: 'Grayscale', action: () => applyFilter(grayscale, 'Grayscale') },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Fit to Screen', action: () => dispatch({ type: 'REQUEST_FIT_TO_SCREEN' }) },
        { label: 'Zoom In', action: () => dispatch({ type: 'SET_ZOOM', zoom: state.zoom + 25 }) },
        { label: 'Zoom Out', action: () => dispatch({ type: 'SET_ZOOM', zoom: state.zoom - 25 }) },
        { label: '100%', action: () => dispatch({ type: 'SET_ZOOM', zoom: 100 }) },
        { label: 'Toggle Grid', action: () => dispatch({ type: 'TOGGLE_GRID' }) },
        { label: 'Toggle Rulers', action: () => dispatch({ type: 'TOGGLE_RULERS' }) },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'Keyboard Shortcuts', action: () => alert('V Move · M Marquee · B Brush · E Eraser · G Fill · I Eyedropper · T Text · Z Zoom · Ctrl+Z Undo') },
      ],
    },
  ]

  return (
    <>
      <header className="chrome-bar flex h-full w-full items-center gap-0 px-1">
        <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text px-2 text-ui-sm font-bold tracking-tight text-transparent">
          PxEd
        </span>
        {menus.map((menu) => (
          <DropdownMenu key={menu.label}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="interactive h-7 rounded px-2 text-ui-xs font-normal text-zinc-400 hover:text-zinc-100">
                {menu.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {menu.items.map((item, i) => (
                <DropdownMenuItem key={i} onClick={item.action}>
                  {item.label}
                  {'shortcut' in item && item.shortcut && (
                    <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </header>

      <input ref={openRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const img = new Image()
        img.onload = () => {
          const w = img.width
          const h = img.height
          const layer = createLayer(w, h, 'Background')
          layer.canvas.getContext('2d')!.drawImage(img, 0, 0)
          dispatch({ type: 'LOAD_PROJECT', state: { layers: [layer], canvasWidth: w, canvasHeight: h, activeLayerId: layer.id } })
        }
        img.src = URL.createObjectURL(file)
        e.target.value = ''
      }} />

      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const text = await file.text()
        const data = parseProjectJson(text)
        const proj = restoreProject(data)
        dispatch({ type: 'LOAD_PROJECT', state: proj })
        e.target.value = ''
      }} />

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Document</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Width</Label><Input type="number" value={newW} onChange={(e) => setNewW(+e.target.value)} /></div>
            <div><Label>Height</Label><Input type="number" value={newH} onChange={(e) => setNewH(+e.target.value)} /></div>
            <div className="col-span-2"><Label>Background</Label><Input type="color" value={newBg} onChange={(e) => setNewBg(e.target.value)} /></div>
          </div>
          <div className="mt-2 flex gap-2">
            {[[800,600],[1920,1080],[1080,1080]].map(([w,h]) => (
              <Button key={w} variant="outline" size="sm" onClick={() => { setNewW(w); setNewH(h) }}>{w}×{h}</Button>
            ))}
          </div>
          <Button className="mt-4" onClick={() => { dispatch({ type: 'NEW_DOCUMENT', width: newW, height: newH, bg: newBg }); setNewOpen(false) }}>Create</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={jpegOpen} onOpenChange={setJpegOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Export JPEG</DialogTitle></DialogHeader>
          <Label>Quality: {jpegQ}%</Label>
          <Slider value={[jpegQ]} min={1} max={100} onValueChange={([v]) => setJpegQ(v!)} />
          <Button onClick={() => { exportJpeg(state.layers, state.canvasWidth, state.canvasHeight, jpegQ); setJpegOpen(false) }}>Export</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={canvasSizeOpen} onOpenChange={setCanvasSizeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Canvas Size</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Width</Label><Input type="number" value={cw} onChange={(e) => setCw(+e.target.value)} /></div>
            <div><Label>Height</Label><Input type="number" value={ch} onChange={(e) => setCh(+e.target.value)} /></div>
          </div>
          <Button className="mt-4" onClick={() => { dispatch({ type: 'SET_CANVAS_SIZE', width: cw, height: ch }); setCanvasSizeOpen(false) }}>Apply</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!filterOpen} onOpenChange={() => setFilterOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{filterOpen}</DialogTitle></DialogHeader>
          <Slider value={[filterVal]} min={1} max={50} onValueChange={([v]) => setFilterVal(v!)} />
          <Button onClick={() => {
            if (filterOpen === 'blur') applyFilter((ctx) => gaussianBlur(ctx, filterVal), 'Gaussian Blur')
            else if (filterOpen === 'noise') applyFilter((ctx) => addNoise(ctx, filterVal), 'Noise')
            else if (filterOpen === 'pixelate') applyFilter((ctx) => pixelate(ctx, filterVal), 'Pixelate')
          }}>Apply</Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
