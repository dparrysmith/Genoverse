Genoverse.Track.Controller.Stranded = Genoverse.Track.Controller.extend({
  constructor: function (properties) {
    this.base(properties);
  
    if (this.track.strand) {
      this.strand = this.track.strand;
    }
    
    if (typeof this._makeImage === 'function') {
      return;
    }
    
    if (this.strand === -1) {
      this._makeImage = this.track.makeReverseImage ? $.proxy(this.track.makeReverseImage, this) : this.makeImage;
      this.makeImage  = $.noop;
    } else {
      this.strand       = 1;
      this._makeImage   = this.makeImage;
      this.makeImage    = this.makeForwardImage;
      this.reverseTrack = this.browser.addTrack(this.track.constructor.extend({ strand: -1, url: false, forwardTrack: this }), this.browser.tracks.length).controller;
    }
    
    this.track.strand        = this.track.strand        || this.strand;
    this.track.featureStrand = this.track.featureStrand || this.strand;
    
    if (!(this.model instanceof Genoverse.Track.Model.Stranded)) {
      this.track.lengthMap.push([ -9e99, { model: Genoverse.Track.Model.Stranded }]);
    }
  },
  
  init: function () {
    this.base();
    
    if (this.track.forwardTrack) {
      this.model.prop('features', this.track.forwardTrack.model.prop('features'));
    }
  },
  
  makeForwardImage: function (params) {
    var rtn = this._makeImage(params);
    
    if (rtn && typeof rtn.done === 'function') {
      rtn.done(function () {
        this.reverseTrack._makeImage(params, rtn);
      });
    } else {
      this.reverseTrack._makeImage(params, rtn);
    }
  },
  
  remove: function () {
    if (!this.removing) {
      var track = this.forwardTrack || this.reverseTrack;
      
      track.removing = true;
      this.browser.removeTrack(track);
    }
    
    this.base();
  }
});
  
Genoverse.Track.Model.Stranded = Genoverse.Track.Model.extend({
  setURL: function (urlParams, update) {
    this.base($.extend(urlParams || this.urlParams, { strand: this.track.featureStrand }), update);
  },
  
  findFeatures: function () {
    var strand = this.track.featureStrand;
    return $.grep(this.base.apply(this, arguments), function (feature) { return feature.strand === strand; });
  }
});