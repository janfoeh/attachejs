// Expose plugin as an AMD module if AMD loader is present:
(function (factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['knockout', 'jquery'], factory);
  } else {
    window.ko.bindingHandlers.attache = factory(ko, jQuery);
  }

}(function (ko, $) {
  'use strict';

  /**
   * A Knockout binding handler for Attache
   *
   * @global
   */
  var attache = {
    /** @lends ko.bindingHandlers.attache */
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      var $element        = $(element),
          context         = ko.unwrap(valueAccessor()),
          attacheTemplate = allBindingsAccessor().attacheTemplate,
          attacheOptions  = allBindingsAccessor().attacheOptions || {},
          contentCallback;

      contentCallback = function(anchor, popover) {
        ko.renderTemplate(attacheTemplate, context, {}, popover.get(0));
      };

      $element.attache(attacheOptions);
      $element.attache().addCallback('afterCreate', contentCallback);

      $element.on('click', function(ev) {
        if ($element.attache().isActive()) {
          $element.attache().hide();
        } else {
          $element.attache().show();
        }

        ev.stopPropagation();
      });

      ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        try {
          $(element).attache().destroy();
        } catch (e) {
          
        }
      });
    }
  };

  return attache;
}));