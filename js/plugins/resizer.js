Genoverse.Track.on('afterSetMVC', function () {
  if (!this.prop('resizable')) {
    return;
  }
  
  var controller = this.controller;
  
  this.resizer = (this.resizer || $('<div class="resizer static"><div class="handle"></div></div>').appendTo(controller.container).draggable({
    axis  : 'y',
    start : function () { $('body').addClass('dragging'); },
    stop  : function (e, ui) {
      $('body').removeClass('dragging');
      controller.resize(controller.prop('height') + ui.position.top - ui.originalPosition.top, true);
      $(this).css('top', 'auto'); // returns the resizer to the bottom of the container - needed when the track is resized to 0
    }
  }).on('click', function () {
    var height = controller.prop('fullVisibleHeight');
    
    if (height) {
      controller.resize(height, true);
    }
  })).css({ width: this.width, left: 0 })[this.prop('autoHeight') ? 'hide' : 'show']();
  
  if (!this.prop('autoHeight') && this.prop('height') - this.prop('margin') === this.prop('featureHeight')) {
    controller.resize(this.prop('height') + this.resizer.height());
    this.prop('initialHeight', this.prop('height'));
  }
});
