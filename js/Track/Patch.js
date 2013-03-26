Genoverse.Track.Patch = Genoverse.Track.extend({
  bump          : true,
  featureHeight : 3,
  bumpSpacing   : 0,
  autoHeight    : true,
  allData       : true,
  unsortable    : true,
  resizable     : false,
  featureStrand : 1,
  inherit       : [ 'Stranded' ],
  
  init: function () {
    this.base();
    
    if (this.strand === -1) {
      this.bumpSpacing = 4;
    } else {
      this.labels = false;
    }
  },
  
  positionFeatures: function (originalFeatures, params) {
    if (this.strand === 1) {
      return this.base(originalFeatures.reverse(), params);
    } else {
      var scale    = this.scale;
      var features = $.extend(true, [], originalFeatures.sort(function (a, b) { return b.position[scale].bottom - a.position[scale].bottom; }));
      var i        = features.length;
      
      while (i--) {
        delete features[i].position[scale].H;
        delete features[i].position[scale].Y;
        delete features[i].position[scale].bottom;
        delete features[i].position[scale].positioned;
      }
      
      return this.base(features, params);
    }
  },
  
  makeImage: function (params) {
    return this.base(params).done(function (data) {
      var bgImage  = $('<img class="bg" />').data(params).prependTo(params.container);
      var heights  = [ this.heights.max ];
      var features = this.positionFeatures($.extend(true, [], this.findFeatures(params.start, params.end)), params);
      
      if (this.strand === 1) {
        bgImage = bgImage.add(bgImage.clone(true).addClass('fullHeight').css('top', this.fullVisibleHeight).prependTo(bgImage.parent().addClass('fullHeight')));
        heights.unshift(1);
      } else {
        bgImage.css('background', '#FFF');
      }
      
      for (var i = 0; i < bgImage.length; i++) {
        this.renderBackground(bgImage.eq(i), heights[i], features);
      }
    });
  },
  
  drawBackground: function (params, context, features) {
    var scale   = params.scale;
    var reverse = this.strand === -1;
    
    if (reverse) {
      features.reverse();
    }
    
    for (var i = 0; i < features.length; i++) {
      this.drawFeature($.extend({}, features[i], {
        x     : features[i].position[scale].X,
        width : features[i].position[scale].width,
        color : features[i].background,
        label : false
      }, reverse ? { y: 0, height: features[i].position[scale].Y } : { y: context.canvas.height === 1 ? 0 : features[i].position[scale].bottom - this.spacing, height: context.canvas.height }), context, false, scale);
    }
  }
});