(function($) {
	var d = document;

	// Functions will be placed here by highlighter modules.
	Symphony.Extensions['WorkspaceManager'] = {'highlighters': {}};

	// Functions for highlighter modules.

	$.fn.appendText = function(text) {
		this.each(function() {
			$(this).append(d.createTextNode(text));
		});
	};

	$.fn.appendSpan = function(class_name, text) {
		this.each(function() {
			var span = d.createElement('span');
			span.className = class_name;
			span.appendChild(d.createTextNode(text));
			$(this).append(span);
		});
	};
		
	var BODY,
		NOTIFIER,
		CONTEXT,
		SUBHEADING,
		CONTENTS,
		FORM,
		NAME_FIELD,
		TEXT_AREA,
		RESIZE_HANDLE,
		SAVING_POPUP;

	var replacement_actions = null;

	var workspace_url,
		editor_url,
		directory_url;

	var text_area;
		
	var last_key_code;
	var gutter_width = 34;
	var x_margin = 3,
		y_margin = 2;

	var in_workspace;
	var new_file,
		document_modified = false;

	var highlighter;

	var text_area,
		text_area_label;

	var ajax_submit;
	var editor_height = 580;

	var editor = {
		'outer': 'div.outer',
		'inner': 'div.inner',
		'panel_anchor': 'div.panel-anchor',
		'text_panel': 'div.text-panel code',
		'back_panel': 'div.back-panel code',
		'selection': 'span.selection',
		'line_numbers': 'div.line-numbers'
	}

	editor_resize = {
		'height': 580,
		'mouse_down': false,
		'pointer_y': null
	}

	/*
	 * Set editor up..
	 */

	$().ready(function() {
		if(window.getSelection() == undefined) return;

		BODY = Symphony.Elements.body;
		NOTIFIER = $(Symphony.Elements.header).find('div.notifier');
		SUBHEADING = $('#symphony-subheading');
		CONTENTS = Symphony.Elements.contents;
		FORM = (CONTENTS).find('form');
		NAME_FIELD = $(FORM).find('input[name="fields[name]"]');
		TEXT_AREA = $(FORM).find('textarea');
		SAVING_POPUP = $('#saving-popup');

		replacement_actions = $(FORM).find('div[data-replacement-actions="1"]').detach();
		if(replacement_actions.length == 0) replacement_actions = null;;

		in_workspace = $(BODY).is('#extension-workspace_manager_b-view');
		if(in_workspace) {
			directory_url = Symphony.Context.get('symphony')
			+ Symphony.Context.get('env')['page-namespace'] + '/' + $(FORM).find('input[name="fields[dir_path_encoded]"]').attr('value');
			setHighlighting();
		}
		else{
			highlighter = Symphony.Extensions.WorkspaceManager.highlighters['xsl'];
		}

		$(BODY).mousedown(function(event) {
			if($(editor.inner).hasClass('focus')) {
				$(editor.inner).removeClass('focus');
				if($(editor.selection).hasClass('caret')) {
					$(editor.selection).css('visibility', 'hidden');
				}
				//window.getSelection().removeAllRanges();
			}
		});

		$(BODY).mouseup(function(event) {
			editor_resize.mouse_down = false;
		});

		$(BODY).mouseleave(function(event) {
			editor_resize.mouse_down = false;
		});

		text_area = $('textarea.code')[0];
		text_area_label = $(text_area).parent();
		$(text_area)
			.addClass('hidden')
			.appendTo('#contents fieldset:first')
			.scrollTop(0)
			.keydown(function(event) {
				var key = event.which;
				last_key_code = key;

				// Allow tab insertion
				if(key == 9) {
					event.preventDefault();

					var start = text_area.selectionStart,
						end = text_area.selectionEnd,
						position = text_area.scrollTop;
					// Add tab
					text_area.value = text_area.value.substring(0, start) + "\t" + text_area.value.substring(end, text_area.value.length);
					text_area.selectionStart = start + 1;
					text_area.selectionEnd = start + 1;

					// Restore scroll position
					text_area.scrollTop = position;

					setTimeout(updateEditor, 2);
				}
				else if(event.metaKey || event.ctrlKey && key == 83) {
					event.preventDefault();
					$('input[name="action[save]"]').trigger('click');
				}
				else if(([8, 13, 32, 45, 46].indexOf(key) != -1) || (key >= 48 && key <= 90) || (key >= 163 && key <= 222)){
					//if(!$(body).hasClass('unsaved-changes')) $(body).addClass('unsaved-changes');
					/*if(!document_modified) {
						document_modified = true;
						breadcrumbs_filename.html(breadcrumbs_filename.html() + ' <small>↑</small>');
					}*/
					setTimeout(updateEditor, 2);
				}
				else if(key >= 33 && key <= 40) {
					setTimeout(positionEditorCaret, 1);
				}
			})
			.on('cut paste', function(event) {
				setTimeout(updateEditor, 1);
			});


		for(var key in editor) {
			var split_val = editor[key].split(".");
			editor[key] = d.createElement(split_val[0]);
			editor[key].className = "editor-" + split_val[1];
		}

		$(editor.inner)
			.scroll(function() {
				$(editor.line_numbers).scrollTop(editor.inner.scrollTop);
			})
			.mousedown(function(event) {
				if(!($(editor.inner).hasClass('focus'))) {
					$(editor.inner).addClass('focus');
					$(editor.selection).text(" ").css('visibility', 'visible');
					text_area.focus();
					positionEditorCaret();
				}
				//event.preventDefault();
				event.stopPropagation();
			});

		$(editor.text_panel)
			.mousedown(function(event) {
				if(!($(editor.inner).hasClass('focus'))) {
					$(editor.inner).addClass('focus');
					$(editor.selection).text(" ").css('visibility', 'visible');
				}
				event.stopPropagation();
			})
			.mouseup(function(event) {
				var s = window.getSelection().getRangeAt(0);
				text_area.selectionStart = (createRange(editor.text_panel, 0, s.startContainer, s.startOffset)).toString().length;
				text_area.selectionEnd = (createRange(editor.text_panel, 0, s.endContainer, s.endOffset)).toString().length;
				text_area.focus();
				positionEditorCaret();
				event.stopPropagation();
			});
		$(editor.panel_anchor)
			.append(editor.text_panel)
			.append(editor.back_panel);
		$(editor.inner)
			.append(editor.panel_anchor);
		$(editor.outer)
			.append(editor.inner)
			.append(editor.line_numbers)
			.css('height', editor_resize.height + 'px');

		RESIZE_HANDLE = $('<div class="resize-handle"></div>');

		$(text_area_label).detach();
		$('fieldset:first')
			.append('<p class="label">Body</p>')
			.append(editor.outer)
			.append(RESIZE_HANDLE);

		textToEditor();

			//if(!$(body).hasClass('unsaved-changes')) $(body).addClass('unsaved-changes');
			/*if(!document_modified) {
				document_modified = true;
				breadcrumbs_filename.html(breadcrumbs_filename.html() + ' <small>↑</small>');
			}*/

		$(NAME_FIELD).keydown(function(event) {
			if(event.which == 13) ajax_submit = true;
			event.stopPropagation();
		});

		$(FORM).click(function(event) {
			if(event.target.name == 'action[save]') ajax_submit = true;
			if(event.target.name == 'action[delete]') ajax_submit = false;
		});
				
		$(FORM).submit(function(event) {
			if(!ajax_submit) return;

			event.preventDefault();
			if($(NAME_FIELD).val() == '') return;
			$(SAVING_POPUP).show();
			$.ajax({
				'type': 'POST',
				'url': document.URL,
				//'data': submit_values,
				'data': $(FORM).serialize() + "&action%5Bsave%5D=1&ajax=1",
				'dataType': 'json',
				'error': function(xhr, msg, error){
					$('#saving-popup').hide();
					alert(error);
				},
				'success': function(data){
					$(SAVING_POPUP).hide();
					if(data.new_filename) {
						$('input[name="fields[existing_file]"]').val(data.new_filename);
						$(SUBHEADING).text(data.new_filename);
						history.replaceState({'a': 'b'}, '', directory_url + data.new_filename_encoded + '/');
					}
					if(replacement_actions) {
						$(FORM).find('div.actions').replaceWith(replacement_actions);
						replacement_actions = null;
					}
					$(NOTIFIER).trigger('attach.notify', [data.alert_msg, data.alert_type]);
					if(data.alert_type == 'error') window.scrollTop = 0;
				}
			});
		});
		
		$(RESIZE_HANDLE).mousedown(function(event) {
			editor_resize.mouse_down = true;
			editor_resize.pointer_y = event.pageY;
		});

		$(RESIZE_HANDLE).mousemove(function(event) {
			if(editor_resize.mouse_down == false) return;
								   //alert(editor_resize.pointer_y);
			editor_resize.height += event.pageY - editor_resize.pointer_y;
			editor_resize.pointer_y = event.pageY;
			editor.outer.style.height = editor_resize.height + 'px';
			editor.line_numbers.style.height = editor.inner.clientHeight + 'px';
		});

		$(RESIZE_HANDLE).mouseleave(function(event) {
			editor_resize.mouse_down = false;
		});

	});

	function setHighlighting(){
		if(!in_workspace) {
			highlighter = Symphony.Extensions.WorkspaceManager.highlighters['xsl'];
			return;
		}
		var filename = $(NAME_FIELD).val();
		if(filename != ""){
			var filename_split = filename.split(".");
			var ext = filename_split.pop();
			if(filename_split.length > 0) {
				highlighter = Symphony.Extensions.WorkspaceManager.highlighters[ext];
			}
		}
	}

	/*
	 * Create range.
	 */
	function createRange(start_node, start_offset, end_node, end_offset) {
		var range = d.createRange();
		range.setStart(start_node, start_offset);
		range.setEnd(end_node, end_offset);
		return range;
	}

	/*
	 * Write updated content to editor
	 */
	function updateEditor() {
		textToEditor();
		positionEditorCaret();
	}

	/*
	 * Fill editor with highlighted text..
	 */

 	function textToEditor() {
		setHighlighting();
		if(highlighter) {
			$(editor.text_panel)
			.empty()
			.append(highlighter(text_area.value));
		}
		else {
			$(editor.text_panel).text(text_area.value);
		}
		// Line numbers
		editor.line_numbers.height = editor.inner.clientHeight;

		var num_lines = text_area.value.split("\n").length;
		var l = '';
		for(i = 1; i < (num_lines + 1); i++){
			l += (i + "\n");
		}
		$(editor.line_numbers)
			.html(l + '<br>')
			.css('height', editor.inner.clientHeight + 'px');

		//$(editor.outer)
			//.width(editor.outer.clientWidth);
			//.css('width', editor.outer.clientWidth + 'px')
		$(editor.inner)
			.css('minWidth', editor.inner.clientWidth + 'px')
			//.css('minHeight', (editor.clientHeight - 4) + 'px');
		$(editor.text_panel)
			.css('minWidth', (editor.inner.clientWidth - 42) + 'px')
			.css('minHeight', (editor.inner.clientHeight - 4) + 'px');
		$(editor.back_panel)
			.css('minWidth', (editor.inner.clientWidth - 42) + 'px');
	}

	/*
	 * Caret.
	 */
	function positionEditorCaret() {
		var t = text_area.value.slice(0, text_area.selectionStart);
		var selected_text = text_area.value.slice(text_area.selectionStart, text_area.selectionEnd);
		if(selected_text == "") {
			editor.selection.className = 'caret blink';
			$(editor.selection).text(" ");
		}
		else {
			editor.selection.className = 'selection';
			$(editor.selection).text(selected_text);
		}
		$(editor.selection).css('visibility', 'visible');
		$(editor.back_panel)
			.empty()
			.append(d.createTextNode(t))
			.append(editor.selection);
		var pos = $(editor.selection).position();
		if(editor.inner.scrollTop > pos.top) editor.inner.scrollTop = pos.top - y_margin;
		var n = pos.top + editor.selection.clientHeight - editor.inner.clientHeight;
		if(n > editor.inner.scrollTop) editor.inner.scrollTop = n + y_margin;

		n = pos.left - x_margin;
		if(editor.inner.scrollLeft > n) editor.inner.scrollLeft = n;
		n = pos.left + x_margin + editor.selection.clientWidth - editor.inner.clientWidth + gutter_width;
		if(n > editor.inner.scrollLeft) editor.inner.scrollLeft = n;
	}

})(window.jQuery); //(jQuery.noConflict());