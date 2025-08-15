<script type="text/x-red" data-template-name="logo-event">
  <!-- exakt wie original: alle Felder, Labels & Reihenfolge übernommen -->
  <!-- Name, Server, Entity ID, Filters, Options... -->
  <!-- nur Outputs auf 1 gesetzt und Label angepasst -->
  <div class="form-row">
    <label for="node-input-name"><i class="fa fa-tag"></i> Name</label>
    <input type="text" id="node-input-name">
  </div>
  <div class="form-row">
    <label for="node-input-server"><i class="fa fa-server"></i> Server</label>
    <input type="text" id="node-input-server">
  </div>
  <div class="form-row">
    <label for="node-input-entityidfilter"><i class="fa fa-cube"></i> Entity ID Filter</label>
    <input type="text" id="node-input-entityidfilter">
  </div>
  <div class="form-row">
    <label for="node-input-entityidfiltertype"><i class="fa fa-filter"></i> Filter Type</label>
    <select id="node-input-entityidfiltertype">
      <option value="exact">Exact</option>
      <option value="substring">Substring</option>
      <option value="regex">RegEx</option>
    </select>
  </div>
  <div class="form-row">
    <label for="node-input-outputinitially"><i class="fa fa-play-circle"></i> Output on Connect</label>
    <input type="checkbox" id="node-input-outputinitially">
  </div>
  <div class="form-row">
    <label for="node-input-ifstate"><i class="fa fa-filter"></i> If State (JSONata)</label>
    <input type="text" id="node-input-ifstate">
  </div>
  <div class="form-row">
    <label for="node-input-for"><i class="fa fa-clock-o"></i> For</label>
    <input type="text" id="node-input-for" placeholder="e.g. 5s">
  </div>
  <div class="form-row">
    <label for="node-input-forunit">Unit</label>
    <select id="node-input-forunit">
      <option value="s">sec</option>
      <option value="m">min</option>
      <option value="h">hour</option>
    </select>
  </div>
  <div class="form-row">
    <label for="node-input-state_type"><i class="fa fa-code"></i> State Type</label>
    <select id="node-input-state_type">
      <option value="str">String</option>
      <option value="num">Number</option>
      <option value="bool">Boolean</option>
    </select>
  </div>
</script>

<script type="text/javascript">
RED.nodes.registerType('logo-event', {
  category: 'home_assistant',
  color: '#fdd835',
  inputs: 0,
  outputs: 1, // nur ein Ausgang
  icon: 'arrow-in.png',
  label: function() { return this.name || 'logo-event'; },
  defaults: {
    name: { value: '' },
    server: { type: 'server', required: true },
    entityidfilter: { value: '' },
    entityidfiltertype: { value: 'exact' },
    outputinitially: { value: false },
    ifstate: { value: '' },
    for: { value: 0 },
    forunit: { value: 's' },
    state_type: { value: 'str' }
  }
});
</script>

<script type="text/x-red" data-help-name="logo-event">
  <p>Exact same UI as Home Assistant <b>Events: State</b> node, but with a single output returning <code>true</code> or <code>false</code> in <code>msg.payload</code>.</p>
</script>
