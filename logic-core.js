module.exports = function makeLogoLogicNode(RED, { typeName, displayName }) {
    return function(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Konfiguration
        const inputsCount = 2; // RS-Glied immer 2 Eingänge: Set / Reset
        const emitOnChange = config.emitOnChange !== false; // default: true
        const resetPriority = config.resetPriority === true;  // Reset priorisiert
        const forceResetTime = parseFloat(config.forceResetTime) || 0;
        const initStatus = config.initStatus === true;

        // Zustand der Eingänge: [Set, Reset]
        let states = [false, false];
        let lastOutput = initStatus;
        let forceResetTimer = null;

        // Ausgang initial setzen
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

        // Statusanzeige
        function updateStatus(result) {
            const active = states.reduce((a, v) => a + (v ? 1 : 0), 0);
            node.status({
                fill: result ? "green" : "grey",
                shape: "dot",
                text: `${displayName} · S:${states[0]} R:${states[1]} · out:${result ? "true" : "false"}`
            });
        }

        // RS Logik auswerten
        function evaluateRS() {
            let output = lastOutput;

            if (states[0] && states[1]) {
                // Beide True → Priorität beachten
                output = resetPriority ? false : true;
            } else if (states[0]) {
                output = true;
            } else if (states[1]) {
                output = false;
            }

            emit(output);

            // Force Reset Timer
            if (forceResetTime > 0) {
                if (forceResetTimer) clearTimeout(forceResetTimer);
                if (output) {
                    forceResetTimer = setTimeout(() => {
                        states[0] = false; // Set zurücksetzen
                        evaluateRS();
                    }, forceResetTime * 1000);
                }
            }
        }

        // Helper: Payload → Boolean
        function toBool(v) {
            if (typeof v === "boolean") return v;
            if (typeof v === "number") return v !== 0;
            if (typeof v === "string") {
                const s = v.trim().toLowerCase();
                if (["true", "on", "1", "open", "hoch", "an"].includes(s)) return true;
                if (["false", "off", "0", "closed", "zu", "aus"].includes(s)) return false;
            }
            return !!v;
        }

        node.on("input", (msg, send, done) => {
            try {
                let idx = undefined;
                if (msg.topic !== undefined) {
                    const n = parseInt(msg.topic, 10);
                    if (!isNaN(n)) idx = n - 1;
                }

                if (idx === undefined || idx < 0 || idx >= inputsCount) {
                    if (done) done();
                    return;
                }

                // Eingang setzen
                states[idx] = toBool(msg.payload);

                // RS Logik auswerten
                evaluateRS();

                if (done) done();
            } catch (e) {
                node.error(e, msg);
                if (done) done(e);
            }
        });

        // Initialstatus setzen
        emit(initStatus);
    };
};
