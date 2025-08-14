module.exports = function(RED) {
    function RSNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Konfiguration
        const initState = config.initState === "true";
        const forceResetTime = parseInt(config.forceResetTime || 0, 10); // in Sekunden
        const resetPriority = config.resetPriority === "true"; // true = Reset priorisiert

        let output = initState;
        let resetTimer = null;

        function updateStatus() {
            node.status({
                fill: output ? "green" : "grey",
                shape: "dot",
                text: `RS · Set:${output}`
            });
        }

        function emit() {
            node.send({ payload: output });
            updateStatus();
        }

        node.on("input", (msg, send, done) => {
            try {
                const setInput = msg.set === true;
                const resetInput = msg.reset === true;

                if (setInput && resetInput) {
                    if (resetPriority) {
                        output = false;
                    } else {
                        output = true;
                    }
                } else if (setInput) {
                    output = true;
                } else if (resetInput) {
                    output = false;
                    if (forceResetTime > 0) {
                        if (resetTimer) clearTimeout(resetTimer);
                        resetTimer = setTimeout(() => {
                            output = false;
                            emit();
                        }, forceResetTime * 1000);
                    }
                }

                emit();

                if (done) done();
            } catch (err) {
                node.error(err, msg);
                if (done) done(err);
            }
        });

        updateStatus();
    }

    RED.nodes.registerType("RS", RSNode);
};
