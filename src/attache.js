
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
   * @param {String} [options.position=right center] - the popover position, relative to the anchor: left|center|right top|center|bottom
   * @param {String[]} [options.alternativePositions=["center bottom"]] - a list of alternative position strings, should the default lead
   *                                                                      to the popover being off-screen
   * @param {Number} [options.offsetX=10] - the horizontal distance between anchor and popover in px
   * @param {Number} [options.offsetY=10] - the vertical distance between anchor and popover in px
   */

  function Attache(anchorElement, options) {
    var noop = function () {},
        that = this;

    this.options = $.extend({}, this.defaults, options);

    this.$anchorElement = $(anchorElement);
    this.$popover;
    this.currentPositionLabel = this.options.position;
    this.content;

    this.initialize();
  }

  Attache.prototype = (function() {

    var _status = "inactive",
        defaults,
        initialize,
        show,
        popover,
        setContent,
        positionPopover,
        destroy,
        _createPopover,
        _getAnchorPosition,
        _setPopoverPosition,
        _setPositionLabel,
        _popoverIsWithinViewport,
        _debug;

    defaults = {
      trigger: "hover",
      position: "right center",
      alternativePositions: ["center bottom"],
      offsetX: 10,
      offsetY: 10,
      popoverClass: "",
      debug: true
    };

    initialize = function initialize() {
      if (this.$anchorElement.length === 0) {
        if (this.options.debug) {
          console.error("Attache: missing anchor element");
        }

        return;
      }
    };

    show = function show() {
      if (typeof this.$popover === 'undefined' || this.$popover.length !== 1) {
        _createPopover.call(this);
      }

      // trigger a style recalculation in order to prevent the browser
      // from coalescing the style changes from removing 'inactive' and
      // adding 'active'. Coalescing the changes makes entry animations
      // impossible, since the popover changes display from 'none' to 'block'
      this.$popover.removeClass('inactive');
      this.$popover.get(0).offsetHeight;
      this.$popover.addClass('active');

      this.positionPopover();

      _status = "active";
    };

    _createPopover = function _createPopover() {
      this.$popover = $('<div class="attache-popover inactive"></div>').addClass(this.options.popoverClass);

      this.$popover.html(this.content);

      $('body').append(this.$popover);
    };

    positionPopover = function positionPopover(positionLabel) {
      var that    = this,
          success = false,
          position;

      if (typeof positionLabel === 'undefined') {
        positionLabel = this.currentPositionLabel;
      }

      _setPopoverPosition.call(this, positionLabel);

      if (_popoverIsWithinViewport.call(this) || this.options.alternativePositions.length === 0) {
        _setPositionLabel.call(this, positionLabel);
        return;
      }

      this.options.alternativePositions.every(function(alternativePositionLabel) {
        _debug.call(that, "trying alternative position %s", alternativePositionLabel);

        _setPopoverPosition.call(that, alternativePositionLabel);

        // cancel the loop when we found a position that fits
        if ( _popoverIsWithinViewport.call(that) ) {
          _setPositionLabel.call(that, positionLabel);
          success = true;
          return false;
        }

        return true;
      });

      if (this.options.debug && !success) {
        console.warn("Attache failed to position popover within viewport. Giving up.");
      }

    };

    _setPositionLabel = function _setPositionLabel(newPositionLabel) {
      this.$popover.removeClass( this.currentPositionLabel.replace(' ', '-') )
                    .addClass( newPositionLabel.replace(' ', '-') );

      this.currentPositionLabel = newPositionLabel;
    };

    /**
     * The top left and bottom right coordinates of the anchor element. Relative to the document, ignores element margin.
     * 
     * @returns {Object} - {
     *                      topleft:      { x: x, y: y},
     *                      bottomright:  { x: x, y: y}
     *                    }
     */
    _getAnchorPosition = function _getAnchorPosition() {
      var a       = this.$anchorElement,
          offset  = a.offset(),
          width   = a.outerWidth(false),
          height  = a.outerHeight(false);

      return {
        topleft: {
          x: offset.left,
          y: offset.top
        },
        bottomright: {
          x: offset.left + width,
          y: offset.top + height
        }
      };
    };

    _setPopoverPosition = function _setPopoverPosition(positionLabel) {
      var horizontalPosition  = positionLabel.split(" ")[0],
          verticalPosition    = positionLabel.split(" ")[1],
          anchorPosition      = _getAnchorPosition.call(this),
          popoverWidth        = this.$popover.outerWidth(false),
          popoverHeight       = this.$popover.outerHeight(false),
          x,
          y;

      switch (horizontalPosition) {
        case 'left':
          x = anchorPosition.topleft.x - popoverWidth - this.options.offsetX;
          break;

        case 'center':
          var anchorHalfWidth   = Math.round( (anchorPosition.bottomright.x - anchorPosition.topleft.x) / 2 ),
              popoverHalfWidth  = Math.round(popoverWidth / 2);

          x = anchorPosition.topleft.x + anchorHalfWidth - popoverHalfWidth;
          break;

        case 'right':
          x = anchorPosition.bottomright.x + this.options.offsetX;
          break;
      }

      switch (verticalPosition) {
        case 'top':
          y = anchorPosition.topleft.y - this.options.offsetY - popoverHeight;
          break;

        case 'center':
          var anchorHalfHeight  = Math.round( (anchorPosition.bottomright.y - anchorPosition.topleft.y) / 2 ),
              popoverHalfHeight = Math.round(popoverHeight / 2);

          y = anchorPosition.topleft.y + anchorHalfHeight - popoverHalfHeight;
          break;

        case 'bottom':
          y = anchorPosition.bottomright.y + this.options.offsetY;
          break;
      }

      _debug.call(this, "Positioning popover to %s - x: %s y: %s", positionLabel, x, y);

      this.$popover.css({ top: y, left: x });
    };

    _popoverIsWithinViewport = function _popoverIsWithinViewport() {
      var rect = this.$popover.get(0).getBoundingClientRect();

      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    };

    _debug = function _debug() {
      if (this.options.debug) {
        console.log.apply( console, Array.prototype.slice.call(arguments) );
      }
    };

    popover = function popover() {
      return this.$popover;
    };

    setContent = function setContent(content) {
      this.content = content;
    };

    destroy = function destroy() {
      this.$popover.remove();
    };

    return {
      defaults: defaults,
      initialize: initialize,
      show: show,
      popover: popover,
      setContent: setContent,
      positionPopover: positionPopover,
      destroy: destroy
    };
  })();

  return Attache;
}));