Genoverse.Track.Patch = Genoverse.Track.extend({
  bump          : true,
  featureHeight : 3,
  bumpSpacing   : 0,
  autoHeight    : true,
  allData       : true,
  backgrounds   : true,
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
        delete features[i].position[scale].bumped;
        delete features[i].position[scale].bottom;
      }
      
      return this.base(features, params);
    }
  },
  
  makeImage: function (params) {
    return this.base(params).done(function (data) {
      var bgImage = $('<img class="bg" />').data(params).prependTo(this.imgContainers[this.imgContainers.length - 1]);
      var heights = [ this.heights.max ];
      
      if (this.strand === 1) {
        bgImage = bgImage.add(bgImage.clone(true).addClass('fullHeight').css('top', this.fullVisibleHeight).prependTo(bgImage.parent().addClass('fullHeight')));
        heights.unshift(1);
      } else {
        bgImage.css('background', '#FFF');
      }
      
      for (var i = 0; i < bgImage.length; i++) {
        this.renderBackground(bgImage.eq(i), heights[i], this.featurePositions.search({ x: params.scaledStart, y: 0, w: this.width, h: this.heights.max }));
      }
    });
  },
  
  drawBackground: function (data, context, features) {
    var reverse = this.strand === -1;
    var i       = features.length;
    var start, width;
    
    if (reverse) {
      features.reverse();
    }
    
    while (i--) {
      context.fillStyle = features[i].background;
      
      if (features[i].end >= data.start && features[i].start <= data.end) {
        start = Math.max(features[i].position[this.scale].X, 0);
        width = Math.min(features[i].position[this.scale].width + (start ? 0 : features[i].position[this.scale].X), this.width);
        
        if (reverse) {
          context.fillRect(start, 0, width, features[i].position[this.scale].Y);
        } else if (context.canvas.height === 1) {
          context.fillRect(start, 0, width, 1);
        } else {
          context.fillRect(start, features[i].position[this.scale].bottom - this.spacing, width, context.canvas.height);
        }
      }
    }
  }
});