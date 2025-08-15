module.exports = function (RED) {
    function LogoEventNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.server = RED.nodes.getNode(config.server);

        if (!node.server || !node.server.api) {
            node.error("No Home Assistant server configured");
            return;
        }

        const entityIdFilter = config.entityidfilter || '';
        const filterType = config.entityidfiltertype || 'exact';
        const outputInitially = config.outputinitially;
        const haltIfState = config.haltifstate;
        const haltIfCompare = config.halt_if_compare || 'is';
        const haltIfType = config.halt_if_type || 'str';

        function matchEntity(entityId) {
            if (!entityIdFilter) return true;
            if (filterType === 'exact') return entityId === entityIdFilter;
            if (filterType === 'substring') return entityId.includes(entityIdFilter);
            if (filterType === 'regex') return new RegExp(entityIdFilter).test(entityId);
            return false;
        }

        function compareStates(newState) {
            if (haltIfState === '') return null;
            let cmpVal = haltIfState;

            if (haltIfType === 'num') {
                newState = Number(newState);
                cmpVal = Number(cmpVal);
            } else if (haltIfType === 'bool') {
                newState = (newState === true || newState === 'true');
                cmpVal = (cmpVal === true || cmpVal === 'true');
            }

            switch (haltIfCompare) {
                case 'is': return newState === cmpVal;
                case 'is_not': return newState !== cmpVal;
                case 'lt': return newState < cmpVal;
                case 'lte': return newState <= cmpVal;
                case 'gt': return newState > cmpVal;
                case 'gte': return newState >= cmpVal;
                default: return null;
            }
        }

        function sendStateChange(entity) {
            const matches = matchEntity(entity.entity_id);
            if (!matches) return;

            const comparison = compareStates(entity.state);
            if (comparison === null) {
                node.send({ payload: false, topic: entity.entity_id, data: entity });
            } else {
                node.send({ payload: comparison, topic: entity.entity_id, data: entity });
            }
        }

        node.server.api.on('state_changed', (event) => {
            if (event && event.data && event.data.new_state) {
                sendStateChange(event.data.new_state);
            }
        });

        if (outputInitially) {
            node.server.api.getStates().then((states) => {
                for (const [entityId, entity] of Object.entries(states)) {
                    sendStateChange(entity);
                }
            });
        }
    }

    RED.nodes.registerType('logo-event', LogoEventNode);
};
