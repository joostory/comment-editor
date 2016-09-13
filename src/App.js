var $ = require('jquery');
var Editor = require("./Editor").default;

$.fn.editor = function(options) {
  if (!this.is('textarea')) {
    $.error("not textarea");
  }

  if (this.length > 0) {
    return $.data(this[0], "editor") || $.data(this[0], "editor", Editor(this, options));
  }
};
