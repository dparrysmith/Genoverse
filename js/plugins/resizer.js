Genoverse.Track.on('afterSetMVC', function () {
  if (!this.view.prop('resizable')) {
    return;
  }
  
  var controller = this.controller;
  
  this.resizer = (this.resizer || $('<div class="resizer static"><div class="handle"></div></div>').appendTo(controller.container).draggable({
    axis  : 'y',
    start : function () { $('body').addClass('dragging'); },
    stop  : function (e, ui) {
      $('body').removeClass('dragging');
      controller.resize(controller.view.prop('height') + ui.position.top - ui.originalPosition.top, true);
      $(this).css('top', 'auto'); // returns the resizer to the bottom of the container - needed when the track is resized to 0
    }
  }).on('click', function () {
    if (controller.fullVisibleHeight) {
      controller.resize(controller.fullVisibleHeight, true);
    }
  })).css({ width: this.width, left: 0 })[this.view.prop('autoHeight') ? 'hide' : 'show']();
  
  if (!this.view.prop('autoHeight') && this.view.prop('height') - this.view.prop('margin') === this.view.prop('featureHeight')) {
    controller.resize(this.view.prop('height') + this.resizer.height());
    this.view.prop('initialHeight', this.view.prop('height'));
  }
});
