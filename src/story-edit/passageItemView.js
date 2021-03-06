/**
 This handles display of a single passage in a story map
 managed by StoryEditView.

 @class PassageItemView
 @extends Marionette.ItemView
**/

'use strict';
var $ = require('jquery');
var _ = require('underscore');
var Marionette = require('backbone.marionette');
var locale = require('../locale');
var confirm = require('../ui/confirm');
var ui = require('../ui');
var Passage = require('../data/models/passage');
var passageItemTemplate = require('./ejs/passageItemView.ejs');

module.exports = Marionette.ItemView.extend(
{
	template: passageItemTemplate,
	className: 'passage',
	selected: false,
	actuallyDragged: false,

	/**
	 If true, then any change in the model's position
	 properties will be animated instead of immediately
	 changed.

	 @property animateMovement
	 @type Boolean
	**/

	animateMovement: false,

	initialize: function (options)
	{
		this.parentView = options.parentView;
		this.listenTo(this.model, 'change', this.render)
		.listenTo(this.model, 'change:text', this.createLinkedPassages)
		.listenTo(this.parentView.model, 'change:zoom', this.render)
		.listenTo(this.parentView.model, 'change:startPassage', this.render);

		/**
		 A bound event listener for the start of a passage drag event, so we can later disconnect it.

		 @property {Function} prepDragBound
		 @private
		**/

		this.prepDragBound = this.prepDrag.bind(this);

		/**
		 A bound event listener for a passage drag event, so we can later disconnect it.

		 @property {Function} followDragBound
		 @private
		**/

		this.followDragBound = this.followDrag.bind(this);

		/**
		 A bound event listener for a passage drag end event, so we can later disconnect it.

		 @property {Function} finishDragBound
		 @private
		**/

		this.finishDragBound = this.finishDrag.bind(this);

		/**
		 A bound event listener for a mouse motion event while this passage is the control
		 handle for a drag, so we can later disconnect it.

		 @property {Function} trackDragBound
		 @private
		**/

		this.trackDragBound = this.trackDrag.bind(this);

		/**
		 A bound event listener for a mouse up event while this passage is the control
		 handle for a drag, so we can later disconnect it.

		 @property {Function} endDragBound
		 @private
		**/

		this.endDragBound = this.endDrag.bind(this);
	},

	onDomRefresh: function()
	{
		var zoom = this.parentView.model.get('zoom');
		var top = this.model.get('top') * zoom;
		var left = this.model.get('left') * zoom;

		// have to set absolute positioning manually,
		// or draggable() will manually apply absolute for us

		this.$el
		.attr('data-id', this.model.id)
		.css('position', 'absolute');

		// set CSS class for broken links

		if (_.every(this.model.links(true), function (link)
		{
			return this.parentView.collection.findWhere({ name: link });
		}, this))
			this.$el.removeClass('brokenLink');
		else
			this.$el.addClass('brokenLink');

		// set CSS class for starting point

		var startId = this.parentView.model.get('startPassage');

		if (this.model.id == startId || this.model.cid == startId)
			this.$el.addClass('start');
		else
			this.$el.removeClass('start');

		if (this.animateMovement)
		{
			this.$el.animate({ left: left, top: top }, 100);

			// we need to trigger a change event once the
			// animation ends, so that link arrows update with
			// the correct position

			_.delay(function (model)
			{
				model.set({ left: model.get('left') + 0.0001 });
			}, 100, this.model);
		}
		else
			this.$el.css({ left: left, top: top });
	},

	onDestroy: function()
	{
		// removes mouse listeners

		this.deselect();
	},

	serializeData: function()
	{
		// add the excerpt manually after saving data

		var data = this.model.toJSON();
		data.excerpt = this.model.excerpt();
		return data;
	},

	/**
	 Confirms that the user wants to delete this model,
	 then calls delete().

	 @method confirmDelete
	 @param {Event} e Event, if any; if the shift key is pressed on this,
	                  then the confirm is skipped
	**/

	confirmDelete: function (e)
	{
		if (e.shiftKey)
			this.delete();
		else
		{
			var message = locale.say('Are you sure you want to delete &ldquo;%s&rdquo;? ' +
			                                   'This cannot be undone.', this.model.get('name'));

			if (! ui.hasPrimaryTouchUI())
				message += '<br><br>' + locale.say('(Hold the Shift key when deleting to skip this message.)');

			confirm(message, '<i class="fa fa-trash-o"></i> ' + locale.say('Delete'),
					this.delete.bind(this), { buttonClass: 'danger' });
		};
	},

	/**
	 Deletes the underlying passage model.

	 @method delete
	**/

	delete: function()
	{
		var model = this.model;

		this.disappear(function()
		{
			model.destroy();
		});
	},

	/**
	 Begins editing this passage in a modal dialog.

	 @method edit
	**/

	edit: function()
	{
		this.parentView.passageEditor.model = this.model;
		this.parentView.passageEditor.open();
	},

	/**
	 Creates passage models for any broken links that are in this model's
	 text, but are not contained in the previous state's text. This is called
	 automatically whenever the model's text property is changed.

	 @method createLinkedPassages
	**/

	createLinkedPassages: function()
	{
		// derive the previous set of links

		var oldBroken = [];

		if (this.model.previous('text'))
		{
			var currentText = this.model.get('text');
			this.model.set({ text: this.model.previous('text') }, { silent: true });

			oldBroken = _.filter(this.model.links(true), function (link)
			{
				return (this.parentView.collection.findWhere({ name: link }) !== null);
			}, this);
	
			this.model.set({ text: currentText }, { silent: true });
		};

		// we start new passages directly below this one

		var newTop = this.model.get('top') + Passage.height * 1.5;
		var newLeft = this.model.get('left');

		// actually create them
		// this needs to be deferred so that the current chain of execution
		// (e.g. a pending save operation, if there is one) can finish off

		_.each(this.model.links(true), function (link)
		{
			if (! this.parentView.collection.findWhere({ name: link }) &&
				oldBroken.indexOf(link) == -1)
			{
				_.defer(this.parentView.addPassage.bind(this.parentView), link, newLeft, newTop);
				newLeft += Passage.width * 1.5;
			};
		}, this);
	},

	/**
	 Tests the parent story, starting with this passage.

	 @method test
	**/

	test: function()
	{
		this.parentView.test(this.model.id);
	},

	/**
	 Sets this passage as the starting one for the parent story.

	 @method setAsStart
	**/

	setAsStart: function()
	{
		this.parentView.model.save({ startPassage: this.model.id });
	},

	/**
	 Animates the view as if it were apppearing onscreen for the first time.

	 @method appear
	 @param {Function} callback Function to call when the animation is done.
	**/

	appear: function (callback)
	{
		if (callback)
			this.$el.on('animationend webkitAnimationEnd MSAnimationEnd', function()
			{
				callback();
				$(this).off('animationend webkitAnimationEnd MSAnimationEnd');
			});

		this.$el.addClass('fallIn');
	},

	/**
	 Animates the view as if it were disappearing onscreen.

	 @method disappear
	 @param {Function} callback Function to call when the animation is done.
	**/

	disappear: function (callback)
	{
		if (callback)
			this.$el.on('animationend webkitAnimationEnd MSAnimationEnd', function()
			{
				callback();
				$(this).off('animationend webkitAnimationEnd MSAnimationEnd');
			});

		this.$el.removeClass('fallIn').addClass('disappear');
	},

	/**
	 Selects this view for dragging.

	 @method select
	**/

	select: function()
	{
		if (this.selected)
			return;

		this.selected = true;
		this.$el.addClass('selected');
		$('body').on('passagedragstart', this.prepDragBound);
		$('body').on('passagedrag', this.followDragBound);
		$('body').on('passagedragend', this.finishDragBound);
	},

	/**
	 Deselects this view for dragging.

	 @method deselect
	**/

	deselect: function()
	{
		if (! this.selected)
			return;

		this.selected = false;
		this.$el.removeClass('selected');
		$('body').off('passagedragstart', this.prepDragBound);
		$('body').off('passagedrag', this.followDragBound);
		$('body').off('passagedragend', this.finishDragBound);
	},

	/**
	 Highlights this view, i.e. when performing a search.

	 @method highlight
	**/

	highlight: function()
	{
		this.$el.addClass('highlight');
	},

	/**
	 Removes highlighting from this view.

	 @method unhighlight
	**/

	unhighlight: function()
	{
		this.$el.removeClass('highlight');
	},

	/**
	 Handles a mouse down or touch start event on this view,
	 adjusting the selection and beginning a potential drag.

	 @method handleMouseDown
	 @param {Object} e event object
	 @private
	**/

	handleMouseDown: function (e)
	{
		if (e.shiftKey || e.ctrlKey)
		{
			// toggle selection

			if (this.selected)
				this.deselect();
			else
				this.select();
		}
		else
		{
			// if we were not selected, then immediately
			// deselect everything else so that only this
			// passage is dragged

			if (! this.selected)
				this.parentView.children.each(function (view)
				{
					if (view != this)
						view.deselect();
				}, this);

			this.select();
		};

		this.beginDrag(e);
	},

	/**
	 Handles a mouse up or touch end event on this view, adjusting the
	 selection. A mouseup or touch end that ends a drag event is handled
	 over in endDrag().

	 @method handleMouseUp
	 @param {Object} e event object
	 @private
	**/

	handleMouseUp: function (e)
	{
		if (e.shiftKey || e.ctrlKey || this.actuallyDragged ||
			this.$el == this.parentView.lastMousedown ||
			$.contains(this.$el, this.parentView.lastMousedown))
			return;

		// deselect everything else

		this.parentView.children.each(function (view)
		{
			if (view != this)
				view.deselect();
		}, this);
	},

	/**
	 Starts a drag event. This is only called if the passage
	 is the control handle for the drag -- e.g. it is the one the
	 user grabbed to drag around.

	 @method beginDrag
	 @param {Object} e event object
	 @private
	**/

	beginDrag: function (e)
	{
		if (e.pageX && e.pageY)
			this.dragMouseStart = { x: e.pageX, y: e.pageY };	
		else if (e.originalEvent.targetTouches)
		{
			e = e.originalEvent;

			// emulate pageX and pageY for touch events

			this.dragMouseStart = { x: e.targetTouches[0].pageX, y: e.targetTouches[0].pageY };
			this.dragTouchId = e.targetTouches[0].identifier;
		}
		else
		{
			// L10n: An internal error related to handling user input.
			throw new Error(locale.say("Don't see either mouse or touch coordinates on event"));
		};

		this.actuallyDragged = false;
		$('#storyEditView').addClass('draggingPassages');

		$('body').on({
			touchmove: this.trackDragBound,
			mousemove: this.trackDragBound,
			mouseup: this.endDragBound,
			touchend: this.endDragBound
		})
		.trigger('passagedragstart', this.dragMouseStart);
	},

	/**
	 Reacts to a drag beginning, recording the view's original position.

	 @method prepDrag
	 @param {Object} e event object
	**/

	prepDrag: function ()
	{
		this.dragStart = { left: parseInt(this.$el.css('left')), top: parseInt(this.$el.css('top')) };
	},

	/**
	 Handles the user moving the mouse or a finger during a drag, generating events for
	 other selected passage views to listen to. This is only called if the passage
	 is the control handle for the drag -- e.g. it is the one the
	 user grabbed to drag around.

	 @method trackDrag
	 @param {Object} e event object
	 @private
	**/

	trackDrag: function (e)
	{
		var eventOrigin;
		this.actuallyDragged = true;

		if (this.dragTouchId !== null && e.originalEvent.touches)
		{
			// prevent default to block any resizing done by the browser
		
			e.preventDefault();
			e = e.originalEvent; 

			// emulate mouse events for touches

			for (var i = 0; i < e.touches.length; i++)
				if (e.touches[i].identifier == this.dragTouchId)
				{
					eventOrigin = e.touches[i];
					break;
				};

			if (! eventOrigin)
			{
				// L10n: An internal error related to user input.
				throw new Error(locale.say("Couldn't find original touch ID in movement event"));
			};
		}
		else
			eventOrigin = e;

		$('body').trigger($.Event('passagedrag', { x: eventOrigin.pageX - this.dragMouseStart.x, y: eventOrigin.pageY - this.dragMouseStart.y }));
	},

	/**
	 Reacts to a drag in progress, adjusting the view's position onscreen.
	 We don't actually change the model until the drag is finished.

	 @method followDrag
	 @param {Object} e event object
	**/

	followDrag: function (e)
	{
		this.dragX = Math.max(this.dragStart.left + e.x, 0); 
		this.dragY = Math.max(this.dragStart.top + e.y, 0); 

		this.$el.css(
		{
			left: this.dragX,
			top: this.dragY
		});
	},

	/**
	 Handles the user letting go of the mouse button during a drag, generating events for
	 other selected passage views to listen to. This is only called if the passage
	 is the control handle for the drag -- e.g. it is the one the
	 user grabbed to drag around.

	 @method endDrag
	 @param {Object} e event object
	 @private
	**/

	endDrag: function()
	{
		$('#storyEditView').removeClass('draggingPassages');
		$('body').off(
		{
			touchmove: this.trackDragBound,
			mousemove: this.trackDragBound,
			mouseup: this.endDragBound,
			touchend: this.endDragBound
		})
		.trigger('passagedragend');

		_.defer(function() { this.actuallyDragged = false; }.bind(this));
	},

	/**
	 Reacts to a drag being completed by updating the model.

	 @method finishDrag
	 @param {Object} e event object
	 @private
	**/

	finishDrag: function()
	{
		// set initial position based on the user's drag

		if (this.dragX === undefined || this.dragY === undefined)
			return;

		var zoom = this.parentView.model.get('zoom');

		this.model.set(
		{
			top: this.dragY / zoom,
			left: this.dragX / zoom
		});

		this.dragX = this.dragY = undefined;

		// defer the rest til all other drags have completed
		// so we don't get displaced by any passage's previous positions

		_.defer(function()
		{
			// push the passage so it doesn't overlap any other
			// nonselected one, i.e. that was part of the drag
			
			this.animateMovement = true;
			this.parentView.positionPassage(this.model, function (p)
			{
				return ! this.parentView.children.findByModel(p).selected;
			}.bind(this));

			this.animateMovement = false;

			// and finally save changes

			this.model.save();
		}.bind(this));
	},

	events:
	{
		'mousedown .frame': 'handleMouseDown',
		'touchstart .frame': 'handleMouseDown',
		'mouseup .frame': 'handleMouseUp',
		'touchend .frame': 'handleMouseUp',
		'click .delete': 'confirmDelete',
		'click .edit': 'edit',
		'click .test': 'test',
		'click .setAsStart': 'setAsStart',
		'dblclick': 'edit'
	}
});
