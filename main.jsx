@tailwind base;
@tailwind components;
@tailwind utilities;

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 20px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}

html, body, #root { height: 100%; }

body {
  background-color: #0e0e0e;
  color: #ebffe2;
}

.scanlines {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
              linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 4px, 3px 100%;
  pointer-events: none;
  z-index: 100;
}

.crt-glow {
  text-shadow: 0 0 5px rgba(0, 230, 57, 0.5), 0 0 10px rgba(0, 230, 57, 0.2);
}

.blinking-cursor::after {
  content: '█';
  animation: blink 1s step-end infinite;
  margin-left: 4px;
  color: #00e639;
}

@keyframes blink {
  from, to { opacity: 1; }
  50% { opacity: 0; }
}

.terminal-scroll::-webkit-scrollbar { width: 4px; }
.terminal-scroll::-webkit-scrollbar-thumb { background: #3b4b37; }

.classified-stamp {
  position: absolute;
  transform: rotate(-15deg);
  border: 4px solid #ffb4ab;
  color: #ffb4ab;
  padding: 8px 16px;
  font-weight: 800;
  opacity: 0.15;
  pointer-events: none;
  user-select: none;
}

.bracket-corner { position: relative; }
.bracket-corner::before {
  content: '';
  position: absolute;
  top: -2px; left: -2px;
  width: 12px; height: 12px;
  border-top: 2px solid #00e639;
  border-left: 2px solid #00e639;
}
.bracket-corner::after {
  content: '';
  position: absolute;
  bottom: -2px; right: -2px;
  width: 12px; height: 12px;
  border-bottom: 2px solid #00e639;
  border-right: 2px solid #00e639;
}

/* Command-line input prompt */
.cmd-input {
  background: transparent;
  border: none;
  outline: none;
  color: #ebffe2;
  font-family: 'JetBrains Mono', monospace;
  width: 100%;
}

/* Blocky checkbox */
.sec-checkbox {
  width: 20px; height: 20px;
  border: 2px solid #84967e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 800;
  color: #00e639;
}
