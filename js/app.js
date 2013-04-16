require.config({
	// this is to help with debugging, to prevent caching -- remove for release
	urlArgs: 'bust=' + (new Date()).getTime(),

	paths:
	{
		'jquery': 'lib/jquery',
		'jqueryui': 'lib/jquery.ui',
		'bootstrap': '../bootstrap/js/bootstrap',
		'underscore': 'lib/underscore',
		'json': 'lib/json2',
		'backbone': 'lib/backbone',
		'backbone.localstorage': 'lib/backbone.localstorage',
		'marionette': 'lib/backbone.marionette',
		'blob': 'lib/blob',
		'filesaver': 'lib/filesaver',
		'defaulttemplatesrc': '../defaulttemplate/template'
	},

	shim:
	{
		'jqueryui':
		{
			deps: ['jquery']
		},
		'underscore':
		{
			exports: '_'
		},
		'json':
		{
			exports: 'JSON'
		},
		'backbone':
		{
			deps: ['underscore', 'json', 'jquery'],
			exports: 'Backbone'
		},
		'marionette':
		{
			deps: ['backbone'],
			exports: 'Marionette'
		},
		'filereader':
		{
			deps: ['jquery']
		},
		'blob':
		{
			exports: 'Blob'
		},
		'filesaver':
		{
			deps: ['blob'],
			exports: 'saveAs'
		}
	}
});

define(['backbone', 'marionette', 'blob', 'filesaver', 'models/passage', 'models/story',
        'collections/storycollection', 'collections/passagecollection', 'templates/default', 'router'],

function (Backbone, Marionette, Blob, saveAs, Passage, Story,
          StoryCollection, PassageCollection, defaultTemplate, TwineRouter)
{
	window.app = new Backbone.Marionette.Application({
		name: 'Twine',
		version: '2.0a',

		publishStory: function (story)
		{
			var blob = new Blob([defaultTemplate.publish(story)], { type: 'text/html;charset=utf-8' });
			saveAs(blob, story.get('name') + '.html');
		},

		saveArchive: function()
		{
			this.stories.fetch();
			this.passages.fetch();

			var output = '';

			this.stories.each(function (story)
			{
				output += story.publish() + '\n\n';
			});

			var blob = new Blob([output], { type: 'text/html;charset=utf-8' });
			saveAs(blob, new Date().toLocaleString().replace(/[\/:\\]/g, '.') + ' Twine Archive.html');
		},

		importFile: function (data)
		{
			// parse data into a DOM

			var parsed = $('<html></html>');

			// remove surrounding <html>, if there is one

			if (data.indexOf('<html>') != -1)
				parsed.html(data.substring(data.indexOf('<html>') + 6, data.indexOf('</html>')));
			else
				parsed.html(data);

			parsed.find('[data-role="twinestory"]').each(function()
			{
				var $story = $(this);
				var startPassageId = $story.attr('data-startnode');

				// create a story object

				var story = window.app.stories.create({ name: $story.attr('data-name') });

				// and child passages

				$story.find('[data-type="text/markdown"]').each(function()
				{
					var $passage = $(this);
					var posBits = $passage.attr('data-twine-position').split(',');

					passage = window.app.passages.create(
					{
						name: $passage.attr('data-name'),
						text: $passage.html(),
						story: story.id,
						left: parseInt(posBits[0]),
						top: parseInt(posBits[1])
					});	

					if ($passage.attr('data-id') == startPassageId)
						story.save({ startPassage: passage.id });
				});
			});
		}
	});

	window.app.addInitializer(function (options)
	{
		window.app.stories = new StoryCollection();
		window.app.stories.fetch();
		window.app.passages = new PassageCollection();
		window.app.passages.fetch();

		window.app.router = new TwineRouter();
		Backbone.history.start();
	});

	window.app.addRegions({
		mainRegion: '#regions .main'
	});

	window.app.start();

	return window.app;
});
