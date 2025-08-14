module.exports = function makeLogoLogicNode(RED, { typeName, displayName, computeResult }) {
  return function(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const inputsCount = Math.max(2, Math.min(8, parseInt(config.inputsCount || 2, 10)));
    const emitOnChange = config.emitOnChange !== false;


    while (inputFields.length < inputsCount) inputFields.push("payload");
    while (inputValues.length < inputsCount) inputValues.push("");
    while (negateInputs.length < inputsCount) negateInputs.push(false);

    let lastOutput = undefined;

    function parseExpectedValue(raw) {
      if (typeof raw === "boolean") return raw;
      if (raw === null || raw === undefined) return undefined;
      const s = String(raw).trim().toLowerCase();
      if (s === "true") return true;
      if (s === "false") return false;
      if (s === "") return undefined;
      if (!isNaN(Number(s))) return Number(s);
      return s;
    }

    const expectedValues = inputValues.map(v => parseExpectedValue(v));

    function getMsgProp(msg, path) {
      if (!path) return undefined;
      const parts = path.split(".");
      let val = msg;
      for (let p of parts) {
        if (val && Object.prototype.hasOwnProperty.call(val, p)) val = val[p];
        else return undefined;
      }
      return val;
    }

    function compare(actual, expected) {
      if (expected === undefined) return !!actual; // treat empty expected as presence
      if (typeof expected === "boolean") return !!actual === expected;
      if (typeof expected === "number") return Number(actual) === expected;
      return String(actual) === String(expected);
    }

    function evaluateFromMsg(msg) {
      const evalInputs = [];
      for (let i = 0; i < inputsCount; i++) {
        const field = inputFields[i] || "payload";
        const expected = expectedValues[i];
        const actual = getMsgProp(msg, field);
        let match = compare(actual, expected);
        if (negateInputs[i]) match = !match;
        evalInputs.push(match);
      }
      return evalInputs;
    }

    function updateStatus(result, states) {
      const active = states ? states.filter(s => s).length : 0;
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
