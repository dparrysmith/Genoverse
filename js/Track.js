Genoverse.Track = Base.extend({
  constructor: function (config) {
    this.setInterface();
    this.extend(config); // TODO: check when track is { ... } instead of Genoverse.Track.extend({ ... })
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
    if (this.model && typeof this.model.abort === 'function') {
      this.model.abort();
    }
    
    var track    = this;
    //var settings = this.getSettingsForLength() || {}; // model, view, options
    var settings = $.extend(this.getSettingsForLength() || {}, this.constructor.prototype); // model, view, options
    
    settings.controller = settings.controller || this.controller || Genoverse.Track.Controller;
    settings.model      = settings.model      || this.model      || Genoverse.Track.Model;
    settings.view       = settings.view       || this.view       || Genoverse.Track.View;
    
    
    //var proto = this.constructor.prototype;
    
    var XXX = { controller: {}, model: {}, view: {} };
    var __TRACK = {};
    
    //for (var prop in proto) {
    for (var prop in settings) {
      if (!/^(constructor|init|base|extend)$/.test(prop)) {
        if (this._interface[prop]) {
          //XXX[this._interface[prop]][prop] = proto[prop];
          XXX[this._interface[prop]][prop] = settings[prop];
        } else if (!Genoverse.Track.prototype.hasOwnProperty(prop) && !/^(controller|model|view)$/.test(prop)) {
          //__TRACK[prop] = proto[prop];
          __TRACK[prop] = settings[prop];
        }
      }
    }
    
    this.extend(__TRACK);
    
    // FIXME: remove
    for (var i in XXX) {
      XXX[i].browser = this.browser;
      XXX[i].width   = this.width;
      XXX[i].index   = this.index;
      XXX[i].systemEventHandlers   = this.systemEventHandlers;
      XXX[i].track   = this;
    }
    
    $.each([ 'model', 'view' ], function () {
      if (typeof settings[this] === 'function') {
        //if (track[this] instanceof settings[this]) {
        if (track[this] && track[this].constructor.ancestor === settings[this]) {
          for (var i in XXX[this]) {
            track[this][i] = XXX[this][i];
          }
        } else {
          track[this] = new (settings[this].extend(XXX[this]))();
        }
      } else {
        track[this] = settings[this];
      }
    });
    
    if (!this.controller || typeof this.controller === 'function') {
      this.controller = new (settings.controller.extend($.extend(XXX.controller, { model: this.model, view: this.view })))();
    } else {
      this.controller.model = this.model;
      this.controller.view  = this.view;
    }
    
    this.updateLengthMap();
  },
  
  setLengthMap: function () {
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
    
    
    var j = false;
    
    for (var i = 0; i < this.lengthMap.length; i++) {
      if (typeof j === 'number') {
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
  
  updateLengthMap: function () {
    var settings = this.getSettingsForLength();
    
    if (settings) {
      settings.model = this.model;
      settings.view  = this.view;
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

