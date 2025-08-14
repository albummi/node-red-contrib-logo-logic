const makeLogoLogicNode = require("./logic-core");

module.exports = function(RED) {
    RED.nodes.registerType(
        "logo-xor",
        makeLogoLogicNode(RED, {
            typeName: "logo-xor",
            displayName: "XOR",
            computeResult: (inputs) => (inputs.reduce((a, v) => a + (v ? 1 : 0), 0) % 2) === 1
        })
    );
};
