module.exports = function(RED) {

  function getMsgProp(RED, msg, fieldPath) {
    try {
      const path = (fieldPath || "").trim();
      if (!path) return undefined;
      return RED.util.getMessageProperty(msg, path);
    } catch (e) {
      return undefined;
    }
  }

  function parseConfiguredValue(type, boolStr, textStr) {
    if (type === "bool") {
      return (String(boolStr) === "true");
    }
    // text: ggf. Zahl erkennen
    const txt = (textStr ?? "").toString();
    if (/^-?\d+(\.\d+)?$/.test(txt)) {
      const n = Number(txt);
      if (!Number.isNaN(n)) return n;
    }
    return txt; // als String vergleichen
  }

  function compareValues(actual, op, expected) {
    if (op === "=")  return actual === expected;
    if (op === "!=") return actual !== expected;
    return false;
  }

  function RSNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const emitOnChange   = config.emitOnChange !== false;
    const forceResetTime = parseInt(config.forceResetTime || 0, 10) || 0;
    const resetPriority  = (config.resetPriority === true || config.resetPriority === "true");
    const initState      = (config.initState === true || config.initState === "true");

    // Set-Konfig
    const setField     = config.setField || "payload";
    const setOperator  = config.setOperator || "=";
    const setValueType = config.setValueType || "bool";
    const setValue     = parseConfiguredValue(setValueType, config.setValueBool, config.setValueText);

    // Reset-Konfig
    const resetField     = config.resetField || "payload";
    const resetOperator  = config.resetOperator || "=";
    const resetValueType = config.resetValueType || "bool";
    const resetValue     = parseConfiguredValue(resetValueType, config.resetValueBool, config.resetValueText);

    let state = !!initState;
    let lastEmitted = undefined;
    let timer = null;

    function updateStatus() {
      node.status({
        fill: state ? "green" : "grey",
        shape: "dot",
        text: `RS · out:${state ? "true" : "false"}`
      });
    }

    function sendOutput() {
      if (emitOnChange) {
        if (lastEmitted !== state) {
          lastEmitted = state;
          node.send({ payload: state });
        }
      } else {
        lastEmitted = state;
        node.send({ payload: state });
      }
      updateStatus();
    }

    node.on("input", (msg, send, done) => {
      try {
        const setActual   = getMsgProp(RED, msg, setField);
        const resetActual = getMsgProp(RED, msg, resetField);

        const doSet   = compareValues(setActual,   setOperator,   setValue);
        const doReset = compareValues(resetActual, resetOperator, resetValue);

        if (doSet && doReset) {
          state = resetPriority ? false : true;
        } else if (doSet) {
          state = true;
          if (forceResetTime > 0) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
              state = false;
              sendOutput();
            }, forceResetTime * 1000);
          }
        } else if (doReset) {
          state = false;
          if (timer) { clearTimeout(timer); timer = null; }
        }

        sendOutput();
        if (done) done();
      } catch (err) {
        node.error(err, msg);
        if (done) done(err);
      }
    });

    updateStatus();
  }

  RED.nodes.registerType("logo-rs", RSNode);
};
