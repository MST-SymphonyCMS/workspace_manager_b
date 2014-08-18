(function($) {
	var d = document;

	var COMMENT = 'GEN_comment',
		STRING = 'GEN_string';

	var regex = {
	}
	
	var EOL = "\n", sgl_quote = "'", dbl_quote = "\"";

	Symphony.Extensions.WorkspaceManager.highlighters['php'] = function(source_text) {
		if(source_text.length == 0) return null;
 		
		var output = d.createElement('span');
		var block_length;

		do {
			var first_char = source_text.charAt(0);
			if(first_char == sgl_quote) {
				block_length = source_text.indexOf(sgl_quote, 1) + 1;
				if(block_length == 0) block_length = source_text.length;
				$(output).appendSpan(STRING, source_text.slice(0, block_length));
			}
			else if(first_char == dbl_quote) {
				var offset = 1;
				var stop = false
				do {
					block_length = source_text.indexOf(dbl_quote, offset) + 1;
					if(block_length > 1) {
						if(source_text.charAt(block_length - 2) == "\\") {
							offset = block_length;
						}
						else break;
					}
					else {
						block_length = source_text.length;
						break;
					}
				} while(true);
				$(output).appendSpan(STRING, source_text.slice(0, block_length));
			}
			else if(first_char == "/") {
				if(source_text.charAt(1) == "/") {
					block_length = source_text.indexOf(EOL, 2) + 1;
					if(block_length == 0) block_length = source_text.length;
					$(output).appendSpan(COMMENT, source_text.slice(0, block_length));
				}
				else if(source_text.charAt(1) == "*") {
					block_length = source_text.indexOf("*/", 2) + 2;
					if(block_length == 1) block_length = source_text.length;
					$(output).appendSpan(COMMENT, source_text.slice(0, block_length));
				}
			}
			else {
				block_length = source_text.search(/(\'|\"|\/\/|\/\*|$)/);
				$(output).appendText(source_text.slice(0, block_length));
			}
			source_text = source_text.slice(block_length);
		} while(source_text.length > 0);

		return output;
	}

})(window.jQuery);
 
