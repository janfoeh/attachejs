describe("Attache", function() {

  it("should do something", function() {
    expect(true).toBe(true);
  });

  describe("when positioned", function() {
    var $anchor,
        attache;

    beforeEach(function() {
      $anchor = $('<div></div>').css({position: 'absolute', left: 200, top: 200, width: 100, height: 100}).appendTo('body');
      attache = new Attache($anchor.get(0), { popoverClass: 'popover-positiontest'});
      attache.show();

      window.attache = attache
    });

    afterEach(function() {
      $anchor.remove();
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