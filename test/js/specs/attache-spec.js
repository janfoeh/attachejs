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

  it("should add CSS classes according to its position", function(done) {
    var popoverIsVisible = false;

    attache = new Attache($anchor.get(0), {position: "left center", popoverClass: 'transition-test'});
    
    attache.addCallback('afterShow', function() {
      expect(attache.popover().hasClass('horizontal-left')).toBeTruthy();
      expect(attache.popover().hasClass('vertical-center')).toBeTruthy();
      
      done();
    });
      
    attache.show();
  });

  it("should update the CSS classes when switching to alternative positions", function(done) {
    var popoverIsVisible = false;

    $anchor.css({left: '5px'});

    attache = new Attache($anchor.get(0), {position: "left center", alternativePositions: ["right center"], popoverClass: 'transition-test'});
    
    attache.addCallback('afterShow', function() {
      expect(attache.popover().hasClass('horizontal-left')).toBeFalsy();
      expect(attache.popover().hasClass('horizontal-right')).toBeTruthy();
      expect(attache.popover().hasClass('vertical-center')).toBeTruthy();
      
      done();
    });
    
    attache.show();
  });

  // Testing whether the visibility classes .activating, .active and .deactivating are applied
  // correctly is a little bit more involved. Both .activating and .deactivating are only applied
  // temporarily, so we attach a DOM mutation observer to see whether that happened.

  describe("visibility css classes lifecycle", function() {
    it("should add .activating and .active to the popover on show()", function(done) {
      var hasActivatingClass  = false,
          hasActiveClass      = false,
          classChangeCounter  = 0,
          popover,
          observer;

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
        
        if (classChangeCounter >= 2) {
          observer.disconnect();
          expect(hasActivatingClass).toBeTruthy();
          expect(hasActiveClass).toBeTruthy();
          
          done();
        }
      });

      attache.show();
    });

    it("should add .deactivating to the overlay on hide()", function(done) {
      var isActive  = false,
          popover,
          observer;

      attache = new Attache($anchor.get(0), {popoverClass: 'transition-test'});
      popover = attache.popover();
      
      observer = SpecHelper.onClassChange(popover, function(target){
        
        // first we wait for the tooltip activation transition to complete
        if (!isActive) {
          if (target.hasClass('active')) {
            isActive = true;
            attache.hide();
          }
          
          return;
        }

        if (isActive) {
          if (target.hasClass('deactivating')) {
            observer.disconnect();
            
            expect($('.attache-popover.transition-test').hasClass('active')).toBeFalsy();
            
            done();
          }
        }
      });
      
      attache.show();
    });

    it("should remove .deactivating on hide() after transitions are complete", function(done) {
      var isActive = false,
          popover,
          observer;

      attache = new Attache($anchor.get(0), {popoverClass: 'transition-test'});
      popover = attache.popover();
      
      setTimeout(function() {
        expect($('.attache-popover.transition-test').hasClass('deactivating')).toBeFalsy();
        done();
      }, 850);
      
      attache.show();
    });
  });

  describe("callbacks", function() {
    it("should trigger the afterCreate callback after create, before show()", function() {
      var popoverVisible  = true,
          callbackFired   = false,
          callback        = function(anchor, popover) { popoverVisible = popover.hasClass('active'); callbackFired = true; };

      attache = new Attache($anchor.get(0), {popoverClass: 'transition-test'}, {afterCreate: callback});
      attache.show();

      expect(callbackFired).toBeTruthy();
      expect(popoverVisible).toBeFalsy();
    });

    it("should trigger the afterShow callback after show()", function(done) {
      attache = new Attache($anchor.get(0), {popoverClass: 'transition-test'});
      
      attache.addCallback('afterShow', function() {
        done();
      });
      
      attache.show();
    });
    
    it("should trigger the afterHide callback after hide()", function(done) {
      attache = new Attache($anchor.get(0), {popoverClass: 'transition-test'});
      
      attache.addCallback('afterShow', function() {
        console.log('aftershow: hiding');
        attache.hide();
      });
      
      attache.show();
      
      attache.addCallback('afterHide', function() {
        console.log('afterHide: done');
        done();
      });
    });
  });

  describe("options", function() {
    var $secondAnchor;
    
    beforeEach(function() {
      $secondAnchor = $('<div></div>').appendTo('body');
    });

    afterEach(function() {
      $secondAnchor.remove();
    });
    
    it("should apply a provided CSS class to the popover", function() {
      attache = new Attache($anchor.get(0), { popoverClass: 'additional-class-test' });
      attache.show();

      expect(attache.popover().hasClass('additional-class-test')).toBeTruthy();
    });
    
    it("allowParallelUse: false should set a default group if none is present", function() {
      attache = new Attache($anchor.get(0), { allowParallelUse: false });

      expect(attache.options.group).toEqual('default');
    });
    
    it("allowParallelUse: false hides the popover when another group member opens", function() {
      var secondGroupMember;

      attache           = new Attache($anchor.get(0), { allowParallelUse: false });
      secondGroupMember = new Attache($secondAnchor.get(0), { allowParallelUse: false });

      spyOn(attache, 'hide');
      
      attache.show();
      secondGroupMember.show();
      
      expect(attache.hide).toHaveBeenCalled();
    });
    
    it("should remove the popover markup after hide with disposable: true", function(done) {
      $('.attache-popover').remove();
      
      attache = new Attache($anchor.get(0), { popoverClass: 'transition-test', disposable: true });
      
      attache.addCallback('afterShow', function() {
        attache.hide();
      });
      
      attache.addCallback('afterHide', function() {
        expect(attache.$popover).toBe(null);
        expect($('.attache-popover').length).toBe(0);
        done();
      });
      
      attache.show();
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
      
      expect(Attache.registerGroupMember).not.toHaveBeenCalled();
    });
    
    it("should not emit group events when not part of a group", function() {
      spyOn(Attache, 'notifyGroupMembers');
      
      attache = new Attache($anchor.get(0));
      attache.show();
      
      expect(Attache.notifyGroupMembers).not.toHaveBeenCalled();
    });
    
    it("should register its group affiliation when the 'group' option is set", function() {
      spyOn(Attache, 'registerGroupMember').and.callThrough();
      
      attache = new Attache($anchor.get(0), {group: 'test'});
      
      expect(Attache.registerGroupMember).toHaveBeenCalledWith(attache);
      expect(Attache.groups.test.length).toEqual(1);
    });
    
    it("should remove itself from its group when destroyed", function() {
      spyOn(Attache, 'unregisterGroupMember').and.callThrough();
      
      attache = new Attache($anchor.get(0), {group: 'test'});
      
      attache.destroy();
      
      expect(Attache.unregisterGroupMember).toHaveBeenCalledWith(attache);
      expect(Attache.groups.test.length).toEqual(0);
    });
    
    it("should trigger group callbacks on beforeShow", function() {
      spyOn(Attache, 'notifyGroupMembers').and.callThrough();
      
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
      
      expect(attache.executeGroupCallbacksFor).not.toHaveBeenCalled();
    });
  });

  describe("when positioned", function() {

    beforeEach(function(done) {
      attache = new Attache($anchor.get(0), { popoverClass: 'popover-positiontest', cssTransitionSupport: false });
      
      attache.addCallback('afterShow', function() {
        done();
      });
      
      attache.show();
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