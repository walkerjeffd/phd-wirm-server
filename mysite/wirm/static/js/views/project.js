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
    if (App.user === this.project.get('owner').username) {
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
    if (App.user === this.project.get('owner').username) {
      // current user owns project
      this.$('.alert').slideDown();
    } else {
      // current user does not own project
      App.vent.trigger('status', 'error', 'Error: Only the owner of this project can delete it');
    }
  }
});

// project list
App.Views.ProjectContainer = Backbone.View.extend({
  template: App.template('template-project-container'),

  initialize: function() {
    console.log('INIT: project list view');
    this.subViews = {};
    this.subViews.projectList = new App.Views.ProjectList({collection: this.collection});
    this.listenTo(this.collection, 'sync add remove change', this.render);
  },

  render: function() {
    this.$el.html( this.template() );
    if (!(App.router.isAuthenticated())) {
      this.$el.append('<p>You must be logged in to view saved projects. Click here to <a href="/accounts/login/">log in</a> or <a href="/accounts/register/">sign up</a>.</p>');
    } else if (this.collection.isEmpty()) {
      this.$el.append('<p>You have no saved projects. <a href="#">Click here</a> to start a new project</p>');
    } else {
      this.$el.append(this.subViews.projectList.render().el);
    }
  }
});

App.Views.ProjectList = Backbone.View.extend({
  tagName: 'ul',

  className: 'project-list',

  render: function() {
    console.log('RENDER: project list view');
    var view = this;
    this.$el.empty();
    this.collection.each(function(project) {
      var projectItem = new App.Views.ProjectListItem({model: project});
      view.$el.append(projectItem.render().el );
    });
    return this;
  }
});

// project list item
App.Views.ProjectListItem = Backbone.View.extend({
  tagName: 'li',

  className: 'project-item',

  model: App.Models.Project,

  template: App.template('template-project-item'),

  events: {
    'click .btn-delete': 'deleteProject'
  },

  render: function() {
    console.log('RENDER: project list item');
    var context = this.model.toJSON();
    var view = this;
    context.created = moment(context.created).format('MMM D YYYY h:mm a');
    context.updated = moment(context.updated).format('MMM D YYYY h:mm a');
    context.createdFromNow = moment(context.created).fromNow();
    context.updatedFromNow = moment(context.updated).fromNow();
    this.$el.html( this.template( context ) );
    this.$('.alert').hide();
    this.$('.alert .btn-confirm').on('click', function() {
      view.model.destroy();
    });
    this.$('.alert .btn-cancel').on('click', function() {
      view.$('.alert').toggle();
    });
    return this;
  },

  deleteProject: function() {
    this.$('.alert').slideDown();
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
