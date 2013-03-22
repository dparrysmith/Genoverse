Genoverse.on('afterInit afterAddTracks afterRemoveTracks', function () {
  for (var i in this.legends) {
    this.legends[i].setTracks();
  }
});

Genoverse.on('afterCheckHeights afterRemoveTracks', function () {
  for (var i in this.legends) {
    this.legends[i].makeImage({});
  }
});

Genoverse.Track.on('afterPositionFeatures', function (features, params) {
  var legend = this.legend;
  
  if (legend) {
    setTimeout(function () { legend.makeImage(params); }, 1)
  }
});

Genoverse.Track.on('afterResize', function (height, userResize) {
  if (this.legend && userResize === true) {
    this.legend.makeImage({});
  }
});

Genoverse.Track.Legend = Genoverse.Track.extend({
  textColor : '#000000',
  inherit   : [ 'Static' ],
  
  init: function () {
    this.tracks = [];
    
    this.base();
    
    if (!this.browser.legends) {
      this.browser.legends = {};
    }
    
    this.browser.legends[this.id] = this;
    this.setTracks();
  },
  
  setTracks: function () {
    var legend = this;
    var type   = this.featureType;
    
    this.tracks = $.grep(this.browser.tracks, function (t) { if (t.type === type) { t.legend = legend; return true; } });
  },
  
  findFeatures: function () {
    var bounds   = { x: this.browser.scaledStart, y: 0, w: this.width };
    var features = {};
    
    $.each($.map(this.tracks, function (track) {
      bounds.h = track.height;
      return track.featurePositions.search(bounds).concat(track.labelPositions.search(bounds));
    }), function () {
      features[this.legend] = this.color;
    });
    
    // sort legend alphabetically
    return $.map(features, function (color, text) { return [[ text, color ]]; }).sort(function (a, b) {
      var x = a[0].toLowerCase();
      var y = b[0].toLowerCase();
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  },
  
  positionFeatures: function (f, params) {
    if (params.positioned) {
      return f;
    }
    
    var cols     = 2;
    var pad      = 5;
    var w        = 20;
    var x        = 0;
    var y        = 0;
    var xScale   = this.width / cols;
    var yScale   = this.fontHeight + pad;
    var features = [{ x: 0, y: 0, width: this.width, height: 1, color: this.textColor }];
    
    for (var i = 0; i < f.length; i++) {
      features.push(
        { x: (x * xScale) + pad,           y: (y * yScale) + pad, width: w,                                       height: this.featureHeight, color: f[i][1] },
        { x: (x * xScale) + w + (2 * pad), y: (y * yScale) + pad, width: this.context.measureText(f[i][0]).width, height: 1,                  color: 'transparent', label: f[i][0], labelColor: this.textColor }
      );
      
      if (++x === cols) {
        x = 0;
        y++;
      }
    }
    
    this.height = this.featuresHeight = ((y + (x ? 1 : 0)) * yScale) + pad;
    
    params.positioned = true;
    
    return this.base(features, params);
  },
  
  remove: function () {
    delete this.browser.legends[this.id];
    this.base();
  }
});