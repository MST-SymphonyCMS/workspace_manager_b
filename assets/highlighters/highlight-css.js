(function($) {
	var d = document;

	var before_colon = true
		outside_brace = true;

 	var pseudo_classes = (
		'active checked disabled empty first-of-type first-child focus hover ' +
		'last-child last-of-type link nth-child :nth-last-child not root target visited'
	).split(' ');

	var keywords = (
		'ascent azimuth background-attachment background-color background-image background-position ' +
		'background-repeat background baseline bbox border-collapse border-color border-spacing ' +
		'border-style border-top border-right border-bottom border-left border-top-color ' +
		'border-right-color border-bottom-color border-left-color ' +
		'border-top-style border-right-style border-bottom-style border-left-style border-top-width border-right-width ' +
		'border-bottom-width border-left-width border-width border bottom cap-height caption-side centerline clear clip color ' +
		'content counter-increment counter-reset cue-after cue-before cue cursor definition-src descent direction display ' +
		'elevation empty-cells float font-size-adjust font-family font-size font-stretch font-style font-variant font-weight font ' +
		'height left letter-spacing line-height list-style-image list-style-position list-style-type list-style margin-top ' +
		'margin-right margin-bottom margin-left margin marker-offset marks mathline max-height max-width min-height min-width orphans ' +
		'outline-color outline-style outline-width outline overflow ' +
		'padding-top padding-right padding-bottom padding-left padding page ' +
		'page-break-after page-break-before page-break-inside pause pause-after pause-before pitch pitch-range play-during position ' +
		'quotes right richness size slope src speak-header speak-numeral speak-punctuation speak speech-rate stemh stemv stress ' +
		'table-layout text-align top text-decoration text-indent text-rendering text-shadow text-transform unicode-bidi unicode-range units-per-em ' +
		'vertical-align visibility voice-family volume white-space widows width widths word-spacing x-height z-index'
	).split(' ');

	var values = (
		'above absolute all always aqua armenian attr aural auto avoid ' +
		'baseline behind below bidi-override black blink block blue bold bolder both bottom braille' +
		'capitalize caption center center-left center-right circle close-quote code collapse compact ' +
		'condensed continuous counter counters crop cross crosshair cursive ' +
		'dashed decimal decimal-leading-zero default digits disc dotted double ' +
		'em embed embossed e-resize expanded extra-condensed extra-expanded ' +
		'fantasy far-left far-right fast faster fixed format fuchsia ' +
		'gray green groove ' +
		'handheld hebrew help hidden hide high higher ' +
		'icon important inline-table inline inset inside invert italic justify ' +
		'landscape large larger left-side left leftwards level lighter lime line-through list-item ' +
		'local loud lower-alpha lowercase lower-greek lower-latin lower-roman lower low ltr ' +
		'marker maroon medium message-box middle mix monospace move narrower ' +
		'navy ne-resize no-close-quote none no-open-quote no-repeat normal nowrap n-resize nw-resize ' +
		'oblique olive once open-quote outset outside overline ' +
		'pointer portrait pre print projection purple pt px ' +
		'red relative repeat repeat-x repeat-y rgb ridge right right-side rightwards rtl run-in ' +
		'sans-serif screen scroll semi-condensed semi-expanded separate se-resize serif show silent ' + 'silver slower slow small small-caps small-caption smaller soft solid speech spell-out ' +
		'square s-resize static status-bar sub super sw-resize ' +
		'table-caption table-cell table-column table-column-group table-footer-group ' +
		'table-header-group table-row table-row-group teal text-bottom text-top thick thin top ' + 'transparent tty tv ' +
		'ultra-condensed ultra-expanded underline upper-alpha uppercase upper-latin upper-roman url ' +
		'visible wait white wider w-resize ' +
		'x-fast x-high x-large x-loud x-low x-slow x-small x-soft xx-large xx-small yellow'
	).split(' ');

	var COMMENT = 'CSS_comment',
		STRING = 'CSS_string',
		ID = 'CSS_id',
		CLASS = 'CSS_class',
		PSEUDO_CLASS = 'CSS_pseudoclass',
		KEYWORD = 'CSS_keyword',
		VALUE = 'CSS_value';

	var exp_outside = /\{|[\.#][a-z_][a-z0-9_\-]*|\'[^']*\'?|\"[^"]*\"?|\/\*|\:[a-z]+|$/gi,
		exp_inside = /[:;}]|[a-z][a-z\-]+|\d+\.?\d*\%?|\.\d+\%?|\#[0-9a-f]{3,6}|\'[^']*\'?|\"[^"]*\"?|\/\*|$/gi,
		exp_end_comment = /[^]*?\*\/|$/g;
 		
	Symphony.Extensions.WorkspaceManager.highlighters['css'] = function(source_text) {
		if(source_text.length == 0) return null;
		var output = d.createElement('span');
		var exp, match, m, last_index = 0;

		while(last_index < source_text.length) {
			exp = outside_brace ? exp_outside : exp_inside;
			exp.lastIndex = last_index;
			match = exp.exec(source_text);
			if(match.index > last_index) {
				$(output).appendText(source_text.slice(last_index, match.index));
			}
			last_index = exp.lastIndex;
			m = match[0];
			first_char = m.charAt(0);
			if(m == "/*") {
				exp_end_comment.lastIndex = last_index;
				match2 = exp_end_comment.exec(source_text);
				last_index = exp_end_comment.lastIndex;
				$(output).appendSpan(COMMENT, m + match2[0]);
			}
			else if(first_char == "'" || first_char == "\"") {
				$(output).appendSpan(STRING, m);
			}
			else {
				if(outside_brace) {
					if(m == "{") {
						outside_brace = false;
						before_colon = true
						$(output).appendText(m);
					}
					else if(first_char == ".") {
						$(output).appendSpan(CLASS, m);
					}
					else if(first_char == "#") {
						$(output).appendSpan(ID, m);
					}
					else if(first_char == ":" && pseudo_classes.indexOf(m.slice(1)) > -1) {
						//alert(m)
						$(output).appendSpan(PSEUDO_CLASS, m);
					}
					else {
						$(output).appendText(m);
					}
				}
				else {
					if(m == "}") {
						outside_brace = true;
						$(output).appendText(m);	
					}
					else if(m == ":") {
						before_colon = false;
						$(output).appendText(m);
					}
					else if(m == ";") {
						before_colon = true;
						$(output).appendText(m);
					}
					else if('#.0123456789'.indexOf(first_char) > -1) {
						$(output).appendSpan(VALUE, m)
					}
					else if(first_char >= "a" && first_char <= "z") {
						if(before_colon && keywords.indexOf(m) > -1) {
							$(output).appendSpan(KEYWORD, m);
						}
						else if(!before_colon && values.indexOf(m) > -1) {
							$(output).appendSpan(VALUE, m);
						}
						else {
							$(output).appendText(m);
						}
					}
					else {
						$(output).appendText(m);
					}
				}
			}
		}
		return output;
	}
})(window.jQuery);

//})(); //(jQuery.noConflict());
 
