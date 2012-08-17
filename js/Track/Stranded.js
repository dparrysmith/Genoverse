Genoverse.Track.Stranded = {
  inheritedConstructor: function (config) {
    if (typeof this._makeImage === 'function') {
      return;
    }
    
    this.strand = 1;
    
    this.base(config);
    
    if (this.strand === 1) {
      this.reverseTrack = this.browser.setTracks([ $.extend({}, config, { strand: -1, forwardTrack: this }) ], this.browser.tracks.length)[0];
    }
    
    if (!this.featureStrand) {
      this.featureStrand = this.strand;
    }
    
    this.urlParams.strand = this.featureStrand;
  },
  
  init: function () {
    this.base();
    this.gettingData = {};
  },
  
  positionFeatures: function (features, startOffset, imageWidth) {
    var strand = this.featureStrand;
    return this.base($.grep(features, function (feature) { return feature.strand === strand; }), startOffset, imageWidth);
  },
  
  getData: function (start, end) {
    var deferred = $.Deferred();
    var data;
    
    if (this.strand === 1) {
      data = this.base.apply(this, arguments);
      
      if (data && typeof data.done === 'function')  {
        deferred = data;
      } else {
        deferred.resolve($.extend(true, data.length ? [] : {}, data));
      }
      
      this.reverseTrack.gettingData[start + ':' + end] = deferred;
    } else {
      this.gettingData[start + ':' + end].done(function (data) {
        deferred.resolve($.extend(true, data.length ? [] : {}, data));
      });
    }
    
    return deferred;
  },
  
  remove: function () {
    if (!this.removing) {
      var track = this.forwardTrack || this.reverseTrack;
      
      track.removing = true;
      this.browser.removeTracks([ track ]);
    }
    
    this.base();
  }
};