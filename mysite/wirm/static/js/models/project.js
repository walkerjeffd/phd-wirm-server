App.Models.Project = Backbone.Model.extend({
  urlRoot: '/api/projects/',

  defaults: {
    title: 'New Project',
    location: '',
    description: '',
    parameter_values: '',
    owner: null,
    comments: []
  },

  validate: function(attrs) {
    if (attrs.title.trim() === "") {
      return "Project title cannot be blank";
    }
    if (attrs.location.trim() === "") {
      return "Project location cannot be blank";
    }
    if (attrs.description.trim() === "") {
      return "Project description cannot be blank";
    }
  },

  save: function(attributes, options) {
      // cleanup attributes before saving
      var that = this;
      var attrs = ['comments'];
      _.each(attrs, function(attr){
        that.unset(attr);
      });
      Backbone.Model.prototype.save.call(this, attributes, options);
  }
});