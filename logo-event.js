module.exports = function(RED) {
    function LogoEventNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const serverNode = RED.nodes.getNode(config.server);
        if (!serverNode) {
            node.error("Home Assistant server not configured");
            return;
        }

        const api = serverNode.api;
        if (!api) {
            node.error("Home Assistant connection not available");
            return;
        }

        // Original config properties
        const entityFilter = config.entityidfilter;
        const filterType = config.entityidfiltertype;
        const outputInitially = config.outputinitially;
        const stateType = config.state_type;
        const ifState = config.ifstate;
        const ifType = config.ifStateType;
        const ifCompare = config.ifStateOperator;
        const forCount = parseFloat(config.for) || 0;
        const forUnits = config.forUnit || "seconds";
        const ignorePrevNull = config.ignorePrevStateNull;
        const ignorePrevUnknown = config.ignorePrevStateUnknown;
        const ignorePrevUnavailable = config.ignorePrevStateUnavailable;
        const ignoreCurrUnknown = config.ignoreCurrentStateUnknown;
        const ignoreCurrUnavailable = config.ignoreCurrentStateUnavailable;
        const onlyStateChange = config.outputOnlyOnStateChange;
        const exposeAs = config.exposeAsEntityConfig;

        let timer = null;
        let lastState = null;

        function matchEntityId(id) {
            if (!entityFilter) return true;
            switch (filterType) {
                case "exact": return id === entityFilter;
                case "substring": return id.includes(entityFilter);
                case "regex": 
                    try { return new RegExp(entityFilter).test(id); }
                    catch (e) { return false; }
                default: return false;
            }
        }

        function convertType(val) {
            if (stateType === "num") return Number(val);
            if (stateType === "habool") return val === true || val === 'true';
            return val;
        }

        function compare(newVal) {
            if (!ifCompare || !ifState) return true;
            const a = convertType(newVal);
            let b = convertType(ifState);
            switch (ifCompare) {
                case "is": return a === b;
                case "is_not": return a !== b;
                case "lt": return a < b;
                case "lte": return a <= b;
                case "gt": return a > b;
                case "gte": return a >= b;
                default: return true;
            }
        }

        function shouldIgnore(oldS, newS) {
            if (oldS === null && ignorePrevNull) return true;
            if (oldS === "unknown" && ignorePrevUnknown) return true;
            if (oldS === "unavailable" && ignorePrevUnavailable) return true;
            if (newS === "unknown" && ignoreCurrUnknown) return true;
            if (newS === "unavailable" && ignoreCurrUnavailable) return true;
            return false;
        }

        function handleStateChange(evt) {
            const eid = evt.entity_id;
            if (!matchEntityId(eid)) return;

            const oldE = evt.old_state ? evt.old_state.state : null;
            const newE = evt.new_state ? evt.new_state.state : null;

            if (onlyStateChange && oldE === newE) return;
            if (shouldIgnore(oldE, newE)) return;

            const result = compare(newE);

            clearTimeout(timer);
            if (forCount > 0 && result) {
                timer = setTimeout(() => {
                    sendPayload(result, eid, evt);
                }, forUnits === "minutes" ? forCount * 60000 : (forUnits === "hours" ? forCount * 3600000 : forCount * 1000));
            } else {
                sendPayload(result, eid, evt);
            }

            lastState = newE;
        }

        function sendPayload(state, eid, evt) {
            const msg = {
                payload: state,
                topic: eid,
                data: evt
            };
            if (exposeAs) msg.entity = exposeAs;
            node.send(msg);
        }

        api.on("ha_events:state_changed", handleStateChange);

        if (outputInitially) {
            api.getStates().then(states => {
                Object.values(states).forEach(st => {
                    handleStateChange({ entity_id: st.entity_id, old_state: null, new_state: st });
                });
            });
        }

        node.on("close", () => {
            api.removeListener("ha_events:state_changed", handleStateChange);
            clearTimeout(timer);
        });
    }

    RED.nodes.registerType("logo-event", LogoEventNode);
};
