// $Revision: 1.3 $

Genoverse.Track.Contig = Genoverse.Track.extend({
  borderColor : '#000000',
  labels      : 'overlay',
  
  getQueryString: function () {
    if (!this.colors) {
      this.urlParams.colors = 1;
    }
    
    return this.base.apply(this, arguments);
  },
  
  parseData: function (data) {
    var i = data.features.length;
    
    if (data.colors) {
      this.colors = data.colors;
      delete this.urlParams.colors;
    }
    
    while (i--) {
      data.features[i].color = this.colors[data.features[i].id];
    }
    
    return this.base(data);
  },
  
  draw: function (features, featureContext, labelContext, scale) {
    featureContext.fillStyle = this.borderColor;
    
    featureContext.fillRect(0, 0,                      this.width, 1);
    featureContext.fillRect(0, this.featureHeight - 1, this.width, 1);
    
    this.base(features, featureContext, labelContext, scale);
  }
});