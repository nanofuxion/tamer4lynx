import '@lynx-js/react/debug'
import "lynx-websockets"
import { root } from '@lynx-js/react'

import { App } from './App.js'

root.render(<App />)

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
}
