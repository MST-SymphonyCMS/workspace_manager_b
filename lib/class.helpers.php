<?php

class Helpers
{
	public static function capitalizeWords($string)
    {
        return ucwords(str_replace('-', ' ', $string));
    }
}