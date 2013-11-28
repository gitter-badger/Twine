PassageItemView = Marionette.ItemView.extend(
{
	template: '#templates .passageItemView',
	className: 'passage',

	initialize: function (options)
	{
		this.model.on('change', this.render, this);
		this.parentView = options.parentView;

		// we have to bind zoom events manually
		// because they are a custom event, not DOM-related

		this.bind('zoom', function (e)
		{
			this.position();
		});
	},

	onRender: function()
	{
		// have to set absolute positioning manually,
		// or draggable() will manually apply absolute for us

		this.$el
		.attr('data-id', this.model.id)
		.css({
			position: 'absolute',
		})
		.draggable({
			cursor: 'move',
			addClasses: false,
			containment: 'parent'
		});

		this.position();
	},

	serializeData: function()
	{
		var data = this.model.toJSON();
		data.excerpt = this.model.excerpt();
		return data;
	},
	
	position: function()
	{
		this.$el.css({
			top: this.model.get('top') * this.parentView.zoom,
			left: this.model.get('left') * this.parentView.zoom
		});

		this.trigger('move');
	},

	edit: function()
	{
		$('#passageEditModal .passageId').val(this.model.id);
		$('#passageEditModal .passageName').val(this.model.get('name'));
		$('#passageEditModal .passageText').val(this.model.get('text'));
		$('#passageEditModal').modal('show');	
	},

	events:
	{
		'click .delete': function()
		{
			this.model.destroy();
		},

		'drag': function (e, ui)
		{
			app.mainRegion.currentView.drawLinks();
		},

		'dragstop': function (e, ui)
		{
			this.model.set({
				top: ui.position.top / this.parentView.zoom,
				left: ui.position.left / this.parentView.zoom	
			});
			
			app.mainRegion.currentView.positionPassage(this.model);	

			this.model.save();
		},

		'click .edit': 'edit',
		'dblclick': 'edit'
	}
});
