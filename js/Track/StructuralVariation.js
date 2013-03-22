// $Revision: 1.5 $

Genoverse.Track.StructuralVariation = Genoverse.Track.extend({ 
  height : 100,
  bump   : true,
  
  init: function () {
    this.decorationHeight = this.featureHeight - 1;
    this.base();
  },
  
  scaleFeatures: function (features, scale) {
    if (scale < 1) {
      var threshold = 1 / scale;
          features  = $.grep(features, function (f) { return f.end - f.start > threshold || f.breakpoint; }).sort(function (a, b) { return a.start - b.start; });
    }
    
    return this.base(features, scale);
  },
  
  bumpFeature: function (bounds, feature, scale, tree) {
    var i = feature.decorations.length;
    
    while (i--) {
      switch (feature.decorations[i].style) {
        case 'bound_triangle_left'  : bounds.x -= this.decorationHeight / 2; break;
        case 'bound_triangle_right' : bounds.w += this.decorationHeight / 2; break;
        default                     : break;
      }
    }
    
    return this.base(bounds, feature, scale, tree);
  },
  
  decorateFeature: function (feature, context, scale) {
    var i           = feature.decorations.length;
    var h           = this.decorationHeight;
    var mid         = h / 2;
    var breakpointH = h * 2;
    var startOffset = feature.position[scale].start - feature.position[scale].X;
    var decoration, x, x2, y, triangle, dir;
    
    while (i--) {
      decoration = feature.decorations[i];
      triangle   = decoration.style.match(/^bound_triangle_(\w+)$/);
      
      context.fillStyle   = decoration.color;
      context.strokeStyle = decoration.border;
      
      if (triangle) {
        dir = !!decoration.out === (triangle[1] === 'left');
        x   = (dir ? feature.position[scale].X + feature.position[scale].W - Math.max(scale, 1) : feature.position[scale].X) + (dir ? 1 : -1) * (decoration.out ? mid : 0);
        x2  = x + ((triangle[1] === 'left' ? -1 : 1) * mid);
        y   = feature.position[scale].Y + 0.5;
        
        if (Math.max(x, x2) > 0 && Math.min(x, x2) < this.width) {
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(x2, y + mid);
          context.lineTo(x, y + h);
          context.closePath();
          context.fill();
          context.stroke();
        }
        
        this.featurePositions.insert({ x: x + startOffset, y: y, w: mid, h: h }, feature); // make the whole thing clickable for a menu
      } else if (decoration.style === 'somatic_breakpoint') {
        x = decoration.start * scale - startOffset;
        y = feature.position[scale].Y + 0.5;
        
        if (x > -5.5 && x + 3.5 < this.width) {
          context.beginPath();
          context.moveTo(x - 0.5, y);
          context.lineTo(x + 4.5, y);
          context.lineTo(x + 2.5, y + breakpointH / 3);
          context.lineTo(x + 5.5, y + breakpointH / 3);
          context.lineTo(x,       y + breakpointH);
          context.lineTo(x + 0.5, y + breakpointH * 2 / 3 - 1);
          context.lineTo(x - 3.5, y + breakpointH * 2 / 3 - 1);
          context.closePath();
          context.fill();
          context.stroke();
        }
        
        feature.position[scale].bottom = y + breakpointH + this.bumpSpacing;
        
        this.featurePositions.insert({ x: x + startOffset - 3.5, y: y, w: 9, h: breakpointH }, $.extend({}, feature, { breakpoint: true, sort: -feature.sort })); // make the whole thing clickable for a menu
      } else if (decoration.style === 'rect') {
        decoration.x     = decoration.start * scale - startOffset;
        decoration.width = (decoration.end - decoration.start) * scale + Math.max(scale, 1);
        
        if (decoration.x < 0 || decoration.x + decoration.width > this.width) {
          this.truncateForDrawing(decoration, scale);
        }
        
        context.fillRect(decoration.x, feature.position[scale].Y, decoration.width, this.featureHeight);
      }
    }
  },
  
  click: function (e) {
    var x = e.pageX - this.container.parent().offset().left + this.browser.scaledStart;
    var y = e.pageY - $(e.target).offset().top;
    var f = this.featurePositions.search({ x: x, y: y, w: 1, h: 1 }).sort(function (a, b) { return a.sort - b.sort; })[0];
    
    if (f && f.breakpoint !== 1) {
      this.browser.makeMenu(this, f, { left: e.pageX, top: e.pageY });
    }
  }
});