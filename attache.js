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
   * Attache
   *
   * @class
   * @global
   * @param {jQuery} anchorElement - The DOM element Attaché will be anchored to
   * @param {Object} [options]
   * @param {String} [options.trigger=hover] - An event type to trigger Attaché. Allowed are "hover", "click" or "none"
   * @param {String} [options.position=right center] - the popover position, relative to the anchor: left|center|right top|center|bottom
   * @param {String[]} [options.alternativePositions=] - an array list of alternative position strings, in case the default position leads
   *                                                                  to the popover being off-screen
   * @param {Number} [options.offsetX=10] - the horizontal distance between anchor and popover in px
   * @param {Number} [options.offsetY=10] - the vertical distance between anchor and popover in px
   * @param {String} [options.popoverClass] - additional CSS class(es) to apply to the popover markup
   * @param {Boolean} [options.debug=false] - provide debug information and error handling in the console
   *
   * @param {Object} [callbacks] - callbacks to be triggered at various lifecycle moments
   * @param {afterCreateCallback} [callbacks.afterCreate] - called after the popover markup has been created
   * @param {afterShowCallback} [callbacks.afterShow] - called each time after the popover is shown
   * 
   * @example
   * var popover = new Attache(document.getElementById('popover-link'), {popoverClass: 'info-tooltip'});
   *
   * @example
   * // show a tooltip to the bottom right of #popover-link, with fallback positions 'right center'
   * // or 'left center' if the tooltip cannot fit at bottom right
   * var popover = new Attache($('#popover-link'), {position: 'right bottom', alternativePositions: ['right center', 'left center']});
   */
  function Attache(anchorElement, options, callbacks) {
    var noop = function () {},
        that = this;

    this.options = $.extend({}, this.defaults, options);

    this.$anchorElement = $(anchorElement);
    this.$popover;
    this.currentPositionLabel = this.options.position;
    this.content;
    this.callbacks = {
      'afterCreate':  [],
      'afterShow':    []
    };

    if (typeof callbacks !== 'undefined') {
      for(var callbackName in callbacks){
         if (callbacks.hasOwnProperty(callbackName)) {
           this.addCallback(callbackName, callbacks[callbackName]);
         }
      }
    }

    this.initialize();
  }

  Attache.prototype = (function() {

    var defaults,
        initialize,
        show,
        hide,
        popover,
        setContent,
        positionPopover,
        destroy,
        exists,
        isActive,
        addCallback,
        _hasCallbackFor,
        _executeCallbacksFor,
        _createPopover,
        _getAnchorPosition,
        _setPopoverPosition,
        _setPositionLabel,
        _popoverIsWithinViewport,
        _debug;

    defaults = {
      trigger: "hover",
      position: "right center",
      alternativePositions: [],
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

    /**
     * Show the popover. Create the markup first if it does not exist yet
     *
     * @memberOf Attache
     * @public
     */
    show = function show() {
      if ( !this.exists() ) {
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

      _executeCallbacksFor.call(this, 'afterShow', this.$anchorElement, this.$popover);
    };

    hide = function hide() {
      if (!this.isActive()) {
        return false;
      }

      // trigger a style recalculation in order to prevent the browser
      // from coalescing the style changes from removing 'active' and
      // adding 'inactive'. Coalescing the changes makes exit animations
      // impossible, since the popover changes display from 'block' to 'none'
      this.$popover.removeClass('active');
      this.$popover.get(0).offsetHeight;
      this.$popover.addClass('inactive');
    };

    /**
     * Create the popover markup in the DOM
     *
     * @memberOf Attache
     * @private
     */
    _createPopover = function _createPopover() {
      this.$popover = $('<div class="attache-popover inactive"></div>').addClass(this.options.popoverClass);

      this.$popover.html(this.content);

      $('body').append(this.$popover);
      _executeCallbacksFor.call(this, 'afterCreate', this.$anchorElement, this.$popover);
    };

    /**
     * Position or reposition the popover. If positioning fails, i.e. the popover is off-viewport, retry with options.alternativePositions
     *
     * @memberOf Attache
     * @public
     * @param {String} positionLabel Where to position the popover. One of either "{left|center|right} {top|center|bottom}", e.g. "right bottom"
     *
     * @example
     * popover.positionPopover('left top');
     */
    positionPopover = function positionPopover(positionLabel) {
      var that    = this,
          success = false,
          position;

      if (typeof positionLabel === 'undefined') {
        positionLabel = this.currentPositionLabel;
      }

      _setPopoverPosition.call(this, positionLabel);

      if (_popoverIsWithinViewport.call(this) || this.options.alternativePositions.length === 0) {
        return;
      }

      this.options.alternativePositions.every(function(alternativePositionLabel) {
        _debug.call(that, "trying alternative position %s", alternativePositionLabel);

        _setPopoverPosition.call(that, alternativePositionLabel);

        // cancel the loop when we found a position that fits
        if ( _popoverIsWithinViewport.call(that) ) {
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
      var oldHorizontalLabel  = "horizontal-" + this.currentPositionLabel.split(' ')[0],
          oldVerticalLabel    = "vertical-" + this.currentPositionLabel.split(' ')[1],
          newHorizontalLabel  = "horizontal-" + newPositionLabel.split(' ')[0],
          newVerticalLabel    = "vertical-" + newPositionLabel.split(' ')[1];

      this.$popover.removeClass( oldHorizontalLabel + " " + oldVerticalLabel )
                    .addClass( newHorizontalLabel + " " + newVerticalLabel );

      this.currentPositionLabel = newPositionLabel;
    };

    /**
     * The top left and bottom right coordinates of the anchor element. Relative to the document, ignores element margin.
     * 
     * @memberOf Attache
     * @private
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

    /**
     * Calculate the popovers' desired offset and set it
     * 
     * @memberOf Attache
     * @private
     * @param {String} positionLabel Where to position the popover. One of either "{left|center|right} {top|center|bottom}", e.g. "right bottom"
     */
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
      _setPositionLabel.call(this, positionLabel);
    };

    /**
     * checks whether the popover is currently completely visible within the viewport
     * 
     * @memberOf Attache
     * @private
     * @returns {Boolean}
     */
    _popoverIsWithinViewport = function _popoverIsWithinViewport() {
      var rect = this.$popover.get(0).getBoundingClientRect();

      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    };

    /**
     * Write a debug message to console if debugging is enabled
     * 
     * @memberOf Attache
     * @private
     * @param {...mixed} - all arguments are handed to console.log
     */
    _debug = function _debug() {
      if (this.options.debug) {
        console.log.apply( console, Array.prototype.slice.call(arguments) );
      }
    };

    /**
     * A jQuery object of the popover markup in the DOM
     * 
     * @memberOf Attache
     * @public
     * @returns {jQuery}
     */
    popover = function popover() {
      return this.$popover;
    };

    /**
     * Does the popover markup exist in the DOM?
     *
     * @memberOf Attache
     * @public
     * @returns {Boolean}
     */
    exists = function exists() {
      return typeof this.$popover !== 'undefined' && this.$popover.length === 1;
    };

    /**
     * Is this popover currently active?
     *
     * @memberOf Attache
     * @public
     * @returns {Boolean}
     */
    isActive = function isActive() {
      return this.exists() && this.$popover.hasClass('active');
    };

    /**
     * Modifies the content markup of the popover
     *
     * @memberOf Attache
     * @public
     * @param {String} content
     */
    setContent = function setContent(content) {
      this.content = content;

      if (this.exists()) {
        this.$popover.html(this.content);
      }
    };

    /**
     * Hide the popover, remove it from DOM and remove event handlers from the anchor element
     *
     * @memberOf Attache
     * @public
     */
    destroy = function destroy() {
      if ( !this.exists() ) {
        return false;
      }

      this.$popover.remove();
    };

    /**
     * Add a callback that is executed at trigger
     *
     * @memberOf Attache
     * @public
     * @param {String} trigger - at what point in the lifecycle to trigger the callback
     * @param {Function} callback
     */
    addCallback = function addCallback(trigger, callback) {
      if (typeof this.callbacks[trigger] === 'undefined') {
         _debug.call(this, "Warning: unknown callback %s will never be triggered", trigger);
         return false;
      }

      this.callbacks[trigger].push(callback);
    };

    /**
     * Tests whether one or more callbacks are available for the given trigger
     *
     * @memberOf Attache
     * @private
     * @param {String} trigger
     * @returns {Boolean}
     */
    _hasCallbackFor = function _hasCallbackFor(trigger) {
      return typeof this.callbacks[trigger] !== 'undefined' && this.callbacks[trigger].length > 0;
    };

    /**
     * Execute all callbacks for a given trigger
     *
     * @memberOf Attache
     * @private
     * @param {String} trigger
     * @param {...mixed} arguments - arguments to be handed to the callbacks
     */
    _executeCallbacksFor = function _executeCallbacksFor(trigger) {
      var that              = this,
          callbackArguments = Array.prototype.slice.call(arguments);

      // remove the trigger name
      callbackArguments.shift();

      if (_hasCallbackFor.call(this, trigger)) {
        this.callbacks[trigger].forEach(function(cb) { cb.apply(that, callbackArguments); });
      }
    };

    return {
      defaults: defaults,
      initialize: initialize,
      show: show,
      hide: hide,
      popover: popover,
      exists: exists,
      isActive: isActive,
      setContent: setContent,
      positionPopover: positionPopover,
      destroy: destroy,
      addCallback: addCallback
    };
  })();

  return Attache;
}));

/**
 * Callback called after the popover markup has been created
 *
 * @callback afterCreateCallback
 * @this Attache
 *
 * @param {jQuery} anchorElement
 * @param {jQuery} popoverElement
 */

/**
 * Callback called after a popover has been displayed
 *
 * @callback afterShowCallback
 * @this Attache
 *
 * @param {jQuery} anchorElement
 * @param {jQuery} popoverElement
 */