module.exports = function makeLogoLogicNode(RED, { typeName, displayName, computeResult }) {
    return function (config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const inputsCount = parseInt(config.inputs) || 2;
        const memoryTimeSec = parseFloat(config.memoryTime) || 0;
        const memoryTimeMs = memoryTimeSec * 1000;

        // interner Zustand
        let states = Array(inputsCount).fill(false);
        let memoryTimers = Array(inputsCount).fill(null);

        // Hilfsfunktionen
        function toBool(val) {
            if (val === true || val === "true" || val === 1 || val === "1") return true;
            return false;
        }

        function evaluate() {
            return computeResult(states);
        }

        function emit(result) {
            node.send({ payload: result });
        }

        node.on("input", (msg, send, done) => {
            try {
                // Reset
                if (msg.reset === true) {
                    states = Array(inputsCount).fill(false);
                    memoryTimers.forEach(t => t && clearTimeout(t));
                    memoryTimers = Array(inputsCount).fill(null);
                    emit(false);
                    if (done) done();
                    return;
                }

                // Index des Eingangs
                let idx = undefined;
                if (msg.topic !== undefined) {
                    const n = parseInt(msg.topic, 10);
                    if (!isNaN(n)) idx = n - 1;
                }

                if (idx === undefined || idx < 0 || idx >= inputsCount) {
                    if (done) done();
                    return;
                }

                const val = toBool(msg.payload);

                if (val) {
                    states[idx] = true;

                    // Timer starten, wenn memoryTime > 0
                    if (memoryTimeMs > 0) {
                        if (memoryTimers[idx]) clearTimeout(memoryTimers[idx]);
                        memoryTimers[idx] = setTimeout(() => {
                            states[idx] = false;
                            memoryTimers[idx] = null;
                            const result = evaluate();
                            emit(result);
                        }, memoryTimeMs);
                    }
                } else {
                    states[idx] = false;
                    if (memoryTimers[idx]) {
                        clearTimeout(memoryTimers[idx]);
                        memoryTimers[idx] = null;
                    }
                }

                const result = evaluate();
                emit(result);

                if (done) done();
            } catch (e) {
                node.error(e, msg);
                if (done) done(e);
            }
        });

        node.on("close", () => {
            memoryTimers.forEach(t => t && clearTimeout(t));
        });
    };
};
