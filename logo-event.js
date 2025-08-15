module.exports = function (RED) {
    function LogoEventNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.name = config.name;
        node.entityId = config.entityId;
        node.condition = (config.condition || "").toString().trim();

        if (!node.entityId) {
            node.error("Entity ID ist erforderlich.");
            return;
        }

        // Home Assistant Websocket holen
        const ha = RED.nodes.getNode(config.server);
        if (!ha || !ha.connection) {
            node.error("Keine Verbindung zu Home Assistant gefunden.");
            return;
        }

        // Auf State-Änderungen hören
        ha.connection.on("state_changed", (event) => {
            const eid = event.entity_id;
            if (eid !== node.entityId) return;

            const newState = event.new_state ? event.new_state.state : null;
            let result = false;

            if (node.condition) {
                // Vergleich mit Bedingung
                result = (newState == node.condition);
            } else {
                // True bei "on", "true", 1
                result = ["on", "true", "1", 1, true].includes(newState);
            }

            const msg = {
                payload: result,
                topic: node.entityId,
                data: event
            };

            node.send(msg);
        });
    }

    RED.nodes.registerType("logo-event", LogoEventNode);
};
