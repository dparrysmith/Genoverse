Genoverse.Track.Gene = Genoverse.Track.extend({
  height : 50,
  bump   : true,
  
  init: function () {
    this.base();
    this.setRenderer(this.renderer, true);
  },
  
  setRenderer: function (renderer, permanent) {
    if (/nolabel/.test(renderer)) {
      this.labels = false;
    }
    
    if (/transcript/.test(renderer)) {
      this.maxLabelRegion = 2e5;
      this.featureHeight  = 8;
      this.bumpSpacing    = 2;
    } else if (/collapsed/.test(renderer)) {
      this.maxLabelRegion = 2e6;
      this.featureHeight  = 8;
      this.bumpSpacing    = 2;
    } else {
      this.maxLabelRegion = 1e7;
      this.featureHeight  = 6;
      this.bumpSpacing    = 1;
      
      if (this.labels) {
        this.labels = 'separate';
      }
    }
    
    if (this.urlParams.renderer !== renderer || permanent) {
      this.base(renderer, permanent);
    }
  },
  
  getRenderer: function () {
    var renderer = this.renderer.split('_');
    
    if (this.browser.length > 1e7) {
      renderer[0] = 'gene';
    } else if (this.browser.length > 1e6 && /transcript/.test(this.renderer)) {
      renderer[0] = 'collapsed';
    }
    
    return renderer.join('_');
  },
  
  drawFeature: function (feature, featureContext, labelContext, scale) {
    if (/gene/.test(this.urlParams.renderer)) {
      return this.base(feature, featureContext, labelContext, scale);
    }
    
    var expanded = /transcript/.test(this.urlParams.renderer);
    var add      = Math.max(scale, 1);
    var exon;
    
    for (var i = 0; i < feature.exons.length; i++) {
      exon = $.extend({}, feature, {
        x     : feature.x + (feature.exons[i].start - feature.start) * scale, 
        width : (feature.exons[i].end - feature.exons[i].start) * scale + add,
        label : i ? false : feature.label
      }, feature.exons[i].style === 'strokeRect' ? {
        color       : false,
        borderColor : feature.color,
        y           : feature.y + 1,
        height      : feature.height - 3
      } : {});
      
      this.base(exon, featureContext, labelContext, scale);
      
      if (expanded && i && feature.exons[i - 1].id !== feature.exons[i].id) {
        this.drawIntron($.extend({}, exon, {
          start : feature.x + (feature.exons[i - 1].end - feature.start) * scale + add,
          end   : feature.x + (feature.exons[i].start   - feature.start) * scale,
          y     : feature.y + this.featureHeight / 2,
          y2    : feature.y + (feature.strand > 0 ? 0 : this.featureHeight),
          color : feature.color
        }), featureContext);
      }
    }
    
    if (!expanded) {
      featureContext.fillRect(feature.position[scale].X, feature.position[scale].Y + this.featureHeight / 2, feature.position[scale].width, 1);
    }
  },
  
  decorateFeature: function (feature, context, scale) {
    console.log(feature.highlight)
  },
  
  drawIntron: function (feature, context) {
    var x1 = feature.start; // x coord of the right edge of the first exon
    var x3 = feature.end;   // x coord of the left edge of the second exon
    
    // Skip if completely outside the image's region
    if (x3 < 0 || x1 > this.width) {
      return;
    }
    
    var xMid   = (x1 + x3) / 2;
    var x2     = xMid;                    // x coord of the peak of the hat
    var y1     = feature.y;               // y coord of the ends of the line (half way down the exon box)
    var y3     = y1;
    var y2     = feature.y2;              // y coord of the peak of the hat  (level with the top (forward strand) or bottom (reverse strand) of the exon box)
    var yScale = (y2 - y1) / (xMid - x1); // Scale factor for recalculating coords if points lie outside the image region
    
    if (xMid < 0) {
      y2 = feature.y + (yScale * x3);
      x2 = 0;
    } else if (xMid > this.width) {
      y2 = feature.y + (yScale * (this.width - feature.start));
      x2 = this.width;
    }
    
    if (x1 < 0) {
      y1 = xMid < 0 ? y2 : feature.y - (yScale * feature.start);
      x1 = 0;
    }
    
    if (x3 > this.width) {
      y3 = xMid > this.width ? y2 : y2 - (yScale * (this.width - x2));
      x3 = this.width;
    }
    
    context.strokeStyle = feature.color;
    
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.lineTo(x3, y3);
    context.stroke();
  }
});