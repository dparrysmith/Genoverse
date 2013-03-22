Genoverse.Track.Variation = Genoverse.Track.extend({
  labels     : 'overlay',
  autoHeight : 'force',
  
  // Add triangles at the bottom of inserts
  decorateFeature: function (feature, context, scale) {
    var i = feature.decorations.length;
    var x = feature.position[scale].X;
    var decoration;
    
    while (i--) {
      decoration = feature.decorations[i];
      
      context.fillStyle = decoration.color;
      
      if (decoration.style === 'insertion') {
        context.beginPath();
        context.moveTo(x - 3, this.featureHeight + 1);
        context.lineTo(x,     this.featureHeight - 3);
        context.lineTo(x + 3, this.featureHeight + 1);
        context.fill();
      }
    }
  }
});