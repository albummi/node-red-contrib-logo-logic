module.exports = function(RED) {
    function LogoRSNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.name = config.name;
        node.setField = config.setField || "payload";
        node.setOperator = config.setOperator || "=";
        node.setValue = config.setValue || "true";

        node.resetField = config.resetField || "payload";
        node.resetOperator = config.resetOperator || "=";
        node.resetValue = config.resetValue || "false";

        node.emitOnChange = config.emitOnChange !== false;
        node.forceResetTime = parseInt(config.forceResetTime) || 0;
        node.resetPriority = config.resetPriority || false;
        node.state = config.initState || false;

        let resetTimer = null;

        function compare(val, operator, cmpVal) {
            // boolean handling
            if (cmpVal === "true" || cmpVal === true) cmpVal = true;
            else if (cmpVal === "false" || cmpVal === false) cmpVal = false;
            // numeric handling
            else if (!isNaN(cmpVal) && cmpVal !== "") cmpVal = Number(cmpVal);

            if (operator === "=") return val === cmpVal;
            if (operator === "!=") return val !== cmpVal;
            return false;
        }

        node.on('input', function(msg) {
            let setCondition = compare(msg[node.setField], node.setOperator, node.setValue);
            let resetCondition = compare(msg[node.resetField], node.resetOperator, node.resetValue);

            let prevState = node.state;

            if (node.resetPriority && resetCondition) {
                node.state = false;
            } else if (setCondition && !resetCondition) {
                node.state = true;
            } else if (resetCondition && !setCondition) {
                node.state = false;
            }

            if (node.forceResetTime > 0 && node.state) {
                clearTimeout(resetTimer);
                resetTimer = setTimeout(() => {
                    node.state = false;
                    if (!node.emitOnChange || prevState !== node.state) {
                        node.send({ payload: node.state });
                    }
                }, node.forceResetTime * 1000);
            }

            if (!node.emitOnChange || prevState !== node.state) {
                node.send({ payload: node.state });
            }
        });
    }
    RED.nodes.registerType("logo-rs", LogoRSNode);
}
