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


    var util = {
        findMentionTrigger: function() {
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
                    cloneRange.setEnd(node, lastIndex);
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
        },
        selectMention: function() {
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
        },
        getCaretPosition: function(element) {
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
        },
        moveCaret: function(node, isStart){
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
        },
        moveCaretBefore: function(node) {
            var focusNode = document.createTextNode(" ");
            $(focusNode).insertBefore(node);
            util.moveCaret(focusNode, true);
        },
        moveCaretAfter: function (node) {
            var focusNode = document.createTextNode(" ");
            $(focusNode).insertAfter(node);
            util.moveCaret(focusNode, false);
        },
        insertNodeOverSelection: function(node, containerNode) {
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

            util.moveCaretAfter(node);
        }
    }

    var Mentions = function(mentions, callback) {
        var _mentionListView = $("<ul class='_mention_list'></ul>"),
            _searchedMentionViews = [],
            _mentions = mentions || [],
            _callback = callback,
            _mentionsCollection = {},
            _selected = 0;

        var init = function() {
            var i, data;
            for (i = 0 ; i < _mentions.length ; i++) {
                data = _mentions[i];
                data.jaso = data.userName.jaso();
                _mentionsCollection[data.userId] = data;
            }

            _mentionListView.on("mousedown", onMentionListClick);
            _mentionListView.delegate("li", "mouseover", onMentionSelect);
        };

		var add = function(mention) {
			var i, data;
			if (!_mentionsCollection[mention.userId]) {
				mention.jaso = mention.userName.jaso();
				_mentions.push(mention);
				_mentionsCollection[mention.userId] = mention;
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

        var search = function(word, addedCollection) {
            if (!word || word.length == 0) {
                hideList();
                return;
            }

            var i,mention,result=[],jaso = word.jaso();
            for (i = 0 ; i < _mentions.length ; i++) {
                mention = _mentions[i];
                if (!addedCollection[mention.userId]
                    && (mention.userName.toUpperCase().indexOf(word.toUpperCase()) > -1 || mention.jaso.indexOf(jaso) > -1)) {
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
            select();
        };

        var onMentionSelect = function(e) {
            selectItem($(this).index());
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
            },
			add: function(mention) {
				add(mention);
			}
        };
    };


    var Editor = function(field, options) {
        var _field = $(field),
            _options = options || {},
            _editor = $("<div contenteditable></div>"),
            _placeholder = $("<div class='editor_placeholder'></div>"),
            _mentions = null;

        var initMentions = function(mentions) {
            if (_mentions) {
                _mentions.view().remove();
            }
            _mentions = new Mentions(mentions, addMentionView);
            _mentions.view().insertAfter(_field);
            _mentions.hide();
        };

		var addMention = function(mention) {
			if (_mentions) {
				_mentions.add(mention);
			}
		};

        var init = function() {
            var mentions = _options.mentions? _options.mentions:[],
                value = _options.value? _options.value:_field.text();

            _editor.html(makeHtml(value));
            _editor.attr("class", _field.attr("class"));
            _editor.insertBefore(_field);

            _placeholder.html(_field.attr("placeholder"));
            _placeholder.insertBefore(_field);
            resetPlaceHolder();

            _field.hide();

            initMentions(mentions);

            _editor.on('paste', onPaste);
            _editor.on('drop', onDrop);
            _editor.on('keyup', onKeyUp);
            _editor.on('keydown', onKeyDown);
        };

        var reset = function() {
            _editor.html("");
            _field.val("");
            resetPlaceHolder();
        };

        var resetPlaceHolder = function() {
            if (_editor.text().length > 0) {
                _placeholder.hide();
            } else {
                _placeholder.show();
            }
        };

        var addMentionView = function(mention) {
            if (mention) {
                util.selectMention();
                util.insertNodeOverSelection($("<span class='_mention' data-id='" + mention.userId + "'>@" + mention.userName + "</span>")[0], _editor);
            }
        };

        // data에 해당하는 mention list를 가져와야한다.
        var searchMention = function(data) {
            var addedCollection = {};
            _editor.find("span[data-id]").each(function() {
                var elm = $(this);
                addedCollection[elm.data("id")] = elm.text();
            });

            _mentions.search(data, addedCollection);
        };


        var getValue = function() {
            return _getTextValue(_editor);
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

            for (i = 0 ; i < contents.length ; i++) {
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
            _editor.find("span[data-id]").each(function() {
                var elm = $(this);
                added.push({id:elm.data("id"), name:elm.text()});
            });
            return added;
        };

        var makeHtml = function(value) {
            return value.replace(/@\[([^\]]+):([^\]]+)\]/g, "<span class='_mention' data-id='$1'>@$2</span>").replace(/\\/g, "");
        };


        // event
        var onPaste = function(e) {
            e.preventDefault();

			var content;
            if ((e.originalEvent || e).clipboardData) {
                content = (e.originalEvent || e).clipboardData.getData('text/plain');
                document.execCommand('insertText', false, content);
            } else if (window.clipboardData) {
                content = window.clipboardData.getData('Text');
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
            searchMention(util.findMentionTrigger());
            resetPlaceHolder();
        };

        //
        var onKeyDown = function(e) {
            if (window.getSelection) {
                var n = window.getSelection().anchorNode;
                console.log("keyDown", n.nodeName, n.nodeType, n.parentNode.nodeName, n.parentNode.nodeType);
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
                    }
                    return;
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
			addMention: function(mention) {
				addMention(mention);
			},
            reset: function() {
                reset();
            },
            focus: function() {
                _editor.focus();
            }
        }
    };

    $.fn.editor = function(options) {
        if (!this.is('textarea')) {
            $.error("not textarea");
        }

        if (this.length > 0) {
            return $.data(this[0], "editor") || $.data(this[0], "editor", new Editor(this, options));
        }
    };

})(jQuery);
