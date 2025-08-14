module.exports = function makeLogoLogicNode(RED, { typeName, displayName, computeResult }) {
  return function(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const inputsCount = Math.max(2, Math.min(8, parseInt(config.inputsCount || 2, 10)));
    const emitOnChange = config.emitOnChange !== false;
    const negateInputs = Array.isArray(config.negateInputs) ? config.negateInputs.slice(0, inputsCount) : new Array(inputsCount).fill(false);
    const topicValues = Array.isArray(config.topicValues) ? config.topicValues.slice(0, inputsCount) : new Array(inputsCount).fill("");

    while (topicValues.length < inputsCount) topicValues.push("");
    while (negateInputs.length < inputsCount) negateInputs.push(false);

    let lastOutput;

    function evaluateFromMsg(msg) {
      const evalInputs = [];
      for (let i = 0; i < inputsCount; i++) {
        const expected = topicValues[i];
        const actual = msg.topic;
        let match = (actual !== undefined && String(actual) === expected);
        if (negateInputs[i]) match = !match;
        evalInputs.push(match);
      }
      return evalInputs;
    }

    function updateStatus(result, states) {
      const active = states.filter(s => s).length;
      node.status({
        fill: result ? "green" : "grey",
        shape: "dot",
        text: `${displayName} · active:${active}/${inputsCount} · out:${result ? "true" : "false"}`
      });
    }

    function emit(result, states) {
      if (emitOnChange) {
        if (lastOutput !== result) {
          lastOutput = result;
          node.send({ payload: result });
        }
      } else {
        lastOutput = result;
        node.send({ payload: result });
      }
      updateStatus(result, states);
    }

    node.on("input", (msg, send, done) => {
      try {
        const evalInputs = evaluateFromMsg(msg);
        const result = computeResult(evalInputs);
        emit(result, evalInputs);
        if (done) done();
      } catch (e) {
        node.error(e, msg);
        if (done) done(e);
      }
    });

    updateStatus(false, new Array(inputsCount).fill(false));
  };
};
