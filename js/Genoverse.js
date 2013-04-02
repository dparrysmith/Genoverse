var $         = jQuery; // Make sure we have local $ (this is for combined script in a function)
var Genoverse = Base.extend({
  // Defaults
  urlParamTemplate : 'r=__CHR__:__START__-__END__', // Overwrite this for your URL style
  width            : 1000,
  height           : 200,
  labelWidth       : 90,
  buffer           : 1,
  longestLabel     : 30,
  trackSpacing     : 2,
  defaultLength    : 5000,
  tracks           : [],
  tracksById       : {},
  menus            : $(),
  plugins          : [],
  dragAction       : 'scroll', // options are: scroll, select, off
  wheelAction      : 'off',    // options are: zoom, off
  colors           : {
    background     : '#FFFFFF',
    majorGuideLine : '#CCCCCC',
    minorGuideLine : '#E5E5E5',
    sortHandle     : '#CFD4E7'
  },
  
  constructor: function (config) {
    if (!this.supported()) {
      return this.die('Your browser does not support this functionality');
    }
    
    config.container = $(config.container); // Make sure container is a jquery object, jquery recognises itself automatically
    
    $.extend(this, config);
    
    var browser = this;
    
    $.when(this.loadPlugins()).always(function () {
      for (var key in browser) {
        if (typeof browser[key] === 'function' && !key.match(/^(base|extend|constructor|loadPlugins|functionWrap|debugWrap)$/)) {
          browser.functionWrap(key);
        }
      }
      
      browser.init();
    });
  },
  
  loadPlugins: function () {
    if (typeof LazyLoad === 'undefined') {
      return;
    }
    
    var browser         = this;
    var loadPluginsTask = $.Deferred();

    // Load plugins css file
    browser.plugins.every(function (plugin) {
      LazyLoad.css(browser.origin + '/css/' + plugin + '.css');
      return true;
    });

    $.when.apply($, $.map(browser.plugins, function (plugin) {
      return $.ajax({
        url      : browser.origin + '/js/plugins/' + plugin + '.js',
        dataType : 'text'
      });
    })).done(function () {
      (function ($, scripts) {
        // Localize variables
        var $ = $;
        
        for (var i = 0; i < scripts.length; i++) {
          try {
            eval(scripts[i][0]);
          } catch (e) {
            // TODO: add plugin name to this message
            console.log('Error evaluating plugin script: ' + e);
            console.log(scripts[i][0]);
          }
        }
      })($, browser.plugins.length === 1 ? [ arguments ] : arguments);
    }).always(loadPluginsTask.resolve);
    
    return loadPluginsTask;
  },
  
  init: function () {
    var browser = this;
    var width   = this.width;
    
    if (!(this.container && this.container.length)) {
      return this.die('You must supply a ' + (this.container ? 'valid ' : '') + 'container element');
    }
    
    this.container.addClass('canvas_container');
    
    this.paramRegex = this.urlParamTemplate ? new RegExp('([?&;])' + this.urlParamTemplate
      .replace(/(\b(\w+=)?__CHR__(.)?)/,   '$2([\\w\\.]+)$3')
      .replace(/(\b(\w+=)?__START__(.)?)/, '$2(\\d+)$3')
      .replace(/(\b(\w+=)?__END__(.)?)/,   '$2(\\d+)$3') + '([;&])'
    ) : '';
    
    this.history          = {};
    this.prev             = {};
    this.backgrounds      = {};
    this.urlParamTemplate = this.urlParamTemplate || '';
    this.useHash          = typeof window.history.pushState !== 'function';
    this.proxy            = $.support.cors ? false : this.proxy;
    this.textWidth        = document.createElement('canvas').getContext('2d').measureText('W').width;
    this.menuContainer    = $('<div class="menu_container">').css({ width: width - 1, left: 1 }).appendTo(this.container);
    this.labelContainer   = $('<ul class="label_container">').appendTo(this.container).sortable({
      items       : 'li:not(.unsortable)',
      handle      : '.handle',
      placeholder : 'label',
      axis        : 'y',
      helper      : 'clone',
      cursor      : 'move',
      start       : function (e, ui) {
        ui.placeholder.css({ height: ui.item.height(), visibility: 'visible', background: browser.colors.sortHandle }).html(ui.item.html());
        ui.helper.hide();
      },
      update      : function (e, ui) {
        browser.tracks[ui.item.data('index')].container[ui.item[0].previousSibling ? 'insertAfter' : 'insertBefore'](browser.tracks[$(ui.item[0].previousSibling || ui.item[0].nextSibling).data('index')].container);
      }
    });
    
    this.labelWidth  = this.labelContainer.outerWidth(true);
    this.wrapperLeft = this.labelWidth - width;
    this.width      -= this.labelWidth;
    this.wrapper     = $('<div class="gv_wrapper">').appendTo(this.container);
    this.selector    = $('<div class="selector crosshair"></div>').appendTo(this.wrapper);
    
    this.container.width(width);
    
    this.selectorControls = $('                      \
      <div class="selector_controls">                \
        <button class="zoomHere">Zoom here</button>  \
        <button class="center">Center</button>       \
        <button class="summary">Summary</button>     \
        <button class="cancel">Cancel</button>       \
      </div>                                         \
    ').appendTo(this.selector);
    
    this.zoomInHighlight = $('     \
      <div class="canvas_zoom i">  \
        <div class="t l h"></div>  \
        <div class="t r h"></div>  \
        <div class="t l v"></div>  \
        <div class="t r v"></div>  \
        <div class="b l h"></div>  \
        <div class="b r h"></div>  \
        <div class="b l v"></div>  \
        <div class="b r v"></div>  \
      </div>                       \
    ').appendTo('body');
    
    this.zoomOutHighlight = this.zoomInHighlight.clone().toggleClass('i o').appendTo('body');
    
    var urlCoords = this.getURLCoords();
    var coords    = urlCoords.chr && urlCoords.start && urlCoords.end ? urlCoords : { chr: this.chr, start: this.start, end: this.end };
    
    this.chr = coords.chr;
    
    this.setRange(coords.start, coords.end);
    this.setHistory();
    this.setTracks();
    this.addUserEventHandlers();
  },
  
  addUserEventHandlers: function () {
    var browser = this;
    
    this.container.on({
      mousedown: function (e) {
        // Only scroll on left click, and do nothing if clicking on a button in selectorControls
        if ((!e.which || e.which === 1) && !(this === browser.selector[0] && e.target !== this)) {
          browser.mousedown(e);
        }
        
        return false;
      },
      mousewheel: function (e, delta, deltaX, deltaY) {
        if (deltaY === 0 && deltaX !== 0) {
          browser.move(null, -deltaX * 10);
        } else if (browser.wheelAction === 'zoom') {
          return browser.mousewheelZoom(e, delta);
        }
      }
    }, '.image_container, .overlay, .selector, .track_message');
    
    this.selectorControls.on('click', function (e) {
      var pos = browser.getSelectorPosition();
      
      switch (e.target.className) {
        case 'zoomHere' : browser.setRange(pos.start, pos.end, true); break;
        case 'center'   : browser.startDragScroll(); browser.move(null, browser.width / 2 - (pos.left + pos.width / 2), 'fast', $.proxy(browser.stopDragScroll, browser)); break;
        case 'summary'  : browser.summary(pos.start, pos.end); break;
        case 'cancel'   : browser.cancelSelect(); break;
        default         : break;
      }
    });
    
    $(document).on({
      'mouseup.genoverse'   : $.proxy(this.mouseup,   this),
      'mousemove.genoverse' : $.proxy(this.mousemove, this),
      'keydown.genoverse'   : $.proxy(this.keydown,   this),
      'keyup.genoverse'     : $.proxy(this.keyup,     this)
    });
    
    $(window).on(this.useHash ? 'hashchange.genoverse' : 'popstate.genoverse', $.proxy(this.popState, this));
  },
  
  reset: function () {
    var i = this.tracks.length;
    
    while (i--) {
      this.tracks[i].reset();
    }
    
    this.scale   = 9e99; // arbitrary value so that setScale resets track scales as well
    this.history = {};
    
    delete this.prev.history;
    
    this.setRange(this.start, this.end);
  },
  
  setWidth: function (width) {
    var i = this.tracks.length;
    
    this.width       = width;
    this.wrapperLeft = this.labelWidth - width;
    this.width      -= this.labelWidth;
    
    this.menuContainer.width(width - this.labelWidth - 1);
    this.container.width(width);
    
    while (i--) {
      this.tracks[i].setWidth(this.width);
    }
    
    this.reset();
  },
  
  mousewheelZoom: function (e, delta) {
    var browser = this;
    
    clearTimeout(this.zoomDeltaTimeout);
    clearTimeout(this.zoomTimeout);
    
    this.zoomDeltaTimeout = setTimeout(function () {
      if (delta > 0) {
        browser.zoomInHighlight.css({ left: e.pageX - 20, top: e.pageY - 20, display: 'block' }).animate({
          width: 80, height: 80, top: '-=20', left: '-=20'
        }, {
          complete: function () { $(this).css({ width: 40, height: 40, display: 'none' }); }
        });
      } else {
        browser.zoomOutHighlight.css({ left: e.pageX - 40, top: e.pageY - 40, display: 'block' }).animate({
          width: 40, height: 40, top: '+=20', left: '+=20'
        }, {
          complete: function () { $(this).css({ width: 80, height: 80, display: 'none' }); }
        });
      }
    }, 100);
    
    this.zoomTimeout = setTimeout(function () {
      browser[delta > 0 ? 'zoomIn' : 'zoomOut'](e.pageX - browser.container.offset().left - browser.labelWidth);
      
      if (browser.dragAction === 'select') {
        browser.moveSelector(e);
      }
    }, 300);
    
    return false;
  },
  
  startDragScroll: function (e) {
    this.dragging   = 'scroll';
    this.scrolling  = !e;
    this.prev.left  = this.left;
    this.dragOffset = e ? e.pageX - this.left : 0;
    this.dragStart  = this.start;
  },
  
  stopDragScroll: function (e, update) {
    this.dragging  = false;
    this.scrolling = false;
    
    $('.overlay', this.wrapper).add('.gv_menu', this.menuContainer).add(this.selector).css({
      left       : function (i, left) { return (this.className.indexOf('selector') === -1 ? 0 : 1) + parseFloat(left, 10) + parseFloat($(this).css('marginLeft'), 10); },
      marginLeft : function ()        { return  this.className.indexOf('selector') === -1 ? 0 : -1; }
    });
    
    if (update !== false) {
      if (this.start !== this.dragStart) {
        this.updateURL();
      }
      
      this.checkTrackHeights();
    }
  },
  
  startDragSelect: function (e) {
    if (!e) {
      return false;
    }
    
    var x = Math.max(0, e.pageX - this.wrapper.offset().left - 2);
    
    this.dragging        = 'select';
    this.selectorStalled = false;
    this.selectorStart   = x;
    
    this.selector.css({ left: x, width: 0 }).removeClass('crosshair');
    this.selectorControls.hide();
  },
  
  stopDragSelect: function (e) {
    if (!e) {
      return false;
    }
    
    this.dragging        = false;
    this.selectorStalled = true;
    
    if (this.selector.outerWidth(true) < 2) { 
      return this.cancelSelect();
    }
    
    this.selectorControls.css({
      marginTop : -this.selectorControls.outerHeight() / 2,
      left      : this.selector.outerWidth(true) / 2 - this.selectorControls.outerWidth(true) / 2
    }).show();
  },
  
  cancelSelect: function () {
    this.dragging        = false;
    this.selectorStalled = false;
    
    this.selector.addClass('crosshair').width(0);
    this.selectorControls.hide();
    
    if (this.dragAction === 'scroll') {
      this.selector.hide();
    }
  },
  
  dragSelect: function (e) {
    var x = e.pageX - this.wrapper.offset().left - 2;

    if (x > this.selectorStart) {
      this.selector.css({ 
        left  : this.selectorStart, 
        width : Math.min(x - this.selectorStart, this.width - this.selectorStart) - 4
      });
    } else {
      this.selector.css({ 
        left  : Math.max(x, 1), 
        width : Math.min(this.selectorStart - x, this.selectorStart - 1)
      });
    }    
  },
  
  setDragAction: function (action, keepSelect) {
    this.dragAction = action;
    
    if (this.dragAction === 'select') {
      this.selector.addClass('crosshair').width(0).show();
    } else if (keepSelect && !this.selector.hasClass('crosshair')) {
      this.selectorStalled = false;
    } else {
      this.cancelSelect();
      this.selector.hide();
    }
  },
  
  toggleSelect: function (on) {
    if (on) {
      this.prev.dragAction = 'scroll';
      this.setDragAction('select');
    } else {
      this.setDragAction(this.prev.dragAction, true);
      delete this.prev.dragAction;
    }
  },
  
  setWheelAction: function (action) {
    this.wheelAction = action;
  },
  
  keydown: function (e) {
    if (e.which === 16 && !this.prev.dragAction && this.dragAction === 'scroll') { // shift key
      this.toggleSelect(true);
    }
  },
  
  keyup: function (e) {
    if (e.which === 16 && this.prev.dragAction) { // shift key
      this.toggleSelect();
    }
  },
  
  mousedown: function (e) {
    if (e.shiftKey) {
      if (this.dragAction === 'scroll') {
        this.toggleSelect(true);
      }
    } else if (this.prev.dragAction) {
      this.toggleSelect();
    }
    
    switch (this.dragAction) {
      case 'select' : this.startDragSelect(e); break;
      case 'scroll' : this.startDragScroll(e); break;
      default       : break;
    }
  },
 
  mouseup: function (e, update) {
    if (!this.dragging) {
      return false;
    }
    
    switch (this.dragging) {
      case 'select' : this.stopDragSelect(e);         break;
      case 'scroll' : this.stopDragScroll(e, update); break;
      default       : break;
    }
  },
  
  mousemove: function (e) {
    if (this.dragging && !this.scrolling) {
      switch (this.dragAction) {
        case 'scroll' : this.move(e.pageX - this.dragOffset - this.left); break;
        case 'select' : this.dragSelect(e); break;
        default       : break;
      }
    } else if (this.dragAction === 'select') {
      this.moveSelector(e);
    }
  },
  
  moveSelector: function (e) {
    if (!this.selectorStalled) {
      this.selector.css('left', e.pageX - this.wrapper.offset().left - 2);
    }
  },
  
  move: function (delta, callback) {
    var scale = this.scale;
    var start, end, left;
    
    if (this.menus.length) {
      this.closeMenus();
    }
    
    if (scale > 1) {
      delta = Math.round(delta / scale) * scale; // Force stepping by base pair when in small regions
    }
    
    left = this.left + delta;
    
    if (left <= this.minLeft) {
      left  = this.minLeft;
      delta = this.minLeft - this.left;
    } else if (left >= this.maxLeft) {
      left  = this.maxLeft;
      delta = this.maxLeft - this.left;
    }
    
    start = Math.round(this.start - delta / scale);
    end   = start + this.length - 1;
    
    this.left = left;
    
    for (var i = 0; i < this.tracks.length; i++) {
      this.tracks[i].move(delta, scale);
    }
    
    this.setRange(start, end);
  },
  
  setRange: function (start, end, update, force) {
    this.prev.start = this.start;
    this.prev.end   = this.end;
    this.start      = Math.max(typeof start === 'number' ? Math.floor(start) : parseInt(start, 10), 1);
    this.end        = Math.min(typeof end   === 'number' ? Math.floor(end)   : parseInt(end,   10), this.chromosomeSize);
    
    if (this.end < this.start) {
      this.end = Math.min(this.start + this.defaultLength - 1, this.chromosomeSize);
    }
    
    this.length = this.end - this.start + 1;
    
    this.setScale(force);
    
    if (update === true && (this.prev.start !== this.start || this.prev.end !== this.end)) {
      this.updateURL();
    }
  },
  
  setScale: function (force) {
    this.prev.scale  = this.scale;
    this.scale       = this.width / this.length;
    this.scaledStart = this.start * this.scale;
    
    if (force || this.prev.scale !== this.scale) {
      this.left        = 0;
      this.prev.left   = 0;
      this.minLeft     = Math.round((this.end   - this.chromosomeSize) * this.scale);
      this.maxLeft     = Math.round((this.start - 1) * this.scale);
      this.scrollStart = 'ss_' + this.start + '_' + this.end;
      this.labelBuffer = Math.ceil(this.textWidth / this.scale) * this.longestLabel;

      if (this.prev.scale) {
        var i = this.tracks.length;
        
        this.cancelSelect();
        this.menuContainer.children().hide();
        
        while (i--) {
          this.tracks[i].setScale();
        }
      }
    }
  },
  
  checkTrackHeights: function () {
    if (this.dragging) {
      return;
    }
    
    for (var i = 0; i < this.tracks.length; i++) {
      if (!this.tracks[i].fixedHeight) {
        this.tracks[i].checkHeight();
      }
    }
  },
  
  resetTrackHeights: function () {
    var track;
    
    for (var i = 0; i < this.tracks.length; i++) {
      track = this.tracks[i];
      
      if (track.resizable) {
        track.autoHeight = !!([ (track.config || {}).autoHeight, track.defaults.autoHeight, this.autoHeight ].sort(function (a, b) {
          return (typeof a !== 'undefined' && a !== null ? 0 : 1) - (typeof b !== 'undefined' && b !== null ?  0 : 1);
        })[0]);
        
        track.heightToggler[track.autoHeight ? 'addClass' : 'removeClass']('auto_height');
        track.resize(track.height + track.spacing);
        track.initialHeight = track.height;
      }
    }
  },
  
  zoomIn: function (x) {
    if (!x) {
      x = this.width / 2;
    }
    
    var start = Math.round(this.start + x / (2 * this.scale));
    var end   = this.length === 2 ? start : Math.round(start + (this.length - 1) / 2);
    
    this.setRange(start, end, true);
  },
  
  zoomOut: function (x) {
    if (!x) {
      x = this.width / 2;
    }
    
    var start = Math.round(this.start - x / this.scale);
    var end   = this.length === 1 ? start + 1 : Math.round(start + 2 * (this.length - 1));
    
    this.setRange(start, end, true);
  },
  
  setTracks: function (tracks, index) {
    var defaults = {
      browser : this,
      width   : this.width
    };
    
    var push = !!tracks;
    var hierarchy, Class, subClass;
    
    tracks = tracks || this.tracks;
    index  = index  || 0;
    
    for (var i = 0; i < tracks.length; i++) {
      if (typeof tracks[i].extend === 'function') {
        continue;
      }
      
      // Well, this is probably ugly, there could be a nicer way of doing it.
      hierarchy = (tracks[i].type || '').split('.');
      Class     = Genoverse.Track;
      
      while (subClass = hierarchy.shift()) {
        Class = Class[subClass];
      }
      
      tracks[i] = new Class($.extend(tracks[i], defaults, { index: i + index }));
      
      if (push) {
        this.tracks.push(tracks[i]);
      }
      
      if (tracks[i].strand === -1 && tracks[i].orderReverse) {
        tracks[i].order = tracks[i].orderReverse;
      }
      
      if (tracks[i].id) {
        this.tracksById[tracks[i].id] = tracks[i];
      }
    }
    
    if (!push) {
      this.sortTracks(); // initial sort
    }
    
    return tracks;
  },
  
  addTracks: function (tracks) {
    this.setTracks(tracks, this.tracks.length);
    this.sortTracks();
    this.updateTracks();
  },
  
  removeTracks: function (tracks) {
    var i = tracks.sort(function (a, b) { return a.index - b.index; }).length; // tracks must be ordered low to high by index for splice to work correctly (splice is done in track.remove())
    
    while (i--) {
      tracks[i].remove();
    }
    
    this.updateTracks();
  },
  
  updateTracks: function () {
    var i = this.tracks.length;
    
    while (i--) {
      // correct track index
      if (this.tracks[i].index !== i) {
        this.tracks[i].index = i;
        this.tracks[i].label.data('index', i);
      }
    }
  },
  
  sortTracks: function () {
    var sorted     = $.extend([], this.tracks).sort(function (a, b) { return a.order - b.order; });
    var labels     = $();
    var containers = $();
    
    for (var i = 0; i < sorted.length; i++) {
      labels.push(sorted[i].label[0]);
      containers.push(sorted[i].container.detach()[0]);
    }
    
    this.labelContainer.append(labels);
    this.wrapper.append(containers);
    
    sorted = labels = containers = null;
  },
  
  updateURL: function () {
    if (this.urlParamTemplate) {
      if (this.useHash) {
        window.location.hash = this.getQueryString();
      } else {
        window.history.pushState({}, '', this.getQueryString());
      }
    }
    
    this.setHistory();
  },
  
  // FIXME: won't work
  setHistory: function () {
  },
  
  popState: function () {
    var coords = this.getURLCoords();
    
    if (coords.start && !(parseInt(coords.start, 10) === this.start && parseInt(coords.end, 10) === this.end)) {
      this.setRange(coords.start, coords.end, false, false);
      
      if (!this.updateFromHistory()) {
        this.reset();
      }
    }
    
    var delta = Math.round((this.start - this.prev.start) * this.scale);
    
    $('.gv_menu', this.menuContainer).css('left', function (i, left) { return parseFloat(left, 10) - delta; });
  },
  
  // FIXME: won't work
  updateFromHistory: function () {
    return false;
  },
  
  getURLCoords: function () {
    var match  = ((this.useHash ? window.location.hash.replace(/^#/, '?') || window.location.search : window.location.search) + '&').match(this.paramRegex);
    var coords = {};
    var i      = 0;
    
    if (!match) {
      return coords;
    }
    
    match = match.slice(2, -1);
    
    $.each(this.urlParamTemplate.split('__'), function () {
      var tmp = this.match(/^(CHR|START|END)$/);
      
      if (tmp) {
        coords[tmp[1].toLowerCase()] = tmp[1] === 'CHR' ? match[i++] : parseInt(match[i++], 10);
      }
    });
    
    return coords;
  },
  
  getQueryString: function () {
    var location = this.urlParamTemplate
      .replace('__CHR__',   this.chr)
      .replace('__START__', this.start)
      .replace('__END__',   this.end);
    
    return this.useHash ? location : window.location.search ? (window.location.search + '&').replace(this.paramRegex, '$1' + location + '$5').slice(0, -1) : '?' + location;
  },
  
  supported: function () {
    var el = document.createElement('canvas');
    return !!(el.getContext && el.getContext('2d'));
  },
  
  die: function (error, el) {
    if (el && el.length) {
      el.html(error);
    } else {
      alert(error);
    }
    
    this.failed = true;
  },
  
  menuTemplate: $('<div class="gv_menu"><div class="close">x</div><table></table></div>').on('click', function (e) {
    if ($(e.target).hasClass('close')) {
      $(this).fadeOut('fast', function () { $(this).remove(); });
    }
  }),
  
  makeMenu: function (feature, event, track) {
    var wrapper = this.wrapper;
    var offset  = wrapper.offset();
    var menu    = this.menuTemplate.clone(true).appendTo(this.menuContainer).position({ of: event, my: 'left top', collision: 'flipfit' });
    
    this.menus.push(menu[0]);
    
    if (track) {
      track.menus.push(menu[0]);
    }
    
    $.when(track ? track.populateMenu(feature) : feature).done(function (feature) {
      if (Object.prototype.toString.call(feature) !== '[object Array]') {
        feature = [ feature ];
      }
      
      feature.every(function (f) {
        $('table', menu).append(
          (f.title ? '<tr class="header"><th colspan="2" class="title">' + f.title + '</th></tr>' : '') +
          $.map(f, function (value, key) {
            if (key !== 'title') {
              return '<tr><td>'+ key +'</td><td>'+ value +'</td></tr>';
            }
          }).join()
        );
        
        return true;
      });
      
      menu.show();
      
      if (track && track.id) {
        menu.addClass(track.id);
      }
    });
    
    return menu;
  },
  
  closeMenus: function () {
    this.menus.fadeOut('fast', function () { $(this).remove(); });
    this.menus = $();
  },
  
  getSelectorPosition: function () {
    var left  = this.selector.position().left;
    var width = this.selector.outerWidth(true);
    var start = Math.round(left / this.scale) + this.start;
    var end   = Math.round((left + width) / this.scale) + this.start - 1;
        end   = end <= start ? start : end;
    
    return { start: start, end: end, left: left, width: width };
  },
  
  // Provide summary of a region (as a popup menu)
  summary: function (start, end) {
    alert(
      'Not implemented' + "\n" +
      'Start: ' + start + "\n" +
      'End: '   + end   + "\n"
    );
  },
  
  /**
   * functionWrap - wraps event handlers and adds debugging functionality
   **/
  functionWrap: function (key, obj) {
    var name = (obj ? (obj.name || 'Track' + obj.type) : 'Genoverse') + '.' + key;
    obj = obj || this;
    
    if ((key.indexOf('after') === 0) || (key.indexOf('before') === 0)) {
      if (!obj.systemEventHandlers[key]) {
        obj.systemEventHandlers[key] = [];
      }
      
      obj.systemEventHandlers[key].push(obj[key]);
      
      return;
    }
    
    var func = key.substring(0, 1).toUpperCase() + key.substring(1);
    
    if (obj.debug) {
      this.debugWrap(obj, key, name, func);
    }
    
    // turn function into system event, enabling eventHandlers for before/after the event
    if (obj.systemEventHandlers['before' + func] || obj.systemEventHandlers['after' + func]) {
      obj['__original' + func] = obj[key];
      
      obj[key] = function () {
        var i, rtn;
        
        if (this.systemEventHandlers['before' + func]) {
          for (i = 0; i < this.systemEventHandlers['before' + func].length; i++) {
            // TODO: Should it end when beforeFunc returned false??
            this.systemEventHandlers['before' + func][i].apply(this, arguments);
          }
        }
        
        rtn = this['__original' + func].apply(this, arguments);
        
        if (this.systemEventHandlers['after' + func]) {
          for (i = 0; i < this.systemEventHandlers['after' + func].length; i++) {
            // TODO: Should it end when afterFunc returned false??
            this.systemEventHandlers['after' + func][i].apply(this, arguments);
          }
        }
        
        return rtn;
      };
    }
  },
  
  debugWrap: function (obj, key, name, func) {
    // Debugging functionality
    // Enabled by "debug": true || { functionName: true, ...} option
    // if "debug": true, simply log function call
    if (obj.debug === true) {
      if (!obj.systemEventHandlers['before' + func]) {
        obj.systemEventHandlers['before' + func] = [];
      }
      
      obj.systemEventHandlers['before' + func].unshift(function () {
        console.log(name);
      });
    }
    
    // if debug: { functionName: true, ...}, log function time
    if (typeof obj.debug === 'object' && obj.debug[key]) {
      if (!obj.systemEventHandlers['before' + func]) {
        obj.systemEventHandlers['before' + func] = [];
      }
      
      if (!obj.systemEventHandlers['after' + func]) {
        obj.systemEventHandlers['after' + func] = [];
      }
      
      obj.systemEventHandlers['before' + func].unshift(function () {
        //console.log(name, arguments);        
        console.time('time: ' + name);
      });
      
      obj.systemEventHandlers['after' + func].push(function () {
        console.timeEnd('time: ' + name);
      });
    }
  },
  
  systemEventHandlers: {}
}, {
  on: function (events, handler) {
    $.each(events.split(' '), function () {
      if (typeof Genoverse.prototype.systemEventHandlers[this] === 'undefined') {
        Genoverse.prototype.systemEventHandlers[this] = [];
      }
      
      Genoverse.prototype.systemEventHandlers[this].push(handler);
    });
  }
});

Genoverse.prototype.origin = $('script:last').attr('src').split('/').slice(0, -2).join('/') || '.';

if (typeof LazyLoad !== 'undefined') {
  LazyLoad.css(Genoverse.prototype.origin + '/css/genoverse.css');
}

window.Genoverse = Genoverse;