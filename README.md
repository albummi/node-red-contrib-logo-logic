# node-red-contrib-logo-logic

Siemens LOGO!-ähnliche Logik-Gatter für Node-RED: **AND**, **OR**, **XOR**, **NAND** , **RS** 
mit **negierbaren Eingängen** 

## Features
- AND / OR / XOR / NAND als getrennte Nodes
- 2–8 Eingänge, je Eingang negierbar
- Optional „nur bei Zustandsänderung senden“
- RS Node zum dauheraften setzen oder rücksetzen von Nodes
- `msg.reset` → setzt alle Eingangszustände zurück

  
## Installation
```bash
cd ~/.node-red
npm install albummi/node-red-contrib-logo-logic
# Node-RED neu starten
