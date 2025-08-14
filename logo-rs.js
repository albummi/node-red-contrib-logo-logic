module.exports = function(RED) {
    function LogoRSNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        let state = !!config.initState;
        let timer = null;

        node.on('input', function(msg) {
            let setCondition = false;
            let resetCondition = false;

            try {
                setCondition = eval(config.setCondition);
            } catch(e) {
                node.error("Fehler in Set-Bedingung: " + e.message);
            }

            try {
                resetCondition = eval(config.resetCondition);
            } catch(e) {
                node.error("Fehler in Reset-Bedingung: " + e.message);
            }

            if (setCondition && resetCondition) {
                if (config.resetPriority) {
                    state = false;
                } else {
                    state = true;
                }
            } else if (setCondition) {
                state = true;
                if (config.forceResetTime > 0) {
                    if (timer) clearTimeout(timer);
                    timer = setTimeout(() => {
                        state = false;
                        node.send({payload: state});
                    }, config.forceResetTime * 1000);
                }
            } else if (resetCondition) {
                state = false;
                if (timer) {
                    clearTimeout(timer);
                    timer =
