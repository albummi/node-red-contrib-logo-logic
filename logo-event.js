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
            node.error("Home Assistant connection unavailable");
            return;
        }

        const entityFilter = config.entityidfilter;
        const filterType = config.entityidfiltertype;
        const outputInitially = config.outputinitially;
        const stateType = config.state_type;
        const haltIfState = config.haltifstate;
        const haltIfCompare = config.halt_if_compare;
        const haltIfType = config.halt_if_type;
        const forCount = parseFloat(config.for) || 0;
        const forUnit = config.forUnits || 'seconds';

        let forDuration = forCount;
        if (forUnit === 'minutes') forDuration *= 60;
        if (forUnit === 'hours') forDuration *= 3600;
        let timeout = null;

        function matchEntityId(id) {
            if (!entityFilter) return true;
            switch (filterType) {
                case 'exact': return id === entityFilter;
                case 'substring': return id.includes(entityFilter);
                case 'regex':
                    try { return new RegExp(entityFilter).test(id); }
                    catch (e) { return false; }
                default: return false;
            }
        }

        function convertState(state) {
            if (stateType === 'num') return Number(state);
            if (stateType === 'bool') return (state === true || state === 'true');
            return state;
        }

        function compareState(newState) {
            if (!haltIfCompare || haltIfState === '') return 'both'; // fire always
            const a = convertState(newState);
            let b = convertState(haltIfState);
            switch (haltIfCompare) {
                case 'is': return (a === b) ? 'true' : 'false';
                case 'is_not': return (a !== b) ? 'true' : 'false';
                case 'lt': return (a < b) ? 'true' : 'false';
                case 'lte': return (a <= b) ? 'true' : 'false';
                case 'gt': return (a > b) ? 'true' : 'false';
                case 'gte': return (a >= b) ? 'true' : 'false';
                default: return 'both';
            }
        }

        function sendPayload(match) {
            const msg = {
                payload: match === 'true',
                topic: config.entityidfilter,
                _retrigger: true
            };
            node.send(msg);
        }

        function onEvent(evt) {
            if (!evt || !evt.entity_id) return;
            if (!matchEntityId(evt.entity_id)) return;
            const result = compareState(evt.new_state ? evt.new_state.state : null);

            clearTimeout(timeout);
            if (forDuration > 0 && result === 'true') {
                timeout = setTimeout(() => sendPayload('true'), forDuration * 1000);
            } else if (result === 'true' || result === 'false') {
                sendPayload(result);
            }
        }

        api.on('ha_events:state_changed', onEvent);

        if (outputInitially) {
            api.getStates().then((states) => {
                Object.values(states).forEach((stateObj) => {
                    onEvent({ entity_id: stateObj.entity_id, new_state: stateObj });
                });
            });
        }

        node.on('close', () => {
            api.removeListener('ha_events:state_changed', onEvent);
            if (timeout) clearTimeout(timeout);
        });
    }

    RED.nodes.registerType('logo-event', LogoEventNode);
};
