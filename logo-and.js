const makeLogoLogicNode = require("./logic-core");
module.exports = function(RED) {
  RED.nodes.registerType("logo-and", makeLogoLogicNode(RED, {
    typeName: "logo-and",
    displayName: "AND",
    computeResult: inputs => inputs.every(Boolean)
  }));
};
