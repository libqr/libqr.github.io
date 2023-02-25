import { createRoot } from "react-dom/client";
import { register } from "./serviceWorkerRegistration";
import { Buffer } from "buffer";
import App from "./App";
import './index.css'

window.Buffer = window.Buffer || Buffer;
createRoot(document.getElementById("root") as HTMLElement).render(<App />);
register();
