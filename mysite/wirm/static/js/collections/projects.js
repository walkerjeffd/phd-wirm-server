App.Collections.Projects = Backbone.Collection.extend({
  model: App.Models.Project,

  url: '/api/projects/'
});