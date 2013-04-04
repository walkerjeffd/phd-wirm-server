// project info in dashboard header
App.Views.ProjectInfo = Backbone.View.extend({
  template: App.template('template-project-info'),

  events: {
    "click .btn-edit": "editProject",
    "click .btn-delete": "deleteProject"
  },

  initialize: function(options) {
    console.log('INIT: project info');
    this.project = options.project;
    this.parameters = options.parameters;
    this.listenTo(this.project, 'change', this.render, this);
    this.listenTo(this.project, 'destroy', function() { App.router.navigate('/', {trigger: true}); });
  },

  render: function() {
    var view = this;
    console.log('RENDER: project info');
    this.$el.html( this.template( this.project.toJSON() ) );
    this.$('#project-details').toggle(!(this.project.isNew()));
    this.$('.alert').hide();
    this.$('.alert .btn-confirm').on('click', function() {
      view.project.destroy();
    });
    this.$('.alert .btn-cancel').on('click', function() {
      view.$('.alert').toggle();
    });
    return this;
  },

  editProject: function() {
    console.log('controls: edit project ' + this.project.get('id'));
    if (App.user === this.project.get('owner')) {
      // current user owns project
      var projectModal = new App.Views.ProjectModal({project: this.project, parameters: this.parameters, title: 'Edit Project Info'});
    } else {
      // current user does not own project
      App.vent.trigger('status', 'error', 'Error: Only the owner of this project can edit it');
    }
  },

  deleteProject: function() {
    var view = this;
    console.log('controls: delete project ' + this.project.get('id'));
    if (App.user === this.project.get('owner')) {
      // current user owns project
      this.$('.alert').slideDown();
    } else {
      // current user does not own project
      App.vent.trigger('status', 'error', 'Error: Only the owner of this project can delete it');
    }
  }
});

// project list
App.Views.ProjectList = Backbone.View.extend({
  template: App.template('template-project-list'),

  initialize: function() {
    console.log('INIT: project list view');

    this.listenTo(this.collection, 'sync', this.render);
  },

  render: function() {
    console.log('RENDER: project list view');
    var view = this;
    this.$el.html( this.template() );
    console.log(App.router.isAuthenticated());
    if (!(App.router.isAuthenticated())) {
      this.$('.project-list').remove();
      this.$el.append('<p>You must be logged in to view existing projects. Click here to <a href="/accounts/login/">log in</a> or <a href="/accounts/register/">sign up</a>.</p>');
    } else if (this.collection.length > 0) {
      this.$('.project-list').empty();
      this.collection.each(function(project) {
        view.$('.project-list').append(new App.Views.ProjectListItem({model: project}).render().el );
      });
    } else {
      this.$('.project-list').remove();
      this.$el.append('<p>You have no existing projects. <a href="#">Click here</a> to start a new project</p>');
    }
    return this;
  }
});

// project list item
App.Views.ProjectListItem = Backbone.View.extend({
  tagName: 'li',

  model: App.Models.Project,

  template: _.template('<a href="/client/#projects/<%= id %>"><%= title %></a>'),

  render: function() {
    this.$el.html( this.template( this.model.toJSON() ) );
    return this;
  }
});

// modal for saving/editing project
App.Views.ProjectModal = Backbone.View.extend({
  template: App.template('template-project-modal'),

  events: {
    'click .btn-save': 'saveProject',
    'click .close': 'close',
    'click .btn-close': 'close'
  },

  initialize: function(options) {
    console.log('INIT: project modal');
    this.project = options.project;
    this.parameters = options.parameters;
    this.title = options.title || 'Create Project';
    this.project.set('parameter_values', this.parameters.getKeyValuePairs());
    this.listenTo(this.project, 'sync', this.postSave, this);
    this.listenTo(this.project, 'error', this.showError);
    this.listenTo(this.project, 'invalid', this.showInvalid);
    this.render();
  },

  render: function() {
    console.log('RENDER: project modal');
    this.$el.html( this.template( this.project.toJSON() ) );
    this.$('#projectModalLabel').text(this.title);
    $('body').append( this.el );
    this.$('.alert').hide();
    this.$('.modal').modal();
    return this;
  },

  saveProject: function() {
    console.log('project modal: saving project');
    this.project.save({
      title: this.$("input[name='title']").val(),
      location: this.$("input[name='location']").val(),
      description: this.$("textarea[name='description']").val()
    }, {
      wait: true
    });
  },

  postSave: function() {
    console.log('project model: project saved');
    App.vent.trigger('status', 'success', 'Project saved');
    this.close();
    App.router.navigate('/projects/' + this.project.get('id'), {trigger: true});
  },

  close: function() {
    console.log('project modal: close');
    this.$('.modal').modal('hide');
    this.remove();
  },

  showError: function(model, xhr, options) {
    console.log('Error saving model:');
    this.showStatus('Error: Unable to save model.');
    // App.vent.trigger('status', 'error', 'Error saving model');
    console.log(xhr);
  },

  showInvalid: function(model, error, options) {
    this.showStatus('Error: ' + error);
    // App.vent.trigger('status', 'error', 'Model Validation Failed');
    console.log('Invalid model: ' + error);
  },

  showStatus: function(message) {
    this.$('.alert').clearQueue();
    this.$('.alert').html(message);
    this.$('.alert').show();
  }
});
