var defaultControls = [
  $('<a title="More info">').html('?').on('click', function () {
    var track  = $(this).data('track');
    var offset = track.container.offset();
    
    offset.left += 50;
    offset.width = track.width - 100;
    
    if (!track.menus.filter('.track_info').length) {
      track.browser.makeMenu({
        title : track.name,
        ' '   : track.info
      }, false, track).css(offset).addClass('track_info');
    }
  }),
  
  $('<a class="height_toggle">').html('&nbsp;').on({
    click: function () {
      var controller = $(this).data('track');
      var track      = controller.track;
      var height;
      
      if (track.prop('autoHeight', !track.prop('autoHeight'))) {
        track.prop('heightBeforeToggle', track.prop('height'));
        height = track.prop('fullVisibleHeight');
      } else {
        height = track.prop('heightBeforeToggle') || track.prop('initialHeight');
      }
      
      $(this).trigger('toggleState');
      
      controller.resize(height, true);
    },
    toggleState: function () { // custom event to set title and change the icon
      var track = $(this).data('track').track;
      var autoHeight = track.prop('autoHeight');
      
      this.title = autoHeight ? 'Set track to fixed height' : 'Set track to auto-adjust height';
      $(this)[autoHeight ? 'addClass' : 'removeClass']('auto_height');
      
      if (track.resizer) {
        track.resizer[autoHeight ? 'hide' : 'show']();
      }
    }
  }),
  
  $('<a title="Close track">').html('x').on('click', function () {
    $(this).data('track').remove();
  })
];

var toggle = $('<a>').html('&laquo;').on('click', function () {
  if ($(this).parent().hasClass('maximized')) {
    $(this)
      .parent().removeClass('maximized').end()
      .siblings().css({ display: 'none' }).end()
      .html('&laquo;');
  } else {
    $(this)
      .parent().addClass('maximized').end()
      .siblings().css({ display: 'inline-block' }).end()
      .html('&raquo;');
  }
});

Genoverse.Track.on('afterAddDomElements', function () {
  if (this.track.controls === 'off') {
    return;
  }
  
  var controls = (this.track.controls || []).concat(defaultControls);
  
  this.trackControls = $('<div class="track_controls">').prependTo(this.container);

  for (var i = 0; i < controls.length; i++) {
    controls[i].clone(true).css({ display: 'none' }).data('track', this).appendTo(this.trackControls);
  }
  
  this.heightToggler = this.trackControls.children('.height_toggle').trigger('toggleState');
  
  toggle.clone(true).data('track', this).appendTo(this.trackControls);
});

Genoverse.Track.on('afterResize', function() {
  if (this.trackControls) {
    this.trackControls[this.prop('height') < this.trackControls.outerHeight(true) ? 'hide' : 'show']();
  }
});

Genoverse.Track.on('afterResetHeight', function () {
  if (this.prop('resizable') && this.heightToggler) {
    this.heightToggler[this.prop('autoHeight') ? 'addClass' : 'removeClass']('auto_height');
    this.heightToggler.trigger('toggleState');
  }
});

Genoverse.Track.on('afterSetMVC', function () {
  if (this.controller.heightToggler) {
    this.controller.heightToggler.trigger('toggleState')[this.prop('fixedHeight') || this.prop('resizable') === false ? 'addClass' : 'removeClass']('hidden');
  }
});
