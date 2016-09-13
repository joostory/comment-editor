var jaso = require("./jaso").default;

exports.default = {
  findMentionTrigger: function($editor) {
    var doc = document,
      win = doc.defaultView || doc.parentWindow,
      sel = win.getSelection(),
      range, cloneRange, node, text = "",
      rects, rect, x = 0,
      y = 0;

    range = sel.getRangeAt(0);
    cloneRange = range.cloneRange();
    node = range.endContainer;

    cloneRange.selectNodeContents(range.endContainer);
    while (node != $editor && node.previousSibling != null && node.previousSibling.nodeType == 3) {
      console.log(node, node.previousSibling);
      node = node.previousSibling;
    }
    cloneRange.setStart(node, 0);
    if (node.data) {
      var lastIndex = node.data.search(/\s/);
      if (lastIndex < 0 || lastIndex < range.endOffset) {
        lastIndex = node.data.length;
      }
      if (lastIndex > range.endOffset) {
        cloneRange.setEnd(node, lastIndex);
      } else {
        cloneRange.setEnd(range.endContainer, range.endOffset);
      }
    }

    text = cloneRange.toString();

    var triggerIndex = text.lastIndexOf('@');
    if (triggerIndex < 0) {
      return {
        index: triggerIndex
      };
    } else {

      cloneRange.setStart(node, triggerIndex);
      cloneRange.collapse(true);
      rects = cloneRange.getClientRects();
      if (rects.length > 0) {
        rect = cloneRange.getClientRects()[0];
        x = rect.left + win.pageXOffset;
        y = rect.top + win.pageYOffset;
      }
      return {
        index: triggerIndex,
        data: text.slice(triggerIndex + 1, text.length),
        x: x,
        y: y
      };
    }
  },
  selectMention: function() {
    var doc = document,
      win = doc.defaultView || doc.parentWindow,
      sel = win.getSelection(),
      range, cloneRange, node;

    range = sel.getRangeAt(0);
    cloneRange = range.cloneRange();
    node = range.endContainer;

    cloneRange.selectNodeContents(range.endContainer);
    while (node.previousSibling != null && node.previousSibling.nodeType == 3 && node.data.search(/@/) < 0) {
      node = node.previousSibling;
    }
    cloneRange.setStart(node, node.data.lastIndexOf("@", range.endOffset));
    var lastIndex = range.endContainer.data.search(/\s/);
    if (lastIndex < 0 || lastIndex < range.endOffset) {
      lastIndex = range.endContainer.data.length;
    }
    if (lastIndex > range.endOffset) {
      cloneRange.setEnd(range.endContainer, lastIndex);
    } else {
      cloneRange.setEnd(range.endContainer, range.endOffset);
    }
    sel.addRange(cloneRange);
  },
  getCaretPosition: function(element) {
    var caretOffset = 0,
      doc = element.ownerDocument || element.document,
      win = doc.defaultView || doc.parentWindow,
      sel = win.getSelection();

    if (sel.rangeCount > 0) {
      var range = sel.getRangeAt(0);
      var preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
  },
  moveCaret: function(node, isStart) {
    var sel = window.getSelection(),
      range = document.createRange();

    range.selectNodeContents(node);
    if (isStart) {
      range.setStart(node, 0);
      range.setEnd(node, 0);
    }
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  },
  moveCaretBefore: function(node) {
    var focusNode = document.createTextNode(" ");
    $(focusNode).insertBefore(node);
    this.moveCaret(focusNode, true);
  },
  moveCaretAfter: function(node) {
    var focusNode = document.createTextNode(" ");
    $(focusNode).insertAfter(node);
    this.moveCaret(focusNode, false);
  },
  insertNodeOverSelection: function(node, containerNode) {
    var sel = window.getSelection(), range;

    if (sel.getRangeAt && sel.rangeCount) {
      range = sel.getRangeAt(0);

      if ($.contains(containerNode[0], range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(node);
      } else {
        containerNode.append(node);
      }
    }

    this.moveCaretAfter(node);
  },
  getParentPosition: function(dom) {
    var $dom = $(dom),
      pos, x = 0,
      y = 0;

    if (!$dom.is($dom.offsetParent())) {
      $dom = $dom.offsetParent();
      pos = $dom.offset();
      x += pos.left;
      y += pos.top;
    }

    return {
      x: x,
      y: y
    };
  },
  trim: function(str) {
    if (str.trim) {
      return str.trim();
    } else {
      return str.replace(/^\s+|\s+$/g, '');
    }
  },
  jaso: function(str) {
    return jaso(str);
  }
};
