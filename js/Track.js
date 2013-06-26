Genoverse.Track = Base.extend({
  constructor: function (config) {
    this.setInterface();
    this.extend(config); // TODO: check when track is { ... } instead of Genoverse.Track.extend({ ... })
    
    this.order = typeof this.order !== 'undefined' ? this.order : this.index;
    
    this.setLengthMap();
    this.setMVC();
  },
  
  setInterface: function () {
    var mvc = [ 'Controller', 'Model', 'View', 'controller', 'model', 'view' ];
    var prop;
    
    this._interface = {};
    
    for (var i = 0; i < 3; i++) {
      for (prop in Genoverse.Track[mvc[i]].prototype) {
        if (!/^(constructor|init)$/.test(prop)) {
          this._interface[prop] = mvc[i + 3];
        }
      }
    }
  },
  
  setMVC: function () {
    // FIXME: if you zoom out quickly then hit the back button, the second zoom level (first one you zoomed out to) will not draw if the models/views are the same
    if (this.model && typeof this.model.abort === 'function') { // TODO: don't abort unless model is changed?
      this.model.abort();
    }
    
    var lengthSettings = this.getSettingsForLength();
    
    var settings       = $.extend(true, {}, lengthSettings, this.constructor.prototype); // model, view, options
    var mvc            = [ 'model', 'view', 'controller' ];
    var mvcSettings    = {};
    var trackSettings  = {};
    var obj, j;
    
    settings.controller = settings.controller || this.controller || Genoverse.Track.Controller;
    settings.model      = settings.model      || this.model      || Genoverse.Track.Model;
    settings.view       = settings.view       || this.view       || Genoverse.Track.View;
    
    for (var i = 0; i < 3; i++) {
      mvcSettings[mvc[i]] = { prop: {}, func: {} };
    }
    
    for (i in settings) {
      if (!/^(constructor|init|base|extend)$/.test(i)) {
        if (this._interface[i]) {
          mvcSettings[this._interface[i]][typeof settings[i] === 'function' ? 'func' : 'prop'][i] = settings[i];
        } else if (!Genoverse.Track.prototype.hasOwnProperty(i) && !/^(controller|model|view)$/.test(i)) {
          trackSettings[i] = settings[i];
        }
      }
    }
    
    this.extend(trackSettings);
    
    for (i = 0; i < 3; i++) {
      obj = mvc[i];
      
      mvcSettings[obj].func.systemEventHandlers = this.systemEventHandlers;
      mvcSettings[obj].prop.browser             = this.browser;
      mvcSettings[obj].prop.width               = this.width;
      mvcSettings[obj].prop.index               = this.index;
      mvcSettings[obj].prop.track               = this;
      
      if (obj === 'controller') {
        continue;
      }
      
      // FIXME: change before/afterInit events to something else, since init exists in all of m, v, c
      
      if (typeof settings[obj] === 'function') {
        if (this[obj] && this[obj].constructor.ancestor === settings[obj]) {
          for (j in this[obj].constructor.prototype) {
            if (this[obj].constructor.prototype[j] !== this[obj][j] && typeof this[obj][j] !== 'function') {
              this[obj][j] = this[obj].constructor.prototype[j];
            }
          }
          
          for (j in mvcSettings[obj].prop) {
            this[obj][j] = mvcSettings[obj].prop[j];
          }
          
          this[obj].setDefaults();
        } else {
          this[obj] = new (settings[obj].extend(mvcSettings[obj].func))(mvcSettings[obj].prop);
        }
      } else {
        this[obj] = settings[obj];
      }
    }
    
    if (!this.controller || typeof this.controller === 'function') {
      this.controller = new (settings.controller.extend(mvcSettings.controller.func))($.extend(mvcSettings.controller.prop, { model: this.model, view: this.view }));
    } else {
      this.controller.model = this.model;
      this.controller.view  = this.view;
    }
    
    if (lengthSettings) {
      lengthSettings.model = this.model;
      lengthSettings.view  = this.view;
    }
  },
  
  setLengthMap: function () {
    var j = false;
    var value;
    
    this.lengthMap = [];
    
    for (var key in this) { // Find all scale-map like keys
      if (!isNaN(key)) {
        value = this[key];
        delete this[key];
        this.lengthMap.push([ parseInt(key, 10), value ]);
      }
    }
    
    if (this.lengthMap.length) {
      this.lengthMap.push([ -1, $.extend(true, {}, this) ]);
      this.lengthMap = this.lengthMap.sort(function (a, b) { return b[0] - a[0]; });
    }
    
    for (var i = 0; i < this.lengthMap.length; i++) {
      if (j !== false) {
        this.lengthMap[j][1].model = this.lengthMap[j][1].model || this.lengthMap[i][1].model;
        this.lengthMap[j][1].view  = this.lengthMap[j][1].view  || this.lengthMap[i][1].view;
      } else {
        j = i;
      }
      
      if (this.lengthMap[j][1].model && this.lengthMap[j][1].view) {
        j = false;
      }
    }
  },
  
  getSettingsForLength: function () {
    for (var i = 0; i < this.lengthMap.length; i++) {
      if (this.browser.length >= this.lengthMap[i][0]) {
        return this.lengthMap[i][1];
      }
    }
  },
  
  systemEventHandlers: {}
}, {
  on: function (events, handler) {
    $.each(events.split(' '), function () {
      if (typeof Genoverse.Track.prototype.systemEventHandlers[this] === 'undefined') {
        Genoverse.Track.prototype.systemEventHandlers[this] = [];
      }
      
      Genoverse.Track.prototype.systemEventHandlers[this].push(handler);
    });
  }
});

