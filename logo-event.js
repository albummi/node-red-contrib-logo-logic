module.exports = function(RED) {
  function LogoEventNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const serverNode = RED.nodes.getNode(config.server);
    if (!serverNode) return node.error("Home Assistant server not configured");

    const api = serverNode.api;
    if (!api) return node.error("HA connection unavailable");

    // alle originalen Einstellungen übernommen:
    const filter = config.entityidfilter;
    const filterType = config.entityidfiltertype;
    const outInitially = config.outputinitially;
    const stateType = config.state_type;
    const condition = config.ifState;
    const condType = config.ifStateType;
    const condCompare = config.ifStateOperator;
    const forCount = parseFloat(config.for)||0;
    const forUnits = config.forUnits||"seconds";
    const ignorePrevNull = config.ignorePrevStateNull;
    const ignorePrevUnknown = config.ignorePrevStateUnknown;
    const ignorePrevUnavailable = config.ignorePrevStateUnavailable;
    const ignoreCurrUnknown = config.ignoreCurrentStateUnknown;
    const ignoreCurrUnavailable = config.ignoreCurrentStateUnavailable;
    const onlyStateChange = config.outputOnlyOnStateChange;
    const exposeAs = config.exposeAsEntityConfig;

    let timer = null;
    let lastState = null;

    function matchId(id) {
      if (!filter) return true;
      switch (filterType) {
        case 'exact': return id===filter;
        case 'substring': return id.includes(filter);
        case 'regex': try { return new RegExp(filter).test(id); } catch(e){ return false; }
      }
      return false;
    }

    function convert(val) {
      if (stateType==='num') return Number(val);
      if (stateType==='habool') return val===true||val==='true';
      return val;
    }

    function evalCond(newState) {
      if (!condition) return true;
      const a = convert(newState), b = convert(condition);
      switch (condCompare) {
        case 'is': return a===b;
        case 'is_not': return a!==b;
        case 'lt': return a<b;
        case 'lte': return a<=b;
        case 'gt': return a>b;
        case 'gte': return a>=b;
      }
      return true;
    }

    function ignore(oldS,newS) {
      if (oldS===null && ignorePrevNull) return true;
      if (oldS==='unknown' && ignorePrevUnknown) return true;
      if (oldS==='unavailable' && ignorePrevUnavailable) return true;
      if (newS==='unknown' && ignoreCurrUnknown) return true;
      if (newS==='unavailable' && ignoreCurrUnavailable) return true;
      return false;
    }

    function onChange(evt) {
      const id = evt.entity_id;
      if (!matchId(id)) return;

      const oldS = evt.old_state?evt.old_state.state:null;
      const newS = evt.new_state?evt.new_state.state:null;

      if (onlyStateChange && oldS===newS) return;
      if (ignore(oldS,newS)) return;

      const ok = evalCond(newS);

      clearTimeout(timer);
      if (forCount>0 && ok) {
        timer = setTimeout(()=>send(ok,id,evt), forUnits==='minutes'?forCount*60000:(forUnits==='hours'?forCount*3600000:forCount*1000));
      } else {
        send(ok,id,evt);
      }

      lastState=newS;
    }

    function send(state,id,evt) {
      const msg={payload:state, topic:id, data:evt};
      if (exposeAs) msg.entity=exposeAs;
      node.send(msg);
    }

    api.on('ha_events:state_changed', onChange);

    if (outInitially) {
      api.getStates().then(states => {
        Object.values(states).forEach(s => {
          onChange({entity_id:s.entity_id, old_state:null, new_state:s});
        });
      });
    }

    node.on('close', ()=>{
      api.removeListener('ha_events:state_changed', onChange);
      clearTimeout(timer);
    });
  }

  RED.nodes.registerType('logo-event',LogoEventNode);
};
