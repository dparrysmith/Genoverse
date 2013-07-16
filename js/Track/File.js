Genoverse.Track.File = Genoverse.Track.extend({
  /*name      : file.name,
  dataType  : 'text',
  info      : 'Local file `' + file.name + '`, size: ' + file.size + ' bytes',
  threshold : false,
  allData   : true,
  url       : false,
  data      : event.target.result,
  getData   : function () {
    return $.Deferred().done(function () {
      this.receiveData(this.data, 1, this.browser.chromosomeSize);
    }).resolveWith(this);
  }*/
  
  setInterface: function () {
    this.base();
    this._interface.data = 'model';
  }
  
});