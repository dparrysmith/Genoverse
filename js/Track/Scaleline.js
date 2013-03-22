Genoverse.Track.Scaleline = Genoverse.Track.extend({
  color          : '#000000',
  height         : 12,
  featuresHeight : 14,
  inherit        : [ 'Static' ],
  
  resize: $.noop,
  
  positionFeatures: function (features, params) {
    if (params.positioned) {
      return features;
    } else if (this.scale === this.drawnScale) {
      return false;
    }
    
    var text   = this.formatLabel(this.browser.length);
    var text2  = 'Forward strand';
    var width1 = this.context.measureText(text).width;
    var width2 = this.context.measureText(text2).width;
    
    features = [
      { x: 0,                                       y: this.height / 2, width: (this.width - width1 - 10) / 2,            height: 1 },
      { x: width1 + (this.width - width1 + 10) / 2, y: this.height / 2, width: ((this.width - width1) / 2) - width2 - 45, height: 1 },
      { x: this.width - 30,                         y: this.height / 2, width: 5,                                         height: 1, decorations: true },
      { x: (this.width - width1) / 2,               y: 2,               width: width1,                                    height: 0, color: '#FFFFFF', labelColor: this.color, label: text  },
      { x: this.width - width2 - 35,                y: 2,               width: width2,                                    height: 0, color: '#FFFFFF', labelColor: this.color, label: text2 }
    ];
    
    this.drawnScale = this.scale;
    
    params.positioned = true;
    
    return this.base(features, params);
  },
  
  decorateFeature: function (feature, context, scale) {
    context.strokeStyle = this.color;
    
    context.beginPath();
    context.moveTo(this.width - 25, this.height * 0.25);
    context.lineTo(this.width - 5,  this.height * 0.5);
    context.lineTo(this.width - 25, this.height * 0.75);
    context.closePath();
    context.stroke();
    context.fill();
  }
});