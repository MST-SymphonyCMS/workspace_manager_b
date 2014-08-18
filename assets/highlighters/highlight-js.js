(function($) {
	var d = document;

	var COMMENT = 'JS_comment',
		STRING = 'JS_string',
		ESCAPE = 'JS_escape',
		NUMBER = 'JS_number',
		OBJECT_PART = 'JS_objectpart',
		KEYWORD1 = 'JS_keyword1',
		KEYWORD2 = 'JS_keyword2'

	var keywords1 = ('break case catch continue delete default do else eval for function if in '
		+ 'instanceof new return super switch this throw try typeof var while with').split(' ');
	var keywords2 = 'false null true undefined'.split(' ');
	var style_prefix = "JS_";

	var EOL = "\n", sgl_quote = "'", dbl_quote = "\"";
 		
	Symphony.Extensions.WorkspaceManager.highlighters['js'] = function(source_text) {
		if(source_text.length == 0) return null;

		var output = d.createElement('span');
		var match, match2, char1 = null,
			block,
			l;

		do {
			match = /[\"\']|\/[\/ \*]?|\.?[a-z_$][a-z0-9_$\[\]]*|\d+\.?\d*|\.\d+|$/i.exec(source_text);
			delimiter = match[0];
			char1 = delimiter.charAt(0);
			if(match.index > 0) {
				$(output).appendText(source_text.slice(0, match.index));
				source_text = source_text.slice(match.index);
			}
			//alert("Index = " + match.index + " ... Match = " + match[0])
			if(delimiter == "//") {
				match = /\n|$/.exec(source_text);
				l = match.index + match[0].length;
				$(output).appendSpan(COMMENT, source_text.slice(0, l));
				source_text = source_text.slice(l);
			}
			else if(delimiter == "/*") {
				match = /\*\/|$/.exec(source_text);
				l = match.index + match[0].length;
				$(output).appendSpan(COMMENT, source_text.slice(0, l));
				source_text = source_text.slice(l);
			}
			else if(delimiter == sgl_quote || delimiter == dbl_quote) {
				$(output).appendSpan(STRING, delimiter);
				source_text = source_text.slice(1);
				if(source_text.length > 0) {
					var regex = (delimiter == sgl_quote) ? /\'|\\[bfnOrtv\'\"\\]|$/ : /\"|\\[bfnOrtv\'\"\\]|$/;
					var finished = false;
					while(!finished) {
						match = regex.exec(source_text);
						if(match.index > 0) {
							$(output).appendSpan(STRING, source_text.slice(0, match.index));
							source_text = source_text.slice(match.index);
						}
						if(match[0] == delimiter) {
							$(output).appendSpan(STRING, delimiter);
							source_text = source_text.slice(1);
							finished = true;
						}
						else if(match[0] !== "") {
							$(output).appendSpan(ESCAPE, match[0]);
							source_text = source_text.slice(match[0].length);
						}
						else finished = true;
					}
				}
			}
			/*else if(delimiter == "/") {
				$(output).appendSpan('regexp_delimiter', delimiter);
				source_text = source_text.slice(1);
				if(source_text.length > 0) {
					var finished = false;
					while(!finished) {
						match = /\\\S|\/[gimy]{0,4}|$/.exec(source_text);
						if(match.index > 0) $(output).appendSpan('', source_text.slice(0, match.index));
						var m = match[0];
						if(m.charAt(0) == "/") {
							$(output).appendSpan('regexp_delimiter', m);
							finished = true;
						}
						else if(m.charAt(0) == "\\") {
							$(output).appendText(m);
						}
						source_text = source_text.slice(match.index + m.length);
					}
				}
			}*/
			else if(char1 == "." && delimiter.length > 1) {
				var char2 = delimiter.charAt(1);
				$(output).appendSpan((char2 >= "0" && char2 <= "9") ? NUMBER : OBJECT_PART, delimiter);
				source_text = source_text.slice(delimiter.length);
			}
			else if(char1 >= "0" && char1 <= "9") {
				$(output).appendSpan(NUMBER, delimiter);
				source_text = source_text.slice(delimiter.length);
			}
			else if(delimiter !== "") {
				var s = (delimiter.search(/[^a-z]/) == -1);
				if(s && keywords1.indexOf(delimiter) > -1) {
					$(output).appendSpan(KEYWORD1, delimiter);
				}
				else if(s && keywords2.indexOf(delimiter) > -1) {
					$(output).appendSpan(KEYWORD2, delimiter);
				}
				else {
					$(output).appendText(delimiter);
					//last_block_type = "variable";
				}
				source_text = source_text.slice(delimiter.length);
			}
		} while(source_text.length > 0);
		return output;
	}
})(window.jQuery);

//})(); //(jQuery.noConflict());
 
