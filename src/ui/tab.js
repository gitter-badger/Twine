'use strict';
var $ = require('jquery');
var ui = require('./index');
require('../jquery-ext/tab');

$(ui).on('init', function (e, options)
{
	options.$body.on('click.twineui', '.tabs button', function()
	{
		// click handler for tabs

		$(this).tab();
	});
})
.on('attach', function (e, options)
{
	// show first tab in each group

	options.$el.find('.tabs button:first-of-type').tab();
});
