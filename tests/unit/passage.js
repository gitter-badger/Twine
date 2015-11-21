'use strict';
var Passage = require('../../src/data/models/passage');
var Story = require('../../src/data/models/passage');
var assert = require('assert');

describe('Passage', function()
{
	describe('links()', function()
	{
		var story;
		var p;

		beforeEach(function()
		{
			p = new Passage();
		});

		it('parses [[simple links]]', function()
		{
			p.set('text', '[[link]]');
			var links = p.links();
			assert(links.length == 1 && links[0] == 'link');
		});

		it('parses [[pipe|links]]', function()
		{
			p.set('text', '[[display|link]]');
			var links = p.links();
			assert(links.length == 1 && links[0] == 'link');
		});

		it('parses [[arrow->links]]', function()
		{
			p.set('text', '[[display->link]]');
			var links = p.links();
			assert(links.length == 1 && links[0] == 'link');
		});

		it('parses [[backarrow<-links]]', function()
		{
			p.set('text', '[[link<-display]]');
			var links = p.links();
			assert(links.length == 1 && links[0] == 'link');
		});

		it('parses [[simple links][setter]] while ignoring setter component', function()
		{
			p.set('text', '[[link][setter]]');
			var links = p.links();
			assert(links.length == 1 && links[0] == 'link');
		});

		it('parses [[pipe|links][setter]] while ignoring setter component', function()
		{
			p.set('text', '[[display|link][setter]]');
			var links = p.links();
			assert(links.length == 1 && links[0] == 'link');
		});

		it('parses [[arrow->links][setter]] while ignoring setter component', function()
		{
			p.set('text', '[[display->link][setter]]');
			var links = p.links();
			assert(links.length == 1 && links[0] == 'link');
		});

		it('parses [[backarrow<-links][setter]] while ignoring setter component', function()
		{
			p.set('text', '[[link<-display][setter]]');
			var links = p.links();
			assert(links.length == 1 && links[0] == 'link');
		});

		it('ignores [[]]', function()
		{
			p.set('text', '[[]]');
			assert(p.links().length == 0);
		});
	});
});