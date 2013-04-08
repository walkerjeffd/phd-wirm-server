App.Collections.Comments = Backbone.Collection.extend({
  model: App.Models.Comment,

  url: function() {
    return this.project.url() + '/comments/';
  },

  initialize: function(models, options) {
    this.project = options.project;
  }
});
