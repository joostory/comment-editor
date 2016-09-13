var Mentions = require("./Mentions").default;
var util = require("./Util").default;
var KEY = require("./KeyConstants").default;
var $ = require("jquery");

exports.default = function(field, options) {
  var $field = $(field),
    _options = options || {},
    $editor,
    $placeholder,
    _maxLength,
    _mentions = null;

  var initMentions = function(mentions) {
    if ($editor) {
      if (_mentions) {
        _mentions.view().remove();
      }
      _mentions = Mentions(mentions, addMentionView);
      $field.parent().parent().append(_mentions.view());
      _mentions.hide();
    }
  };

  var addMention = function(mention, isDefault) {
    if ($editor) {
      if (_mentions) {
        _mentions.add(mention, isDefault);
      }
    }
  };

  var init = function() {
    if (typeof window.getSelection == "undefined") {
      return;
    }

    var mentions = _options.mentions || [],
      value = _options.value || $field.val();

    _maxLength = _options.maxLength || $field.attr("maxlength") || 1000;

    $editor = $("<div contenteditable></div>");
    $editor.html(makeHtml(value));
    $editor.attr("class", $field.attr("class"));
    $editor.insertBefore($field);

    $placeholder = $("<div class='editor_placeholder'></div>");
    $placeholder.html($field.attr("placeholder"));
    $placeholder.insertBefore($field);
    resetPlaceHolder();

    $field.hide();

    initMentions(mentions);

    $editor.on('paste', onPaste);
    $editor.on('drop', onDrop);
    $editor.on('keyup', onKeyUp);
    $editor.on('keydown', onKeyDown);
  };

  var reset = function() {
    if ($editor) {
      $editor.html("");
      resetPlaceHolder();
    } else {
      $field.val("");
    }
  };

  var resetPlaceHolder = function() {
    if ($editor.text().length > 0) {
      $placeholder.hide();
    } else {
      $placeholder.show();
    }
  };

  var focus = function() {
    if ($editor) {
      $editor.focus();
    } else {
      $field.focus();
    }
  };

  var addMentionView = function(mention) {
    if (mention) {
      util.selectMention();
      util.insertNodeOverSelection($("<span class='_mention' data-id='" + mention.userId + "'>@" + mention.userName + "</span>")[0], $editor);
    }
  };

  // data에 해당하는 mention list를 가져와야한다.
  var searchMention = function(data) {
    if (data.index < 0) {
      _mentions.hide();
      return;
    }

    var word = data.data,
      addedCollection = {},
      mentionOptions;

    $editor.find("span[data-id]").each(function() {
      var elm = $(this);
      addedCollection[elm.data("id")] = elm.text();
    });

    if (_options.floatMention) {
      mentionOptions = {
        x: data.x,
        y: data.y + 20
      };
    }

    _mentions.search(word, addedCollection, mentionOptions);
  };


  var getValue = function() {
    if ($editor) {
      return _getTextValue($editor);
    } else {
      return $field.val();
    }
  };

  var _getTextValue = function(dom) {
    var i, node, prevNode,
      id, values = [],
      contents = $(dom).contents();

    var isGroupNode = function(n) {
      return n && (n.nodeName == "DIV" || n.nodeName == "P")
    };

    var isNewLineNode = function(n) {
      return n && (n.nodeName == "BR")
    };

    if (isGroupNode(dom) && contents.length == 1 && isNewLineNode(contents[0])) {
      return "";
    }

    for (i = 0; i < contents.length; i++) {
      node = contents[i];

      if (node.nodeType == Node.TEXT_NODE) {
        values.push(node.data);
        continue;
      }

      id = $(node).data("id");
      if (id) {
        values.push("@[" + id + "]");
        continue;
      }

      if (i != 0 && isGroupNode(node) && !isGroupNode(prevNode)) {
        values.push("\n");
      }
      values.push(_getTextValue(node));
      if (isGroupNode(node) || isNewLineNode(node)) {
        values.push("\n");
      }
      prevNode = node;
    }
    return values.join("");
  };

  var getAddedMentions = function() {
    var added = [];
    if ($editor) {
      $editor.find("span[data-id]").each(function() {
        var elm = $(this);
        added.push({
          id: elm.data("id"),
          name: elm.text()
        });
      });
    }
    return added;
  };

  var makeHtml = function(value) {
    return value.replace(/@\[([^\]]+):([^\]]+)\]/g, "<span class='_mention' data-id='$1'>@$2</span>").replace(/\\/g, "");
  };


  // event
  var onPaste = function(e) {
    e.preventDefault();

    var content,
      remainLength = length = _maxLength - getValue().length;

    if ((e.originalEvent || e).clipboardData) {
      content = (e.originalEvent || e).clipboardData.getData('text/plain');
      content = content.substring(0, remainLength);
      document.execCommand('insertText', false, content);
    } else if (window.clipboardData) {
      content = window.clipboardData.getData('Text');
      content = content.substring(0, remainLength);
      document.selection.createRange().pasteHTML(content);
    }
  };

  var onDrop = function(e) {
    e.preventDefault();
    return false;
  };

  var onKeyUp = function(e) {
    switch (e.keyCode) {
      case KEY.ESC:
      case KEY.UP:
      case KEY.DOWN:
      case KEY.TAB:
      case KEY.RETURN:
        return;
    }
    searchMention(util.findMentionTrigger($editor));
    resetPlaceHolder();
  };

  var onKeyDown = function(e) {
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    switch (e.keyCode) {
      case KEY.ESC:
        if (_mentions.isVisible()) {
          _mentions.hide();
          e.preventDefault();
        }
        return;
      case KEY.UP:
        if (_mentions.isVisible()) {
          _mentions.prev();
          e.preventDefault();
        }
        return;
      case KEY.DOWN:
      case KEY.TAB:
        if (_mentions.isVisible()) {
          _mentions.next();
          e.preventDefault();
        }
        return;
      case KEY.RETURN:
        if (_mentions.isVisible()) {
          _mentions.select();
          e.preventDefault();
          return;
        }
        break;
      case KEY.LEFT:
      case KEY.RIGHT:
      case KEY.HOME:
      case KEY.END:
      case KEY.PAGEUP:
      case KEY.PAGEDOWN:
        return;
    }

    var length = getValue().length;
    if (length > _maxLength) {
      e.preventDefault();
      return;
    }

    var node = window.getSelection().anchorNode;
    node = (node.nodeType == 3) ? node.parentNode : node;

    if (node.tagName == "SPAN") {
      switch (e.keyCode) {
        case KEY.BACKSPACE:
        case KEY.DELETE:
          e.preventDefault();
          $(node).remove();
          return;
      }

      var pos = util.getCaretPosition(node);
      if (pos == 0) {
        util.moveCaretBefore(node);
      } else {
        util.moveCaretAfter(node);
      }
    }

  };


  // main
  init();

  return {
    value: function() {
      return getValue();
    },
    mentions: function() {
      return getAddedMentions();
    },
    initMentions: function(mentions) {
      initMentions(mentions);
    },
    addMention: function(mention, isDefault) {
      addMention(mention, isDefault);
    },
    reset: function() {
      reset();
    },
    focus: function() {
      focus();
    }
  }
};
