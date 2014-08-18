(function($) {
	var d = document;

	var regex = {
		'xsl_tag_name': /(^\<\/?)xsl:[\-a-zA-Z0-9]*/,
		'xsl_in_attr_val': /{[^}]*}/g,
		'xsl_variable': /\$[a-z][a-z0-9\-]*/ig,
		'string_in_xsl_attr_val': /\'[^\']*\'/g,
		'number_in_xsl_attr_val': /[0-9]+/g,
		'xml_tag_name': /(^\<\/?)[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z0-9\-]*/,
		'html_tag_name': /^\<\/?[a-zA-Z]+[a-zA-Z0-9]?/,
		'amp': /\&([a-zA-Z]+|#[0-9]+)\;/g,
	}

	var substyling = [
	{
		'xsl_attr_val': 'string_in_xsl_attr_val',
		'attr_val': 'xsl_in_attr_val',
		'text': 'amp',
	},
	{
		'xsl_attr_val': 'xsl_variable',
		'xsl_in_attr_val': 'xsl_variable',
		'string_in_xsl_attr_val': 'xsl_variable'
	},
	{
		'xsl_attr_val': 'amp',
		'string_in_xsl_attr_val': 'amp',
		'xsl_in_attr_val': 'string_in_xsl_attr_val'
	}
	];

	var style_prefix = 'XSL_';
 
	var EOL = "\n", sgl_quote = "'", dbl_quote = "\"";

	Symphony.Extensions.WorkspaceManager.highlighters['xsl'] = function(source_text) {
		if(source_text.length == 0) return null;

		var array_in = source_text.split(EOL);
		var in_tag = false,
			tag_type,
			closing_tag = false,
			in_value = false,
			value_type,
			value_first_line = false;
		var last_attr_name = null;
		var part_length, part_type, delimiter_index, value_delimiter, match;
		var output = d.createDocumentFragment();

		for(var _i = 0; _i < array_in.length; _i++) {
			var line_in = array_in[_i];
			//output.appendChild(d.createElement('aside'));

			do {
				var output_part = d.createElement('span');
				var line_part;
				var tag_start = "", tag_mid = "", tag_end = "";
				var first_char = line_in.charAt(0);
				if(!in_tag && first_char == '<') {
					/*
					 * Start of tag.
					 */
					in_tag = true;
					if(line_in.substr(0, 2) == "<?") tag_type = 'xml_dec';
					else if(line_in.substr(0, 4) == "<!--") tag_type = 'comment';
					else if(line_in.match(/^\<!\s*\[\s*CDATA\s*\[/)) tag_type = 'cdata';
					else {
						var tag_start = "<"
						if(line_in.substr(0, 2) == "</") {
							tag_start = "</";
							closing_tag = true;
						}
						if(match = line_in.match(regex.xml_tag_name)) {
							tag_start = match[0];
							var tag_name = match[1]
							
							if(tag_name.slice(0, 4) == "xsl:") tag_type = 'xsl_tag';
							else tag_type = 'xml_tag';
						}
						else {
							tag_type = 'html_tag';
							match = line_in.match(regex.html_tag_name);
							if(match) tag_start = match[0];
						}
					}
				}

				if(!in_tag) {
					// Not in tag.
					part_length = line_in.search(/(\<|$)/);
					$(output_part).append(sub('text', line_in.slice(0, part_length)));
					output.appendChild(output_part);
				}
				else {
					/*
					* In tag.
					*/
					part_length = line_in.length;
					if(in_value) {
						// In attribute value.
						if(["select", "match", "test"].indexOf(last_attr) > -1) value_type = 'xsl_attr_val';
						else value_type = 'attr_val';
						var offset = 0;
						if(value_first_line) {
							value_delimiter = line_in.charAt(0);
							offset++;
							value_first_line = false;
						}
						delimiter_index = line_in.indexOf(value_delimiter, offset);
						if(delimiter_index > -1) {
							part_length = delimiter_index + 1;
							in_value = false;
						}

						output.appendChild(sub(value_type, line_in.slice(0, part_length)));
					}
					// Not in value.
					else {
						part_type = tag_type;
						if(tag_type == 'xml_dec') {
							var match = line_in.match(/^\<?\?[^\?]*(\?\>|$)/);
							line_part = match[0];
							part_length = line_part.length;
							if(match[1] == "?>") in_tag = false;
							var span = $('<span></span>').addClass(style_prefix + tag_type).text(line_part);
							output.appendChild(span[0]);
						}
						else if(tag_type == 'comment') {
							delimiter_index = line_in.indexOf("-->");
							if(delimiter_index > -1) {
								part_length = delimiter_index + 3;
								in_tag = false;
							}
							var span = $('<span></span>').addClass(style_prefix + tag_type).text(line_in.slice(0, part_length));
							output.appendChild(span[0]);
						}
						else if(tag_type == 'cdata') {
							delimiter_index = line_in.search(/\]\s*\]\s*\>/);
							if(delimiter_index > -1) {
								part_length = delimiter_index + 3;
								in_tag = false;
							}
							var span = $('<span></span>').addClass(style_prefix + tag_type).text(line_in.slice(0, part_length));
							output.appendChild(span[0]);
						}
						else {
							/*
							 * Tag part is XSL, XML or HTML.
							 */
							$(output_part).addClass(style_prefix + tag_type);
							if(closing_tag) {
								/*
								 * Closing tag.
								 */
								delimiter_index = line_in.indexOf(">");
								if(delimiter_index > -1) {
									tag_end = ">";
									part_length = delimiter_index + 1;
									in_tag = false;
									closing_tag = false;
								}
								output_mid = line_in.substring(tag_start.length, part_length - tag_end.length);
								if(output_mid !== "") {
									if(tag_start !== "") $(output_part).appendText(tag_start);
									$(output_part).appendSpan('XSL_text', output_mid);
									if(tag_end != "") $(output_part).appendText(tag_end);
								}
								else $(output_part).appendText(tag_start + tag_end);
								output.appendChild(output_part);
							}
							else {
								/*
								 * Tag not closing.
								 */
								delimiter_index = line_in.search(/(\"|\'|\>)/);
								if(delimiter_index > -1) {
									part_length = delimiter_index;
									if(line_in.charAt(delimiter_index) == ">") {
										tag_end = ">";
										if(line_in.charAt(delimiter_index - 1) == "/") tag_end = "/>";
										part_length++;
										in_tag = false;
									}
									else { // Value delimiter found.
										in_value = true;
										value_type = 'attr_val';
										value_first_line = true;
									}
								}
								tag_mid = line_in.substring(tag_start.length, part_length - tag_end.length);
								if(tag_mid == "") {
									$(output_part).appendText(tag_start + tag_end);
								}
								else { // Form tag_mid_node.
									if(tag_start != "") $(output_part).appendText(tag_start);
									var tag_mid_node = d.createElement('span');
									tag_mid_node.className = "XSL_text";
									match = tag_mid.match(/[a-z\_][a-z0-9\-\_:]*/ig);
									if(match) {
										var marker = 0, pos;
										for(var _j in match) {
											var attr = match[_j];
											last_attr = attr;
											pos = tag_mid.indexOf(attr, marker);
											if(pos > 0) $(tag_mid_node).appendText(tag_mid.slice(marker, pos));
											$(tag_mid_node).appendSpan('XSL_attr_name', attr);
											marker = pos + attr.length;
										}
										if(marker < tag_mid.length) $(tag_mid_node).appendText(tag_mid.slice(marker));
									}
									else $(tag_mid_node).appendText(tag_mid);
									$(output_part).append(tag_mid_node);
									if(tag_end != "") $(output_part).appendText(tag_end);
								}
								output.appendChild(output_part);
							}
						}
					}
				}
				line_in = line_in.slice(part_length);
			} while(line_in.length > 0);
			output.appendChild(d.createTextNode(EOL));
		}

		return output;
	}

	function outputArray() {
		var a = new Array();
		a.add = function(style, text) {
			this.push({'style': style, 'value': text});
		}
		return a;
	}

	function sub(style_type, text) {
		var array_out = outputArray();
		array_out.push({'style': style_type, 'value': text});

		$.each(substyling, function(i, substyles) {
			var new_array_out = outputArray(), work_str, matches;
			$.each(array_out, function(i, out) {
				var style1 = out.style;
				var style2 = substyles[style1];
				if(style2 == null) {
					new_array_out.push(out);
				} else {
					var work_str = out.value;
					matches = work_str.match(regex[style2]);
					if(matches) {
						$.each(matches, function(i, match) {
							var matchPos = work_str.indexOf(match);
							if(matchPos > 0) {
								new_array_out.add(style1, work_str.substring(0, matchPos));
							}
							new_array_out.add(style2, match);
							work_str = work_str.substring(matchPos + match.length);
						});
					}
					if(work_str.length > 0) new_array_out.add(style1, work_str);
				}
			});
			array_out = new_array_out;
		});

		var output = d.createElement('span');
		var a;
		while(array_out.length > 0) {
			var a = array_out.shift();
			var span = d.createElement('span');
			span.className = style_prefix + a.style;
			$(span).appendText(a.value);
			output.appendChild(span);
		}
		return output;
	}

})(jQuery);