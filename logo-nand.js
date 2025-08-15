const makeLogoLogicNode = require("./logic-core");

module.exports = function(RED) {
  RED.nodes.registerType(
    "logo-nand",
    makeLogoLogicNode(RED, {
      typeName: "logo-nand",
      displayName: "NAND",
      computeResult: (inputs) => !inputs.every(Boolean)
    })
  );
};
