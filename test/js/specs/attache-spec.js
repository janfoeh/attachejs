/*global Attache, SpecHelper, describe, xdescribe, it, xit, beforeEach, afterEach, expect, runs, waitsFor, spyOn, spyOnEvent */

describe("Attache", function() {
  "use strict";

  var $anchor,
      attache;

  beforeEach(function() {
    $anchor = $('<div></div>').css({position: 'absolute', left: 200, top: 200, width: 100, height: 100}).appendTo('body');
  });

  afterEach(function() {
    $anchor.remove();
    attache.destroy();
    Attache.groups = {
      default: []
    };
  });

  it("should be lazy and not create markup on initialization", function() {
    attache = new Attache($anchor.get(0));

    expect($('.attache-popover').length).toEqual(0);
  });

  it("should create popover markup on show()", function() {
    attache = new Attache($anchor.get(0));
    attache.show();

    expect($('.attache-popover').length).toEqual(1);
  });

  it("should create popover markup on when popover() is accessed before show()", function() {
    var popover;

    attache = new Attache($anchor.get(0));
    popover = attache.popover();

    expect(typeof popover).toEqual("object");
  });

  it("should not remove popover markup on hide()", function() {
    attache = new Attache($anchor.get(0));
    attache.show();

    attache.hide();

    expect($('.attache-popover').length).toEqual(1);
  });

  it("should remove the popover from DOM when destroyed", function() {
    attache = new Attache($anchor.get(0));
    attache.show();
    attache.destroy();

    expect($('.attache-popover').length).toEqual(0);
  });

  it("should update existing markup when setContent is called", function() {
    attache = new Attache($anchor.get(0));
    attache.setContent("foo");
    attache.show();
    attache.hide();

    attache.setContent("bar");

    expect($('.attache-popover').text()).toEqual("bar");
  });

  it("should add CSS classes according to its position", function() {
    var popoverIsVisible = false;

    runs(function() {
      attache = new Attache($anchor.get(0), {position: "left center"});
      attache.addCallback('afterShow', function() { popoverIsVisible = true; });
      attache.show();
    });

    waitsFor(function() {
      return popoverIsVisible;
    }, "The afterShow callback should have triggered", 100);

    runs(function() {
      expect(attache.popover().hasClass('horizontal-left')).toBeTruthy();
      expect(attache.popover().hasClass('vertical-center')).toBeTruthy();
    });
  });

  it("should update the CSS classes when switching to alternative positions", function() {
    var popoverIsVisible = false;

    runs(function() {
      $anchor.css({left: '5px'});

      attache = new Attache($anchor.get(0), {position: "left center", alternativePositions: ["right center"]});
      attache.addCallback('afterShow', function() { popoverIsVisible = true; });
      attache.show();
    });

    waitsFor(function() {
      return popoverIsVisible;
    }, "The afterShow callback should have triggered", 100);

    runs(function() {
      expect(attache.popover().hasClass('horizontal-left')).toBeFalsy();
      expect(attache.popover().hasClass('horizontal-right')).toBeTruthy();
      expect(attache.popover().hasClass('vertical-center')).toBeTruthy();
    });
  });

  // Testing whether the visibility classes .activating, .active and .deactivating are applied
  // correctly is a little bit more involved. Both .activating and .deactivating are only applied
  // temporarily, so we attach a DOM mutation observer to see whether that happened.

  describe("visibility css classes lifecycle", function() {
    // var globalOptionsBackup = Veil.globalOptions;

    // afterEach(function() {
    //   Veil.globalOptions = globalOptionsBackup;
    // });

    it("should add .activating and .active to the popover on show()", function() {
      var hasActivatingClass  = false,
          hasActiveClass      = false,
          classChangeCounter  = 0,
          popover,
          observer;

      runs(function() {
        attache = new Attache($anchor.get(0));
        popover = attache.popover();

        observer = SpecHelper.onClassChange(popover, function(target){
          classChangeCounter += 1;

          if (target.hasClass('activating')) {
            hasActivatingClass = true;
          }

          if (target.hasClass('active')) {
            hasActiveClass = true;
          }
        });

        attache.show();
      });

      waitsFor(function() {
        return classChangeCounter >= 2;
      }, "The popovers' class should have mutated twice", 100);

      runs(function() {
        observer.disconnect();
        expect(hasActivatingClass).toBeTruthy();
        expect(hasActiveClass).toBeTruthy();
      });
    });

    it("should add .deactivating to the overlay on hide(), then remove all visibility classes after the transition is finished", function() {
      var hasDeactivatingClass      = false,
          classChangeCounter        = 0,
          waitForTransitionComplete = false,
          popover,
          observer;

      runs(function() {
        attache = new Attache($anchor.get(0), {overlayClass: 'transition-test'});
        popover = attache.popover();
        attache.show();
      });

      waitsFor(function() {
        return popover.hasClass('active');
      }, "Attache should have become active", 100);

      runs(function() {
        observer = SpecHelper.onClassChange(popover, function(target){
          classChangeCounter += 1;

          if (target.hasClass('deactivating')) {
            hasDeactivatingClass = true;
          }
        });

        attache.hide();
      });

      waitsFor(function() {
        return classChangeCounter >= 1;
      }, "The popovers' class should have mutated", 100);

      runs(function() {
        observer.disconnect();

        expect(hasDeactivatingClass).toBeTruthy();
        expect($('.attache-popover.transition-test').hasClass('active')).toBeFalsy();

        setTimeout(function() {
          waitForTransitionComplete = true;
        }, 850);
      });

      waitsFor(function() {
        return waitForTransitionComplete;
      }, "The wait flag should have been triggered", 1000);

      runs(function() {
        expect($('.attache-popover.transition-test').hasClass('deactivating')).toBeFalsy();
      });
    });
  });

  describe("callbacks", function() {
    it("should trigger the afterCreate callback after create, before show()", function() {
      var popoverVisible  = true,
          callbackFired   = false,
          callback        = function(anchor, popover) { popoverVisible = popover.hasClass('active'); callbackFired = true; };

      attache = new Attache($anchor.get(0), {}, {afterCreate: callback});
      attache.show();

      expect(callbackFired).toBeTruthy();
      expect(popoverVisible).toBeFalsy();
    });

    it("should trigger the afterShow callback after show()", function() {
      var callbackFired = false,
          callback      = function() { callbackFired = true; };

      runs(function() {
        attache = new Attache($anchor.get(0));
        attache.addCallback('afterShow', callback);
        attache.show();
      });

      waitsFor(function() {
        return callbackFired;
      }, "The afterShow callback should have triggered", 100);
    });
  });

  describe("options", function() {
    it("should apply a provided CSS class to the popover", function() {
      attache = new Attache($anchor.get(0), { popoverClass: 'additional-class-test' });
      attache.show();

      expect(attache.popover().hasClass('additional-class-test')).toBeTruthy();
    });
  });
  
  describe("groups", function() {
    var $secondAnchor;
    
    beforeEach(function() {
      $secondAnchor = $('<div></div>').appendTo('body');
    });

    afterEach(function() {
      $secondAnchor.remove();
    });
    
    it("should not register itself by default", function() {
      spyOn(Attache, 'registerGroupMember');
      
      attache = new Attache($anchor.get(0));
      
      expect(Attache.registerGroupMember).wasNotCalled();
    });
    
    it("should not emit group events when not part of a group", function() {
      spyOn(Attache, 'notifyGroupMembers');
      
      attache = new Attache($anchor.get(0));
      attache.show();
      
      expect(Attache.notifyGroupMembers).wasNotCalled();
    });
    
    it("should register its group affiliation when the 'group' option is set", function() {
      spyOn(Attache, 'registerGroupMember').andCallThrough();
      
      attache = new Attache($anchor.get(0), {group: 'test'});
      
      expect(Attache.registerGroupMember).toHaveBeenCalledWith(attache);
      expect(Attache.groups.test.length).toEqual(1);
    });
    
    it("should remove itself from its group when destroyed", function() {
      spyOn(Attache, 'unregisterGroupMember').andCallThrough();
      
      attache = new Attache($anchor.get(0), {group: 'test'});
      
      attache.destroy();
      
      expect(Attache.unregisterGroupMember).toHaveBeenCalledWith(attache);
      expect(Attache.groups.test.length).toEqual(0);
    });
    
    it("should trigger group callbacks on beforeShow", function() {
      spyOn(Attache, 'notifyGroupMembers').andCallThrough();
      
      attache = new Attache($anchor.get(0), {group: 'test'});
      
      attache.show();
      
      expect(Attache.notifyGroupMembers).toHaveBeenCalledWith('beforeShow', attache);
    });
    
    it("group members should receive callback triggers", function() {
      var secondGroupMember;

      attache           = new Attache($anchor.get(0), {group: 'test'});
      secondGroupMember = new Attache($secondAnchor.get(0), {group: 'test'});

      spyOn(secondGroupMember, 'executeGroupCallbacksFor');
      
      attache.show();
      
      expect(secondGroupMember.executeGroupCallbacksFor).toHaveBeenCalledWith('beforeShow', attache);
    });
    
    it("instances should not receive callback triggers for events they triggered themselves", function() {
      var secondGroupMember;

      attache           = new Attache($anchor.get(0), {group: 'test'});
      secondGroupMember = new Attache($secondAnchor.get(0), {group: 'test'});

      spyOn(attache, 'executeGroupCallbacksFor');
      
      attache.show();
      
      expect(attache.executeGroupCallbacksFor).wasNotCalled();
    });
  });

  describe("when positioned", function() {

    beforeEach(function() {
      var popoverIsVisible = false;

      runs(function() {
        attache = new Attache($anchor.get(0), { popoverClass: 'popover-positiontest'});
        attache.addCallback('afterShow', function() { popoverIsVisible = true; });
        attache.show();
      });

      waitsFor(function() {
        return attache.popover().hasClass('active');
      }, "Attache should have become active", 100);
    });

    afterEach(function() {
      attache.destroy();
    });

    it("should be at position x:310 y:140 when set to 'right top'", function() {
      attache.positionPopover('right top');

      expect(attache.popover().offset().left).toEqual(310);
      expect(attache.popover().offset().top).toEqual(140);
    });

    it("should be at position x:310 y:225 when set to 'right center'", function() {
      attache.positionPopover('right center');

      expect(attache.popover().offset().left).toEqual(310);
      expect(attache.popover().offset().top).toEqual(225);
    });

    it("should be at position x:310 y:310 when set to 'right bottom'", function() {
      attache.positionPopover('right bottom');

      expect(attache.popover().offset().left).toEqual(310);
      expect(attache.popover().offset().top).toEqual(310);
    });

    it("should be at position x:225 y:140 when set to 'center top'", function() {
      attache.positionPopover('center top');

      expect(attache.popover().offset().left).toEqual(225);
      expect(attache.popover().offset().top).toEqual(140);
    });

    it("should be at position x:225 y:225 when set to 'center center'", function() {
      attache.positionPopover('center center');

      expect(attache.popover().offset().left).toEqual(225);
      expect(attache.popover().offset().top).toEqual(225);
    });

    it("should be at position x:225 y:310 when set to 'center bottom'", function() {
      attache.positionPopover('center bottom');

      expect(attache.popover().offset().left).toEqual(225);
      expect(attache.popover().offset().top).toEqual(310);
    });

    it("should be at position x:140 y:140 when set to 'left top'", function() {
      attache.positionPopover('left top');

      expect(attache.popover().offset().left).toEqual(140);
      expect(attache.popover().offset().top).toEqual(140);
    });

    it("should be at position x:140 y:225 when set to 'left center'", function() {
      attache.positionPopover('left center');

      expect(attache.popover().offset().left).toEqual(140);
      expect(attache.popover().offset().top).toEqual(225);
    });

    it("should be at position x:140 y:310 when set to 'left bottom'", function() {
      attache.positionPopover('left bottom');

      expect(attache.popover().offset().left).toEqual(140);
      expect(attache.popover().offset().top).toEqual(310);
    });
  });
});