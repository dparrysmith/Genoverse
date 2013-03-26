Genoverse.Track.Variation = Genoverse.Track.extend({
  labels     : 'overlay',
  autoHeight : 'force',
  
  // Add inserts with triangles
  decorateFeature: function (feature, context, scale) {
    var i = feature.decorations.length;
    
    while (i--) {
      context.fillStyle = feature.decorations[i].color;
      
      if (feature.decorations[i].style === 'insertion') {
        context.fillRect(feature.position[scale].X, feature.position[scale].Y, 1, feature.position[scale].height);
        context.beginPath();
        context.moveTo(feature.position[scale].X - 3, this.featureHeight + 1);
        context.lineTo(feature.position[scale].X,     this.featureHeight - 3);
        context.lineTo(feature.position[scale].X + 3, this.featureHeight + 1);
        context.fill();
      }
    }
  }
});