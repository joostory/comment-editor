(function($) {

	function pasteHtmlAtCaret(html) {
		var sel, range;
		if (window.getSelection) {
			// IE9 and non-IE
			sel = window.getSelection();
			if (sel.getRangeAt && sel.rangeCount) {
				range = sel.getRangeAt(0);
				range.deleteContents();

				// Range.createContextualFragment() would be useful here but is
				// only relatively recently standardized and is not supported in
				// some browsers (IE9, for one)
				var el = document.createElement("div");
				el.innerHTML = html;
				var frag = document.createDocumentFragment(), node, lastNode;
				while ( (node = el.firstChild) ) {
					lastNode = frag.appendChild(node);
				}
				var firstNode = frag.firstChild;
				range.insertNode(frag);

				// Preserve the selection
				if (lastNode) {
					range = range.cloneRange();
					range.setStartAfter(lastNode);
					range.collapse(true);
					sel.removeAllRanges();
					sel.addRange(range);
				}
			}
		} else if ( (sel = document.selection) && sel.type != "Control") {
			// IE < 9
			var originalRange = sel.createRange();
			originalRange.collapse(true);
			sel.createRange().pasteHTML(html);
			if (selectPastedContent) {
				range = sel.createRange();
				range.setEndPoint("StartToStart", originalRange);
				range.select();
			}
		}
	}

	function getCaretPosition(editableDiv) {
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

	$('[contenteditable]').on('paste',function(e) {
		e.preventDefault();

		var text = (e.originalEvent || e).clipboardData.getData('text/plain');
		$this = $(this);
		pasteHtmlAtCaret(text, false);
	});


	var Editor = function(field, options) {
		var _field = $(field),
			_options = options;
		var _editor = $("<div contenteditable></div>"),
			_mentions = [];

		var init = function() {
			_editor.attr("class", _field.attr("class"));
			_editor.insertBefore(_field);
			_field.hide();

			_editor.on('paste', onPaste);
		}

		// event
		var onPaste = function(e) {
			e.preventDefault();

			var text = (e.originalEvent || e).clipboardData.getData('text/plain');
			pasteHtmlAtCaret(text, false);
			_editor.html(_editor.html());
		}


		// main
		init();

		return {
			value: function() {
				return _field.val();
			},
			mentions: function() {
				return _mentions;
			}
		}
	}

	$.fn.editor = function(options) {
		if (!this.is('textarea')) {
			$.error("undefined");
		}

		if (this.length > 0) {
			var dom = this[0];
			return $.data(this[0], "editor") || $.data(this, "editor", new Editor(this, options));
		}
	};

})(jQuery);
