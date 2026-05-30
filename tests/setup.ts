import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { installCanvasPolyfill, installImageDataPolyfill } from './canvasPolyfill'

installImageDataPolyfill()
installCanvasPolyfill()
