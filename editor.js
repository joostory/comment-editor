(function($) {

	var KEY = {
		BACKSPACE : 8,
		DELETE: 46,
		TAB : 9,
		RETURN : 13,
		ESC : 27,
		COMMA : 188,
		SPACE : 32,
		PAGEUP: 33,
		PAGEDOWN: 34,
		END : 35,
		HOME : 36,
		LEFT : 37,
		UP : 38,
		RIGHT : 39,
		DOWN : 40
	}; // Keys "enum"

	var findMentionTrigger = function() {
		var doc = document,
			win = doc.defaultView || doc.parentWindow,
			sel, range, cloneRange, node, text = "";

		if (typeof win.getSelection != "undefined") {
			sel = win.getSelection();
			range = sel.getRangeAt(0);
			cloneRange = range.cloneRange();
			node = range.endContainer;

			cloneRange.selectNodeContents(range.endContainer);
			while (node.previousSibling != null && node.previousSibling.nodeType == 3) {
				node = node.previousSibling;
			}
			cloneRange.setStart(node, 0);
			var lastIndex = node.data.search(/\s/);
			if (lastIndex < 0 || lastIndex < range.endOffset) {
				lastIndex = node.data.length;
			}
			if (lastIndex > range.endOffset) {
				cloneRange.setEnd(range.endContainer, lastIndex);
			} else {
				cloneRange.setEnd(range.endContainer, range.endOffset);
			}

			text = cloneRange.toString();
		} else if ( (sel = doc.selection) && sel.type != "Control") {
			var textRange = sel.createRange();
			var preCaretTextRange = doc.body.createTextRange();
			preCaretTextRange.moveToElementText(element);
			preCaretTextRange.setEndPoint("EndToEnd", textRange);
			text = preCaretTextRange.text;
		}

		var triggerIndex = text.lastIndexOf('@');
		if (triggerIndex < 0) {
			return "";
		} else {
			return text.slice(triggerIndex+1, text.length);
		}
	}

	var selectMention = function() {
		var doc = document,
		win = doc.defaultView || doc.parentWindow,
		sel, range, cloneRange, node;

		if (typeof win.getSelection != "undefined") {
			sel = win.getSelection();
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
		} else if ( (sel = doc.selection) && sel.type != "Control") {
			var textRange = sel.createRange();
			var preCaretTextRange = doc.body.createTextRange();
			preCaretTextRange.moveToElementText(element);
			preCaretTextRange.setEndPoint("EndToEnd", textRange);
			preCaretTextRange.select();
		}
	}

	var getCaretPosition = function(element) {
		var caretOffset = 0;
		var doc = element.ownerDocument || element.document;
		var win = doc.defaultView || doc.parentWindow;
		var sel;
		if (typeof win.getSelection != "undefined") {
			sel = win.getSelection();
			if (sel.rangeCount > 0) {
				var range = win.getSelection().getRangeAt(0);
				var preCaretRange = range.cloneRange();
				preCaretRange.selectNodeContents(element);
				preCaretRange.setEnd(range.endContainer, range.endOffset);
				caretOffset = preCaretRange.toString().length;
			}
		} else if ( (sel = doc.selection) && sel.type != "Control") {
			var textRange = sel.createRange();
			var preCaretTextRange = doc.body.createTextRange();
			preCaretTextRange.moveToElementText(element);
			preCaretTextRange.setEndPoint("EndToEnd", textRange);
			caretOffset = preCaretTextRange.text.length;
		}
		return caretOffset;
	}

	var moveCaret = function(node, isStart){
		var sel, range;
		if (window.getSelection) {
			range = document.createRange();
			range.selectNodeContents(node);
			if (isStart) {
				range.setStart(node, 0);
				range.setEnd(node, 0);
			}
			range.collapse(false);
			sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		} else if (document.selection) {
			range = document.body.createTextRange();
			range.moveToElementText(node);
			range.collapse(false);
			range.select();
		}
	};

	var moveCaretBefore = function(node) {
		var focusNode = document.createTextNode(" ");
		$(focusNode).insertBefore(node);
		moveCaret(focusNode, true);
	};

	var moveCaretAfter = function (node) {
		var focusNode = document.createTextNode(" ");
		$(focusNode).insertAfter(node);
		moveCaret(focusNode, false);
	};

	var insertNodeOverSelection = function(node, containerNode) {
		var sel, range, html;
		if (window.getSelection) {
			sel = window.getSelection();
			if (sel.getRangeAt && sel.rangeCount) {
				range = sel.getRangeAt(0);

				if ($.contains(containerNode[0], range.commonAncestorContainer)) {
					range.deleteContents();
					range.insertNode(node);
				} else {
					containerNode.append(node);
				}
			}
		} else if (document.selection && document.selection.createRange) {
			range = document.selection.createRange();
			if ($.contains(containerNode[0], range.parentElement())) {
				html = (node.nodeType == 3) ? node.data : node.outerHTML;
				range.pasteHTML(html);
			} else {
				containerNode.append(node);
			}
		}

		moveCaretAfter(node);
	};

	var Mentions = function(mentions, callback) {
		var _mentionListView = $("<ul class='_mention_list'></ul>"),
			_searchedMentionViews = [],
			_mentions = mentions,
			_callback = callback,
			_mentionsCollection = {},
			_selected = 0;

		var init = function() {
			var i, data;
			for (i = 0 ; i < _mentions.length ; i++) {
				data = _mentions[i];
				data.jaso = data.name.jaso();
				_mentionsCollection[data.id] = data;
			}

			_mentionListView.delegate("li", "mousedown", onMentionListClick);
		};

		var makeView = function(data) {
			var view = $("<li><img src='" + data.imageUrl + "'><span class='text'>" + data.name + "</span></li>");
			view.data("id", data.id);
			return view;
		};

		var selectNext = function() {
			if (_searchedMentionViews.length > _selected + 1) {
				selectItem(_selected + 1);
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

		var search = function(word, addedCollection) {
			if (!word || word.length == 0) {
				hideList();
				return;
			}

			var i,mention,result=[],jaso = word.jaso();
			for (var i = 0 ; i < _mentions.length ; i++) {
				mention = _mentions[i];
				if (!addedCollection[mention.id]
					 && (mention.name.indexOf(word) > -1 || mention.jaso.indexOf(jaso) > -1)) {
					result.push(mention);
				}
			}

			if (result.length > 0) {
				showList(result);
			} else {
				hideList();
			}

		};

		var showList = function(result) {
			var i, view;
			_mentionListView.empty();
			_searchedMentionViews = [];
			for (i = 0 ; i < result.length ; i++) {
				view = makeView(result[i]);
				_mentionListView.append(view);
				_searchedMentionViews.push(view);
			}

			selectItem(0);
			_mentionListView.show();
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
			_mentionListView.hide();
			_mentionListView.empty();
		};


		var onMentionListClick = function(e) {
			var elm = $(e.target);
			_callback(_mentionsCollection[elm.data('id')]);
		};

		init();

		return {
			view: function() {
				return _mentionListView;
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
				return $.expr.filters.visible(_mentionListView[0]);
			},
			hide: function() {
				hideList();
			},
			search: function(word, addedCollection) {
				search(word, addedCollection || {});
			}
		};
	};


	var Editor = function(field, options) {
		var _field = $(field),
			_options = options,
			_editor = $("<div contenteditable></div>"),
			_mentions;

		var init = function() {
			var mentions = _options.mentions? _options.mentions:[],
			value = _options.value? _options.value:"";
			_mentions = new Mentions(mentions, addMention);

			_editor.html(makeHtml(value));
			_editor.attr("class", _field.attr("class"));
			_editor.insertBefore(_field);
			_mentions.view().insertAfter(_field);
			_mentions.hide();
			_field.hide();

			_editor.on('paste', onPaste);
			_editor.on('keyup', onKeyUp);
			_editor.on('keydown', onKeyDown);
		};

		var addMention = function(mention) {
			if (mention) {
				selectMention();
				insertNodeOverSelection($("<span class='_mention' data-id='" + mention.id + "'>" + mention.name + "</span>")[0], _editor);
			}
		};

		// data에 해당하는 mention list를 가져와야한다.
		var searchMention = function(data) {
			var addedCollection = {};
			_editor.children("span[data-id]").each(function() {
				var elm = $(this);
				addedCollection[elm.data("id")] = elm.text();
			});

			_mentions.search(data, addedCollection);
		};


		var getValue = function() {
			var value = [];
			_editor.contents().each(function() {
				var elm = $(this), data = elm.data("id"), text = elm.text();
				text = text.replace(/\[/g, '\\\[').replace(/\]/g, '\\\]');

				if (data) {
					value.push("@[" + data + ":" + text + "]")
				} else {
					value.push(text);
				}
			});
			return value.join("");
		};

		var getAddedMentions = function() {
			var added = [];
			_editor.children("span[data-id]").each(function() {
				var elm = $(this);
				added.push({id:elm.data("id"), name:elm.text()});
			});
			return added;
		};

		var makeHtml = function(value) {
			return value.replace(/@\[([^\]]+):([^\]]+)\]/g, "<span class='_mention' data-id='$1'>$2</span>").replace(/\\/g, "");
		};


		// event
		var onPaste = function(e) {
			e.preventDefault();

			if ((e.originalEvent || e).clipboardData) {
				var content = (e.originalEvent || e).clipboardData.getData('text/plain');
				document.execCommand('insertText', false, content);
			} else if (window.clipboardData) {
				var content = window.clipboardData.getData('Text');
				document.selection.createRange().pasteHTML(content);
			}
		};

		var onKeyUp = function(e) {
			if (_mentions.isVisible()) {
				switch (e.keyCode) {
					case KEY.ESC:
						_mentions.hide();
						return;
					case KEY.UP:
						_mentions.prev();
						return;
					case KEY.DOWN:
					case KEY.TAB:
						_mentions.next();
						return;
					case KEY.RETURN:
						_mentions.select();
						return;
				}
			}

			searchMention(findMentionTrigger());
		};

		//
		var onKeyDown = function(e) {
			switch (e.keyCode) {
				case KEY.ESC:
				case KEY.UP:
				case KEY.DOWN:
				case KEY.TAB:
				case KEY.RETURN:
					if (_mentions.isVisible()) {
						e.preventDefault();
					}
				case KEY.LEFT:
				case KEY.RIGHT:
				case KEY.HOME:
				case KEY.END:
				case KEY.PAGEUP:
				case KEY.PAGEDOWN:
					return;
			}

			if (!window.getSelection) {
				return;
			}
			var node = window.getSelection().anchorNode;
			node = (node.nodeType == 3)? node.parentNode:node;

			if (node.tagName == "SPAN") {
				switch (e.keyCode) {
					case KEY.BACKSPACE:
					case KEY.DELETE:
						e.preventDefault();
						$(node).remove();
						return;
				}

				var pos = getCaretPosition(node);
				if (pos == 0) {
					moveCaretBefore(node);
				} else {
					moveCaretAfter(node);
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
			}
		}
	}

	$.fn.editor = function(options) {
		if (!this.is('textarea')) {
			$.error("undefined");
		}

		if (this.length > 0) {
			return $.data(this[0], "editor") || $.data(this[0], "editor", new Editor(this, options));
		}
	};

})(jQuery);
