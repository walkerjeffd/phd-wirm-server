App.Router.Workspace = Backbone.Router.extend({
  routes: {
    "": "newProject",
    "projects": "projectList",
    "projects/:id": "loadProject",
    "*path": "unknownPath"
  },

  initialize: function(options) {
    this.el = options.el;

    // set up models/collections
    this.project = new App.Models.Project();
    this.projects = new App.Collections.Projects();
    this.parameters = new App.Collections.Parameters();
    this.comments = new App.Collections.Comments([], {project: this.project});

    // set up dashboard view
    this.dashboard = new App.Views.Dashboard({parameters: this.parameters, project: this.project, comments: this.comments});

    // set up project list view
    this.projectContainer = new App.Views.ProjectContainer({collection: this.projects});

    // fetch default parameters
    this.parameters.fetch();

    // update values in parameters collection when project is fetched
    this.listenTo(this.parameters, 'sync', function() {App.vent.trigger('save:parameters');});
    this.listenTo(this.project, 'sync', this.updateParameters);

    // show all events for debugging
    // this.listenTo(this.project, 'all', function(eventName) {console.log('EVENT - project : ' + eventName);});
    // this.listenTo(this.projects, 'all', function(eventName) {console.log('EVENT - projects : ' + eventName);});
    // this.listenTo(this.parameters, 'all', function(eventName) {console.log('EVENT - parameters : ' + eventName);});
  },

  unknownPath: function(path) {
    this.showError('Unknown Path', 'The URL path #' + path + ' in invalid.');
  },

  newProject: function() {
    console.log('ROUTE: new project');

    // reset project to new project
    if (!(this.project.isNew())) {
      console.log('workspace: resetting project to new project');
      this.project.clear({silent: true});
      var newProject = new App.Models.Project();
      this.project.set(newProject.toJSON());
    }

    this.parameters.fetch();

    // show dashboard
    this.showDashboard();
  },

  showDashboard: function() {
    console.log('workspace: show dashboard');
    this.dashboard.setElement(this.el).render();
  },

  projectList: function() {
    console.log('ROUTE: project list');
    this.projectContainer.setElement(this.el).render();
    this.projects.fetch();
  },

  loadProject: function(id) {
    console.log('ROUTE: load project');
    var that = this;

    this.project.set({id: id});

    this.project.fetch({
      success: function(model, response, options) {
        that.comments.fetch();
        that.updateParameters();
        that.showDashboard();
      },
      error: function(model, response, options) {
        console.log('Error fetching project ' + id);
        if (response.status === 404) {
          that.showError('Project not found', 'The project with id ' + id + ' was not found.');
        } else {
          that.showError('Unknown Error', 'Server responded with status ' + response.status + ': ' + response.statusText + '.');
        }
      }
    });
  },

  showError: function(title, message) {
    errorView = new App.Views.Error({title: title, message: message});
    errorView.setElement(this.el).render();
  },

  updateParameters: function() {
    console.log('workspace: updating parameters');
    var newParameters = this.project.get('parameter_values');
    this.parameters.each(function(parameter) {
      parameter.set('value', newParameters[parameter.get('key')]);
    });
    App.vent.trigger('save:parameters');
  },

  isAuthenticated: function() {
    return App.user !== null;
  }
});

App.boot = function(container) {
  container = $(container);
  App.router = new App.Router.Workspace({el: container});
  Backbone.history.start({root: "/client/"});
};