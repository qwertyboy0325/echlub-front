import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'



setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
