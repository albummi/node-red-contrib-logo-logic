module.exports = function(RED) {

    function ANDNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Konfiguration
        const inputCount = parseInt(config.inputCount || 2, 10);
        const inputFields = []; // z.B. ["msg.topic", "msg.payload"]
        const inputValues = []; // z.B. ["Wurst", true]
        const operators = [];   // "=" oder "!="

        for (let i = 0; i < inputCount; i++) {
            inputFields.push(config[`inputField${i}`] || "msg.topic");
            inputValues.push(config[`inputValue${i}`] || "true");
            operators.push(config[`operator${i}`] || "=");
        }

        function evaluateInputs(msg) {
            const states = [];
            for (let i = 0; i < inputCount; i++) {
                const fieldPath = inputFields[i];
                const expected = inputValues[i];
                const operator = operators[i];

                // msg-Feld dynamisch auslesen
                const fieldParts = fieldPath.split(".");
                let val = msg;
                for (let part of fieldParts) {
                    val = val ? val[part] : undefined;
                }

                // Vergleich
                let isActive;
                if (operator === "=") {
                    isActive = val == expected;
                } else {
                    isActive = val != expected;
                }
                states.push(isActive);
            }
            return states;
        }

        function computeAND(states) {
            return states.every(s => s);
        }

        function updateStatus(output) {
            node.status({
                fill: output ? "green" : "grey",
                shape: "dot",
                text: `AND · ${output ? "ON" : "OFF"}`
            });
        }

        node.on("input", (msg, send, done) => {
            try {
                const states = evaluateInputs(msg);
                const output = computeAND(states);
                node.send({ payload: output });
                updateStatus(output);
                if (done) done();
            } catch (err) {
                node.error(err, msg);
                if (done) done(err);
            }
        });
    }

    RED.nodes.registerType("logo-and", ANDNode);
};
