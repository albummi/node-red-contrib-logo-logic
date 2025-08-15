// Gemeinsamer Core für LOGO-Gatter: Adressierung per msg.topic (konfigurierter String)
// Setzt den Zustand eines Eingangs, wenn eine Nachricht mit passendem msg.topic kommt.
// Der Zustand wird auf den Boolean-Wert von msg.payload gesetzt.
// Reset mit msg.reset === true löscht alle Eingänge (false).
// Keine Latch/Persistenz – der Ausgang ist stets die Logik über die aktuellen Zustände.

module.exports = function makeLogoLogicNode(RED, { typeName, displayName, computeResult }) {
  return function(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const inputsCount = Math.max(2, Math.min(8, parseInt(config.inputsCount || 2, 10)));
    const emitOnChange = config.emitOnChange !== false;

    // Konfig: erwartete Topics & Negation je Eingang
    const topicValues = Array.isArray(config.topicValues) ? config.topicValues.slice(0, inputsCount) : [];
    const negateInputs = Array.isArray(config.negateInputs) ? config.negateInputs.slice(0, inputsCount) : [];

    while (topicValues.length < inputsCount) topicValues.push("");
    while (negateInputs.length < inputsCount) negateInputs.push(false);

    // Aktuelle Zustände der Eingänge (false als Default)
    let states = Array(inputsCount).fill(false);
    let lastOutput;

    function toBool(v) {
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v !== 0;
      if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (["true","on","1","open","hoch","an","yes","y"].includes(s)) return true;
        if (["false","off","0","closed","zu","aus","no","n"].includes(s)) return false;
      }
      return !!v;
    }

    function evaluate() {
      const evalInputs = states.map((v, i) => (negateInputs[i] ? !v : v));
      return computeResult(evalInputs);
    }

    function updateStatus(result) {
      const active = states.reduce((a,v)=>a+(v?1:0),0);
      node.status({
        fill: result ? "green" : "grey",
        shape: "dot",
        text: `${displayName} · active:${active}/${inputsCount} · out:${result ? "true" : "false"}`
      });
    }

    function emit(result) {
      if (emitOnChange) {
        if (lastOutput !== result) {
          lastOutput = result;
          node.send({ payload: result });
        }
      } else {
        lastOutput = result;
        node.send({ payload: result });
      }
      updateStatus(result);
    }

    node.on("input", (msg, send, done) => {
      try {
        // globaler Reset
        if (msg && msg.reset === true) {
          states = Array(inputsCount).fill(false);
          emit(false);
          if (done) done();
          return;
        }

        // Eingang anhand msg.topic finden
        const t = (msg && msg.topic != null) ? String(msg.topic) : undefined;
        if (t != null) {
          const idx = topicValues.findIndex(tv => String(tv) === t);
          if (idx >= 0 && idx < inputsCount) {
            // Diesen Eingang auf Wert von payload setzen
            states[idx] = toBool(msg.payload);
          }
          // (andere, nicht gemappte msg.topic werden ignoriert)
        }

        // Ergebnis berechnen und ausgeben
        const result = evaluate();
        emit(result);
        if (done) done();
      } catch (e) {
        node.error(e, msg);
        if (done) done(e);
      }
    });

    // Initialstatus
    updateStatus(false);
  };
};
