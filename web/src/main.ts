import init from './pkg/canfield_wasm.js'
import { renderMainMenu } from './board'
import './styles.css'

async function start(): Promise<void> {
  await init()
  renderMainMenu()
}

start()
