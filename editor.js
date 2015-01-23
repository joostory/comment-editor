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

	var getCaretPosition = function(editableDiv) {
		var caretPos = 0,
		sel, range;
		if (window.getSelection) {
			sel = window.getSelection();
			if (sel.rangeCount) {
				range = sel.getRangeAt(0);
				if (range.commonAncestorContainer.parentNode == editableDiv) {
					caretPos = range.endOffset;
				}
			}
		} else if (document.selection && document.selection.createRange) {
			range = document.selection.createRange();
			if (range.parentElement() == editableDiv) {
				var tempEl = document.createElement("span");
				editableDiv.insertBefore(tempEl, editableDiv.firstChild);
				var tempRange = range.duplicate();
				tempRange.moveToElementText(tempEl);
				tempRange.setEndPoint("EndToEnd", range);
				caretPos = tempRange.text.length;
			}
		}
		return caretPos;
	}

	var moveCaret = function(node, isStart){
		var doc = document, sel, range;
		if (window.getSelection && doc.createRange) {
			range = doc.createRange();
			range.selectNodeContents(node);
			range.collapse(false);
			sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		} else if (doc.body.createTextRange) {
			range = doc.body.createTextRange();
			range.moveToElementText(node);
			range.select();
		}
	}

	var Editor = function(field, options) {
		var _field = $(field),
			_options = options,
			_editor = $("<div contenteditable></div>"),
			_mentions = [],
			savedRange;

		var init = function() {
			_editor.attr("class", _field.attr("class"));
			_editor.insertBefore(_field);
			_field.hide();

			_editor.on('paste', onPaste);
			_editor.on('keyup', onKeyUp);
			_editor.on('keydown', onKeyDown);
			_editor.on('blur', onBlur);
			_editor.on('focus', onFocus);
		};

		var addMention = function(mention) {
			_editor.focus();
			var pos = getCaretPosition(_editor);
			console.log("addMention", mention, pos);

			document.execCommand('insertHTML', false, "<span class='_mention' data-id='" + mention.id + "'>" + mention.name + "</span> ");
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
			var node;
			if (window.getSelection) {
				node = window.getSelection().anchorNode;
			} else {
				node = document.getSelection().anchorNode;
			}
			console.log("onKeyUp", node);
			node = (node.nodeType==3)? node.parentNode:node;

			switch(e.keyCode) {
				case KEY.BACKSPACE:
				case KEY.DELETE:
					// TODO 만약 text가 아니라면 node 삭제
					return;
			}

			if (node != this) {
				// TODO 아무것도 못하게!
				console.log(node, "not equals", this);
			} else {
				// TODO 서제스트
				console.log(getCaretPosition(this), e.target);
			}
		};

		//
		var onKeyDown = function(e) {
			console.log("keyCode", e.keyCode);

			switch (e.keyCode) {
				case KEY.UP:
				case KEY.DOWN:
				case KEY.LEFT:
				case KEY.RIGHT:
				case KEY.TAB:
				case KEY.HOME:
				case KEY.END:
				case KEY.PAGEUP:
				case KEY.PAGEDOWN:
					return;
			}

			var node;
			if (window.getSelection) {
				node = window.getSelection().anchorNode;
			} else {
				node = document.getSelection().anchorNode;
			};
			console.log("node", node);
			node = (node.nodeType == 3)? node.parentNode:node;
			console.log(node.nodeName, node.nodeType, node, node.tagName);

			if (node.tagName == "SPAN") {
				console.log(this);
				console.log("이건 metion", node.nodeName, node.nextSibling);

				switch (e.keyCode) {
					case KEY.BACKSPACE:
					case KEY.DELETE:
						e.preventDefault();
						$(node).remove();
						return;
				}

				var pos = getCaretPosition(node),
					focusNode = document.createTextNode(" ");
				if (pos == 0) {
					if (!node.previousSibling) {
						$(focusNode).insertBefore(node);
					} else {
						focusNode = node.previousSibling;
					}
				} else {
					if (!node.nextSibling) {
						$(focusNode).insertAfter(node);
					} else {
						focusNode = node.nextSibling;
					}
				}

				moveCaret(focusNode);
			}

		};

		var onBlur = function(e) {
			console.log("onBlur", savedRange);
			if(document.getSelection) {
				savedRange = document.getSelection().getRangeAt(0);
			} else if(document.selection) {
				savedRange = document.selection.createRange();
			}
		};

		var onFocus = function(e) {
			console.log("onFocus", savedRange);
			if (savedRange) {
				if (window.getSelection) {
					console.log("window.getSelection");
					var s = window.getSelection();
					if (s.rangeCount > 0) {
						s.removeAllRanges();
					}
					s.addRange(savedRange);
					e.preventDefault();
				} else if (document.createRange) {
					console.log("document.createRange");
					document.getSelection().addRange(savedRange);
				} else if (document.selection) {
					console.log("document.selection");
					savedRange.select();
				}
			}
		};

		// main
		init();

		return {
			value: function() {
				return _field.val();
			},
			mentions: function() {
				return _mentions;
			},
			addMention: function(mention) {
				addMention(mention);
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
