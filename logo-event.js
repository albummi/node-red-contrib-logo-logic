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
      node.error("Home Assistant connection missing");
      return;
    }

    // Kopiert aus original:
    const entityFilter = config.entityidfilter;
    const filterType = config.entityidfiltertype;
    const outputInitially = config.outputinitially;
    const ifState = config.ifstate;
    const forDuration = config.for * (config.forunit === 'm' ? 60 : config.forunit === 'h' ? 3600 : 1);
    const stateType = config.state_type;

    let pendingTimer;

    function matchEntity(id) {
      if (!entityFilter) return true;
      switch (filterType) {
        case 'exact': return id === entityFilter;
        case 'substring': return id.includes(entityFilter);
        case 'regex': return new RegExp(entityFilter).test(id);
      }
      return false;
    }

    function evalCondition(state) {
      // original JSONata; simplified: ifState empty = no filter
      if (!ifState) return true;
      try {
        return RED.util.evaluateJSONataExpression(ifState, msg);
      } catch(e) {
        node.error("Error evaluating condition: " + e.message);
        return false;
      }
    }

    function onEvent(evt) {
      const id = evt.entity_id;
      if (!matchEntity(id)) return;

      const newState = evt.new_state ? evt.new_state.state : null;
      const ok = evalCondition(newState);

      clearTimeout(pendingTimer);

      if (forDuration > 0 && ok) {
        pendingTimer = setTimeout(() => {
          const msg = { payload: true, topic: id, data: evt };
          node.send(msg);
        }, forDuration * 1000);
      } else {
        const msg = { payload: ok, topic: id, data: evt };
        node.send(msg);
      }
    }

    api.on('ha_events:state_changed', onEvent);

    if (outputInitially) {
      api.getStates().then(states => {
        for (const id in states) {
          const evt = { entity_id: id, new_state: states[id], old_state: null };
          onEvent(evt);
        }
      });
    }

    node.on('close', () => {
      api.removeListener('ha_events:state_changed', onEvent);
      if (pendingTimer) clearTimeout(pendingTimer);
    });
  }

  RED.nodes.registerType('logo-event', LogoEventNode);
};
