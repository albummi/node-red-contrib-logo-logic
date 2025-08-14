<script type="text/x-red" data-template-name="logo-nand">
  <div class="form-row">
    <label for="node-input-name"><i class="fa fa-tag"></i> Name</label>
    <input type="text" id="node-input-name" placeholder="LOGO NAND">
  </div>

  <div class="form-row">
    <label for="node-input-inputsCount"><i class="fa fa-sign-in"></i> Anzahl Eingänge</label>
    <input type="number" id="node-input-inputsCount" min="2" max="8">
  </div>

  <div class="form-row">
    <label><i class="fa fa-bolt"></i> Nur bei Zustandsänderung senden</label>
    <input type="checkbox" id="node-input-emitOnChange" checked>
  </div>

  <div class="form-row">
    <label><i class="fa fa-exchange"></i> Eingänge konfigurieren (Feld & Wert)</label>
    <div id="inputs-config-container"></div>
  </div>

  <div class="form-tips">
    Eingänge werden geprüft, indem für jeden Eingang das gewählte msg-Feld (msg.payload/msg.topic/msg.logo) mit dem konfigurierten Wert verglichen wird.
  </div>
</script>

<script type="text/x-red" data-help-name="logo-nand">
  <p>LOGO-Style NAND-Gatter mit konfigurierbaren Eingangsquellen.</p>
</script>

<script type="text/javascript">
(function() {
  // reuse builder
  function buildInputsUI(count, cfgFields, cfgValues, cfgNegs) {
    const container = $("#inputs-config-container");
    container.empty();
    for (let i = 0; i < count; i++) {
      const fieldVal = (cfgFields && cfgFields[i]) ? cfgFields[i] : "payload";
      const cmpVal = (cfgValues && cfgValues[i] !== undefined) ? cfgValues[i] : "";
      const neg = (cfgNegs && cfgNegs[i]) ? "checked" : "";

      const html = `
        <div class="form-row input-config-row" data-idx="${i}">
          <label style="width:120px">Eingang ${i+1}</label>
          <select class="input-field-select" data-idx="${i}">
            <option value="payload">msg.payload</option>
            <option value="topic">msg.topic</option>
            <option value="logo">msg.logo</option>
          </select>
          <input type="text" class="input-value" data-idx="${i}" placeholder="Vergleichswert" value="${$('<div/>').text(cmpVal).html()}">
          <label style="margin-left:8px"><input type="checkbox" class="negate-flag" data-idx="${i}" ${neg}> Negieren</label>
        </div>
      `;
      container.append(html);
      container.find(`.input-field-select[data-idx="${i}"]`).val(fieldVal);
    }
  }

  RED.nodes.registerType('logo-nand', {
    category: 'function',
    color: '#FFCC00',
    icon: 'font-awesome/fa-cogs',
    defaults: {
      name: { value: "" },
      inputsCount: { value: 2, required: true, validate: v => v >= 2 && v <= 8 },
      inputFields: { value: [] },
      inputValues: { value: [] },
      negateInputs: { value: [] },
      emitOnChange: { value: true }
    },
    inputs: 1,
    outputs: 1,
    label: function() { return this.name || "LOGO NAND"; },
    oneditprepare: function() {
      const self = this;
      const countEl = $("#node-input-inputsCount");
      buildInputsUI(parseInt(countEl.val(),10) || 2, self.inputFields || [], self.inputValues || [], self.negateInputs || []);
      countEl.on("change", function() {
        const c = Math.max(2, Math.min(8, parseInt($(this).val(),10) || 2));
        buildInputsUI(c, self.inputFields || [], self.inputValues || [], self.negateInputs || []);
      });
    },
    oneditsave: function() {
      const count = Math.max(2, Math.min(8, parseInt($("#node-input-inputsCount").val(),10) || 2));
      const fields = new Array(count).fill("payload");
      const values = new Array(count).fill("");
      const negs = new Array(count).fill(false);
      $(".input-config-row").each(function() {
        const idx = parseInt($(this).attr("data-idx"),10);
        if (isNaN(idx) || idx < 0 || idx >= count) return;
        fields[idx] = $(this).find(".input-field-select").val();
        values[idx] = $(this).find(".input-value").val();
        negs[idx] = $(this).find(".negate-flag").is(":checked");
      });
      this.inputFields = fields;
      this.inputValues = values;
      this.negateInputs = negs;
    }
  });
})();
</script>
