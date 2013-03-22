Genoverse.Track.Synteny = Genoverse.Track.extend({
  featureHeight : 5,
  bump          : true,
  allData       : true,
  
  parseData: function (data, start, end) {
    data.features = data[this.urlParams.id];
    
    var i = data.features.length;
    
    if (this.url) {
      var j = this.browser.tracks.length;
      
      this.colors = data.colors;
      
      while (j--) {
        if (this.browser.tracks[j].type === 'Synteny' && this.browser.tracks[j] !== this) {
          this.browser.tracks[j].colors = this.colors;
          this.browser.tracks[j].parseData($.extend(true, {}, data));
        }
      }
    }
    
    while (i--) {
      data.features[i].color = data.features[i].labelColor = this.colors[data.features[i].colorId];
    }
    
    this.base(data, start, end);
  },
  
  makeImage: function (params) {
    if (this.url) {
      var track       = this;
      var otherTracks = $.map(this.browser.tracks, function (t) { if (t.type === 'Synteny' && t.id !== track.id) { t.url = false; return t.id; } });
      
      return this.base(params).done(function () {
        var i = otherTracks.length;
        
        while (i--) {
          this.browser.tracksById[otherTracks[i]].makeImage(params);
        }
      });
    } else if (this.colors) {
      return this.base(params); 
    }
  }
});