var util = require("./Util").default;

exports.default = function(mentions, callback) {
  var $mentionListView = $("<ul class='_mention_list'></ul>"),
    _searchedMentionViews = [],
    _defaultMentions = [],
    _defaultMentionsCollection = {},
    _mentions = mentions || [],
    _mentionsCollection = {},
    _callback = callback,
    _selected = 0;

  var init = function() {
    var i, data;
    for (i = 0; i < _mentions.length; i++) {
      data = _mentions[i];
      data.jaso = util.jaso(data.userName);
      _mentionsCollection[data.userId] = data;
    }

    $mentionListView.on("mousedown", onMentionListClick);
    $mentionListView.delegate("li", "mouseover", onMentionSelect);
  };

  var add = function(mention, isDefault) {
    if (!_mentionsCollection[mention.userId]) {
      mention.jaso = util.jaso(mention.userName);
      _mentions.push(mention);
      _mentionsCollection[mention.userId] = mention;
    }

    if (isDefault && !_defaultMentionsCollection[mention.userId]) {
      _defaultMentions.push(mention);
      _defaultMentionsCollection[mention.userId] = mention;
    }
  };

  var makeView = function(data) {
    var view = $("<li><span class='comment_profile'><img class='image' src='" + data.userImage + "'></span><span class='text'>" + data.userName + "</span></li>");
    view.data("id", data.userId);
    return view;
  };

  var selectNext = function() {
    if (_searchedMentionViews.length > _selected + 1) {
      selectItem(_selected + 1);
    } else {
      selectItem(0);
    }
  };

  var selectPrev = function() {
    if (_selected - 1 >= 0) {
      selectItem(_selected - 1);
    }
  };

  var select = function() {
    if (_searchedMentionViews.length > _selected) {
      var elm = _searchedMentionViews[_selected];
      _callback(_mentionsCollection[elm.data('id')]);
    }
    hideList();
  };

  var search = function(word, addedCollection, options) {
    var i, mention, result = [];

    word = word ? util.trim(word) : "";

    if (!word || word.length == 0) {
      for (i = 0; i < _defaultMentions.length; i++) {
        mention = _defaultMentions[i];
        if (!addedCollection[mention.userId] &&
          (mention.userName.toUpperCase().indexOf(word.toUpperCase()) > -1 || mention.jaso.indexOf(jaso) > -1)) {
          result.push(mention);
        }
      }
    } else {
      var jaso = util.jaso(word);
      for (i = 0; i < _mentions.length; i++) {
        mention = _mentions[i];
        if (!addedCollection[mention.userId] &&
          (mention.userName.toUpperCase().indexOf(word.toUpperCase()) > -1 || mention.jaso.indexOf(jaso) > -1)) {
          result.push(mention);
        }
      }
    }

    if (result.length > 0) {
      showList(result, options);
    } else {
      hideList();
    }

  };

  var showList = function(result, options) {
    console.log(options);

    var i, view;
    $mentionListView.empty();
    _searchedMentionViews = [];
    for (i = 0; i < result.length; i++) {
      view = makeView(result[i]);
      $mentionListView.append(view);
      _searchedMentionViews.push(view);
    }

    selectItem(0);
    $mentionListView.show();

    if (options) {
      var parentPosition = util.getParentPosition($mentionListView),
        x = options.x - parentPosition.x,
        y = options.y - parentPosition.y;

      $mentionListView.css({
        "left": x + "px",
        "top": y + "px"
      });
    }
  };

  var selectItem = function(index) {
    if (_searchedMentionViews.length > index) {
      if (_searchedMentionViews.length > _selected) {
        _searchedMentionViews[_selected].removeClass("select");
      }

      _selected = index;
      _searchedMentionViews[index].addClass("select");
    }
  };

  var hideList = function() {
    _searchedMentionViews = [];
    $mentionListView.hide();
    $mentionListView.empty();
  };


  var onMentionListClick = function(e) {
    e.preventDefault();
    select();
  };

  var onMentionSelect = function(e) {
    selectItem($(this).index());
  };

  init();

  return {
    view: function() {
      return $mentionListView;
    },
    added: function() {
      return _addedList;
    },
    next: function() {
      selectNext();
    },
    prev: function() {
      selectPrev();
    },
    select: function() {
      select();
    },
    isVisible: function() {
      return $.expr.filters.visible($mentionListView[0]);
    },
    hide: function() {
      hideList();
    },
    search: function(word, addedCollection, options) {
      search(word, addedCollection || {}, options);
    },
    add: function(mention, isDefault) {
      add(mention, isDefault);
    }
  };
};
