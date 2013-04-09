App.Views.Controls = Backbone.View.extend({
  template: App.template('template-controls'),

  events: {
    "click .btn-save": "saveProject",
    "click .btn-reset": "resetParameters"
  },

  initialize: function(options) {
    console.log('INIT: controls');
    this.project = options.project;
    this.parameters = options.parameters;
    this.listenTo(this.project, 'change', this.render, this);
    App.vent.bind('status', this.showStatus, this);
  },

  render: function() {
    console.log('RENDER: controls');
    this.$el.html(this.template());
    this.delegateEvents();
    this.$('.alert').hide();
    return this;
  },

  saveProject: function() {
    console.log('controls: save project');
    var view = this;
    if (this.project.isNew()) {
      // project is new
      if (App.router.isAuthenticated()) {
        // user is logged in
        var projectModal = new App.Views.ProjectModal({project: this.project, parameters: this.parameters, parent: this});
      } else {
        // user is not logged in
        App.vent.trigger('status', 'error', 'Error: You must <a href="/accounts/login/">log in</a> first to save a new project', 5000);
      }
    } else {
      // project already exists
      if (App.user === this.project.get('owner')) {
        // current user owns project
        this.project.save({parameter_values: this.parameters.getKeyValuePairs()}, {
          success: function() {
            console.log('success');
            App.vent.trigger('status', 'success', 'Success: Project saved');
          }
        });
      } else {
        // current user does not own project
        App.vent.trigger('status', 'error', 'Error: Only the owner of this project can save changes');
      }
    }
  },

  showStatus: function(statusType, message, delay) {
    delay = delay || 3000;
    this.$('.alert').clearQueue();
    this.$('.alert').addClass('alert-' + statusType);
    this.$('#status').html(message);
    this.$('.alert').show(0);
    this.$('.alert').delay(delay).fadeOut();
    this.$('.alert').removeClass('alert' + statusType);
  },

  resetParameters: function() {
    console.log('controls: reset parameters');
    App.vent.trigger('reset:parameters');
  }
});