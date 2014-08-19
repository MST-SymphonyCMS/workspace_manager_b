{%if directories%}
	{%each directories%}
	<tr>
		<td>
			<a href="<?php echo $workspace_url; ?>${name}/">${name}</a>
			<label class="accessible" for="${name}">${name}</label><input type="checkbox" name="items[${name}]" id="${name}"/>
		</td>
	</tr>
	{%/each%}
	{%if directories.length == 0%}
	<tr class="odd">
		<td class="inactive" colspan="5">None found.</td>
	</tr>
	{%/if%}
{%/if%}