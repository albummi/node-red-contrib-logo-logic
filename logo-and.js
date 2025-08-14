module.exports = function(RED) {
    function LogoAndNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.input1Field = config.input1Field || "topic";
        node.input1Value = config.input1Value;
        node.input2Field = config.input2Field || "topic";
        node.input2Value = config.input2Value;

        let state = { in1: false, in2: false };

        node.on('input', function(msg) {
            if (msg[node.input1Field] !== undefined && msg[node.input1Field] == node.input1Value) {
                state.in1 = true;
            } else if (msg[node.input1Field] !== undefined) {
                state.in1 = false;
            }

            if (msg[node.input2Field] !== undefined && msg[node.input2Field] == node.input2Value) {
                state.in2 = true;
            } else if (msg[node.input2Field] !== undefined) {
                state.in2 = false;
            }

            node.send({ payload: state.in1 && state.in2 });
        });
    }
    RED.nodes.registerType("logo-and", LogoAndNode);
}
