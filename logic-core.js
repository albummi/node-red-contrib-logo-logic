/**
 * logic-core.js
 * Liefert makeLogoLogicNode(RED, { typeName, displayName, computeResult })
 * - Unterstützt pro Eingang:
 *   - inputFields: array of strings (e.g. "payload","topic","logo" or path like "payload.temp")
 *   - inputValues: array of strings (expected value, parsed to bool/number/string)
 *   - negateInputs: array of booleans
 * - Bei Eingangsnachricht: prüft alle Eingänge gegen msg[...] und liefert evalInputs an computeResult
 */

module.exports = function makeLogoLogicNode(RED, { typeName, displayName, computeResult }) {
  return function(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const inputsCount = Math.max(2, Math.min(8, parseInt(config.inputsCount || 2, 10)));
    const emitOnChange = config.emitOnChange !== false;

    // per-input config arrays (may be saved as arrays or single value when older versions)
    const inputFields = Array.isArray(config.inputFields) ? config.inputFields.slice(0, inputsCount)
                      : (config.inputFields ? [config.inputFields] : new Array(inputsCount).fill("payload"));
    const inputValues = Array.isArray(config.inputValues) ? config.inputValues.slice(0, inputsCount)
                      : (config.inputValues ? [config.inputValues] : new Array(inputsCount).fill(""));
    const negateInputs = Array.isArray(config.negateInputs) ? config.negateInputs.slice(0, inputsCount)
                      : (config.negateInputs ? config.negateInputs.map(Boolean).slice(0, inputsCount) : new Array(inputsCount).fill(false));

    // normalize arrays to inputsCount length
    while (inputFields.length < inputsCount) inputFields.push("payload");
    while (inputValues.length < inputsCount) inputValues.push("");
    while (negateInputs.length < inputsCount) negateInputs.push(false);

    let lastOutput = undefined;

    // helpers
    function parseExpectedValue(raw) {
      if (typeof raw === "boolean") return raw;
      if (raw === null || raw === undefined) return raw;
      const s = String(raw).trim();
      if (s === "") return "";
      if (s.toLowerCase() === "true") return true;
      if (s.toLowerCase() === "false") return false;
      // numeric?
      if (/^-?\d+(\.\d+)?$/.test(s)) {
        const n = Number(s);
        if (!Number.isNaN(n)) return n;
      }
      return s;
    }

    function getMsgProp(msg, path) {
      try {
        // use RED.util.getMessageProperty if available to support nested paths safely
        if (RED && RED.util && typeof RED.util.getMessageProperty === "function") {
          return RED.util.getMessageProperty(msg, path);
        }
        // fallback: simple lookup (no nested)
        return msg[path];
      } catch (e) {
        return undefined;
      }
    }

    // pre-parse expected values
    const expectedValues = inputValues.map(v => parseExpectedValue(v));

    function compare(actual, expected) {
      // special handling: compare types sensibly
      // if expected is boolean -> coerce actual to boolean with common rules
      if (typeof expected === "boolean") {
        // treat strings "true"/"false", numbers 0 -> false, else true
        if (typeof actual === "string") {
          const a = actual.trim().toLowerCase();
          if (a === "true") return expected === true;
          if (a === "false") return expected === false;
          // non-empty string -> true
          return expected === !!a;
        }
        if (typeof actual === "number") return (actual !== 0) === expected;
        return (!!actual) === expected;
      }

      // if expected is number -> coerce actual to number if possible
      if (typeof expected === "number") {
        if (typeof actual === "number") return actual === expected;
        if (typeof actual === "string" && /^-?\d+(\.\d+)?$/.test(actual.trim())) {
          return Number(actual.trim()) === expected;
        }
        return false;
      }

      // otherwise string comparison
      // undefined actual should not match non-empty expected
      if (actual === undefined || actual === null) return false;
      // convert both to string and compare
      return String(actual) === String(expected);
    }

    function evaluateFromMsg(msg) {
      const evalInputs = [];
      for (let i = 0; i < inputsCount; i++) {
        const field = (inputFields[i] || "payload").toString();
        const expected = expectedValues[i];
        const actual = getMsgProp(msg, field);
        let match = compare(actual, expected);
        if (negateInputs[i]) match = !match;
        evalInputs.push(Boolean(match));
      }
      return evalInputs;
    }

    function updateStatus(result, states) {
      const active = states ? states.reduce((a, v) => a + (v ? 1 : 0), 0) : 0;
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

    // On input: evaluate all inputs from current message, compute result, emit
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

    // initial status
    updateStatus(false, new Array(inputsCount).fill(false));
  };
};
