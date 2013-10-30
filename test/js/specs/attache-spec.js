/*global Attache, describe, xdescribe, it, xit, beforeEach, afterEach, expect, runs, waitsFor, spyOn, spyOnEvent */

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

  it("should mark popover as active on show()", function() {
    attache = new Attache($anchor.get(0));
    attache.show();

    expect($('.attache-popover').hasClass('inactive')).toBeFalsy();
    expect($('.attache-popover').hasClass('active')).toBeTruthy();
  });

  it("should mark popover as inactive on hide()", function() {
    attache = new Attache($anchor.get(0));
    attache.show();

    attache.hide();

    expect($('.attache-popover').hasClass('active')).toBeFalsy();
    expect($('.attache-popover').hasClass('inactive')).toBeTruthy();
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

  describe("callbacks", function() {
    it("should trigger the afterShow callback after show()", function() {
      var callbackFired = false,
          callback      = function() { callbackFired = true; };
      attache = new Attache($anchor.get(0), {}, {afterShow: callback});
      attache.show();

      expect(callbackFired).toBeTruthy();
    });
  });

  describe("options", function() {
    it("should apply a provided CSS class to the popover", function() {
      attache = new Attache($anchor.get(0), { popoverClass: 'additional-class-test' });
      attache.show();

      expect(attache.popover().hasClass('additional-class-test')).toBeTruthy();
    });
  });

  describe("when positioned", function() {

    beforeEach(function() {
      attache = new Attache($anchor.get(0), { popoverClass: 'popover-positiontest'});
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

    it("should be at position x:200 y:140 when set to 'center top'", function() {
      attache.positionPopover('center top');

      expect(attache.popover().offset().left).toEqual(200);
      expect(attache.popover().offset().top).toEqual(140);
    });

    it("should be at position x:200 y:225 when set to 'center center'", function() {
      attache.positionPopover('center center');

      expect(attache.popover().offset().left).toEqual(200);
      expect(attache.popover().offset().top).toEqual(225);
    });

    it("should be at position x:200 y:200 when set to 'center bottom'", function() {
      attache.positionPopover('center bottom');

      expect(attache.popover().offset().left).toEqual(200);
      expect(attache.popover().offset().top).toEqual(310);
    });

    it("should be at position x:90 y:140 when set to 'left top'", function() {
      attache.positionPopover('left top');

      expect(attache.popover().offset().left).toEqual(90);
      expect(attache.popover().offset().top).toEqual(140);
    });

    it("should be at position x:90 y:225 when set to 'left center'", function() {
      attache.positionPopover('left center');

      expect(attache.popover().offset().left).toEqual(90);
      expect(attache.popover().offset().top).toEqual(225);
    });

    it("should be at position x:90 y:90 when set to 'left bottom'", function() {
      attache.positionPopover('left bottom');

      expect(attache.popover().offset().left).toEqual(90);
      expect(attache.popover().offset().top).toEqual(310);
    });
  });
});