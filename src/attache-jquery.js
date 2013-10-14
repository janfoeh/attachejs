
// Expose plugin as an AMD module if AMD loader is present:
(function (factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'attache'], factory);
  } else {
    factory(jQuery, Attache);
  }

}(function ($, Attache) {
  'use strict';

  $.Attache = Attache;

  // Create chainable jQuery plugin:
  $.fn.attache = function (optionsOrFnName, args) {
    var dataKey = 'attache';

    // If function invoked without argument return
    // instance of the first matched element
    if (arguments.length === 0 && this.first().data(dataKey)) {
      return this.first().data(dataKey);
    }

    return this.each(function () {
      var inputElement  = $(this),
          instance      = inputElement.data(dataKey);

      if (typeof optionsOrFnName === 'string') {
        if (instance && typeof instance[optionsOrFnName] === 'function') {
          instance[optionsOrFnName](args);
        }

      } else {
        // If instance already exists, destroy it:
        if (instance && instance.dispose) {
          instance.dispose();
        }

        instance = new Attache(this, optionsOrFnName);
        inputElement.data(dataKey, instance);
      }
    });
  };
}));