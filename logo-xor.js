const makeLogoLogicNode = require("./logic-core");

module.exports = function(RED) {
  RED.nodes.registerType(
    "logo-xor",
    makeLogoLogicNode(RED, {
      typeName: "logo-xor",
      displayName: "XOR",
      computeResult: (inputs) => inputs.filter(Boolean).length % 2 === 1
    })
  );
};
