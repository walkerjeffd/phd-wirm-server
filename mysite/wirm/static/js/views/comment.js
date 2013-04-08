App.Views.CommentTab = Backbone.View.extend({
  initialize: function() {
    console.log('INIT: comment tab');
  },

  render: function() {
    console.log('RENDER: comment tab');
    var view = this;
    view.$el.empty();
    if (this.collection.isEmpty()) {
      this.$el.html('No comments');
    } else {
      var commentList = new App.Views.CommentList({collection: this.collection});
      this.$el.append( commentList.render().el );
    }
    return this;
  }
});

App.Views.CommentList = Backbone.View.extend({
  tagName: 'ul',

  className: 'comment-list',

  initialize: function() {
    console.log('INIT: comment list');
    this.listenTo(this.collection, 'sync', this.render);
  },

  render: function() {
    console.log('RENDER: comment list');
    var view = this;
    view.$el.empty();
    if (this.collection.isEmpty()) {
      this.$el.html('No comments');
    } else {
      this.collection.each(function(comment) {
        var commentListItem = new App.Views.CommentListItem({model: comment});
        view.$el.append( commentListItem.render().el );
      });
    }
    return this;
  }
});

App.Views.CommentListItem = Backbone.View.extend({
  tagName: 'li',

  className: 'comment-item',

  template: _.template('<%= comment %>, <%= created %>, <%= owner %>'),

  initialize: function() {
  },

  render: function() {
    this.$el.html( this.template( this.model.toJSON() ) );
    return this;
  }
});