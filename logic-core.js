module.exports = function makeLogoLogicNode(RED, { typeName, displayName, computeResult, isRSNode }) {
    return function(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Konfiguration
        const emitOnChange = config.emitOnChange !== false; // default: true
        const resetPriority = config.resetPriority === true; // true → Reset priorisiert, false → Set priorisiert
        const initStatus = config.initStatus === true; // true → Ausgang initial True, false → Ausgang initial False
        const forceResetTimeMs = Math.max(0, parseFloat(config.forceResetTime || 0) * 1000);

        let outputState = initStatus;
        let forceResetTimer = null;

        // Statusanzeige aktualisieren
        function updateStatus() {
            node.status({
                fill: outputState ? "green" : "grey",
                shape: "dot",
                text: `${displayName} · out:${outputState ? "true" : "false"}`
            });
        }

        // Ausgang senden
        function emit(state) {
            outputState = state;
            if (emitOnChange) node.send({ payload: state });
            updateStatus();
        }

        // Force Reset Timer starten
        function startForceResetTimer() {
            if (forceResetTimeMs > 0) {
                if (forceResetTimer) clearTimeout(forceResetTimer);
                forceResetTimer = setTimeout(() => {
                    emit(false);
                    forceResetTimer = null;
                }, forceResetTimeMs);
            }
        }

        node.on("input", (msg, send, done) => {
            try {
                // Sofortiger Reset per msg.reset
                if (msg.reset === true) {
                    if (forceResetTimer) clearTimeout(forceResetTimer);
                    forceResetTimer = null;
                    emit(false);
                    if (done) done();
                    return;
                }

                const S = msg.set === true;
                const R = msg.reset === true;

                let newState = outputState;

                if (S && R) {
                    // Priorisierung nach Node-Config
                    newState = resetPriority ? false : true;
                } else if (S) {
                    newState = true;
                    startForceResetTimer();
                } else if (R) {
                    newState = false;
                    if (forceResetTimer) {
                        clearTimeout(forceResetTimer);
                        forceResetTimer = null;
                    }
                }

                emit(newState);

                if (done) done();
            } catch (e) {
                node.error(e, msg);
                if (done) done(e);
            }
        });

        // Initial Status setzen
        emit(outputState);
    };
};
