App.Views.CommentTab = Backbone.View.extend({
  template: App.template('template-comment'),

  events: {
    'click #submit-comment': 'submitComment'
  },

  initialize: function() {
    console.log('INIT: comment tab');
    this.listenTo(this.collection, 'sync', this.render, this);
    this.listenTo(this.collection, 'change', this.render, this);
    this.listenTo(this.collection, 'remove', this.render, this);
    this.listenTo(this.collection, 'add', this.render, this);
    this.listenTo(this.collection, 'reset', this.render, this);
  },

  render: function() {
    console.log('RENDER: comment tab');
    var view = this;
    view.$el.html(this.template());
    if (this.collection.isEmpty()) {
      this.$('.comment-list-container').html('<p>No comments</p>');
    } else {
      var commentList = new App.Views.CommentList({collection: this.collection});
      this.$('.comment-list-container').html( commentList.render().el );
    }
    return this;
  },

  submitComment: function(e) {
    e.preventDefault();
    var comment = this.$("input[name='comment']").val();
    this.collection.create({'comment': comment},
      { wait: true,
        success:function() {
          this.$("input[name='comment']").val('');
          console.log('added comment');
        },
        error: function(model, xhr, options) {
          this.$("input[name='comment']").val('');
          App.vent.trigger('status', 'error', 'Unable to save comment');
          console.log(xhr);
      }
    });
  }
});

App.Views.CommentList = Backbone.View.extend({
  tagName: 'ul',

  className: 'comment-list',

  initialize: function() {
    console.log('INIT: comment list');
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

  template: App.template('template-comment-item'),

  events: {
    'click .btn-delete': 'deleteComment'
  },

  initialize: function() {
  },

  render: function() {
    var context = this.model.toJSON();
    // context.formatCreated = moment(context.created).format("MMM D YYYY, h:mm a");
    context.formatCreated = moment(context.created).fromNow();
    this.$el.html( this.template( context ) );
    return this;
  },

  deleteComment: function() {
    this.model.destroy({
      wait: true,
      success: function() {
        App.vent.trigger('status', 'success', 'Comment deleted');
      },
      error: function() {
        App.vent.trigger('status', 'error', 'Unable to delete comment');
      }
    });
  }
});