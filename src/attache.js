
// Expose plugin as an AMD module if AMD loader is present:
(function (factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else {
    window.Attache = factory(jQuery);
  }

}(function ($) {
  'use strict';

  /**
   * @constructor
   * @param {jQuery} anchorElement - The DOM element Attaché will be anchored to
   * @param {Object} [options]
   * @param {String} [options.trigger=hover] - An event type to trigger Attaché. Allowed are "hover", "click" or "none"
   */

  function Attache(anchorElement, options) {
    var noop      = function () {},
        that      = this,
        defaults  = {
          trigger: "hover"
        };

    this.options = $.extend({}, defaults, options);

    this.$anchorElement = $(anchorElement);

    this.initialize();
  }

  Attache.prototype = (function() {

    var _status = "closed",
        initialize,
        show,
        _createPopover;

    return {
      initialize: initialize,
      show: show
    };
  })();

  return Attache;
}));