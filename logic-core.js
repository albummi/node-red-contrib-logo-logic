module.exports = function makeLogoLogicNode(RED, { typeName, displayName, computeResult }) {
    return function(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const inputsCount = Math.max(2, Math.min(8, parseInt(config.inputsCount || 2, 10)));
        const memoryTimeMs = Math.max(0, parseFloat(config.memoryTime || 0) * 1000);
        const negateInputs = Array.isArray(config.negateInputs) ? config.negateInputs.map(Boolean) : [];
        const emitOnChange = config.emitOnChange !== false;

        let states = Array(inputsCount).fill(false);
        let lastTrueAt = Array(inputsCount).fill(0);
        let lastOutput = undefined;

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

        function expireMemory(now) {
            if (memoryTimeMs <= 0) return;
            for (let i = 0; i < inputsCount; i++) {
                if (states[i] && lastTrueAt[i] > 0 && (now - lastTrueAt[i] > memoryTimeMs)) {
                    states[i] = false;
                    lastTrueAt[i] = 0;
                }
            }
        }

        function evaluate() {
            const evalInputs = states.map((v, i) => (negateInputs[i] ? !v : v));
            return computeResult(evalInputs);
        }

        function updateStatus(result) {
            const active = states.reduce((a, v) => a + (v ? 1 : 0), 0);
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
                if (msg.reset === true) {
                    states = Array(inputsCount).fill(false);
                    lastTrueAt = Array(inputsCount).fill(0);
                    emit(false);
                    if (done) done();
                    return;
                }

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
                states[idx] = val;
                const now = Date.now();
                if (memoryTimeMs > 0 && val) lastTrueAt[idx] = now;
                if (!val) lastTrueAt[idx] = 0;

                expireMemory(now);

                const result = evaluate();
                emit(result);

                if (done) done();
            } catch (e) {
                node.error(e, msg);
                if (done) done(e);
            }
        });

        updateStatus(false);
    };
};
