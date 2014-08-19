{%if files%}
	{%each files%}
	<tr>
		<td>
			<a href="<?php echo $editor_url; ?>${name}/">${name}</a>
			<input type="checkbox" name="items[${name}]"/>
		</td>
		<td>${size}</td>
		<td>${modified}</td>
	</tr>
	{%/each%}
	{%if files.length == 0%}
	<tr class="odd">
		<td class="inactive" colspan="5">None found.</td>
	</tr>
	{%/if%}
{%/if%}