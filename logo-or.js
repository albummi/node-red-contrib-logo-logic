const makeLogoLogicNode = require("./logic-core");

module.exports = function(RED) {
    RED.nodes.registerType(
        "logo-or",
        makeLogoLogicNode(RED, {
            typeName: "logo-or",
            displayName: "OR",
            computeResult: (inputs) => inputs.some(Boolean)
        })
    );
};
