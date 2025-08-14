const makeLogoLogicNode = require("./logic-core");

module.exports = function(RED) {
    RED.nodes.registerType(
        "logo-rs",
        makeLogoLogicNode(RED, {
            typeName: "logo-rs",
            displayName: "RS-Glied",
            computeResult: null, // RS-Logik wird im core gehandhabt
            isRSNode: true
        })
    );
};
