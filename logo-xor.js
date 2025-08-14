const makeLogoLogicNode = require("./logic-core");

module.exports = function(RED) {
  RED.nodes.registerType(
    "logo-xor",
    makeLogoLogicNode(RED, {
      typeName: "logo-xor",
      displayName: "XOR",
      computeResult: (inputs) => {
        // true when exactly one input = true
        const trues = inputs.reduce((c,v) => c + (v?1:0), 0);
        return trues === 1;
      }
    })
  );
};
