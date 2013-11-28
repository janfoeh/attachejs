window.SpecHelper = {
  onClassChange: function onClassChange(target, callback) {
    "use strict";

    var $target           = $(target),
        MutationObserver  = window.MutationObserver || window.WebKitMutationObserver,
        observerConfig    = { childList: false, characterData: false, attributes: true, subtree: false },
        observerHandler,
        observer;

    observerHandler = function observerHandler(mutationRecords) {
      mutationRecords.every(function(mutation) {
        if (mutation.attributeName === 'class') {
          callback($target);
          return false;
        }

        return true;
      });
    };

    observer = new MutationObserver(observerHandler);
    observer.observe ($target.get(0), observerConfig);

    return observer;
  }
};
