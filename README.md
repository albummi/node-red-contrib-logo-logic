# node-red-contrib-logo-logic

Siemens LOGO!-ähnliche Logik-Gatter für Node-RED: **AND**, **OR**, **XOR**, **NAND**  
mit **negierbaren Eingängen** und einer **konfigurierbaren Speicherzeit** pro Eingang
(damit kurze Impulse innerhalb eines Zeitfensters als „gleichzeitig“ gelten).

## Features
- AND / OR / XOR / NAND als getrennte Nodes
- 2–8 Eingänge, je Eingang negierbar
- Speicherzeit (Sekunden): hält einen `true`-Impuls X Sekunden aufrecht
- Optional „nur bei Zustandsänderung senden“
- `msg.reset` → setzt alle Eingangszustände zurück

## Installation
```bash
cd ~/.node-red
npm install DEIN-GITHUB-USER/node-red-contrib-logo-logic
# Node-RED neu starten
