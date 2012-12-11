'use strict';


// Declare app level module which depends on filters, and services
angular.module('schisma', ['schisma.backend']).
  config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/schisms/:schism_id', {templateUrl: 'partials/schism.html', controller: SchismController});
    $routeProvider.when('/welcome', {templateUrl: 'partials/welcome.html', controller: WelcomeController});
    $routeProvider.otherwise({redirectTo: '/welcome'});
  }]);
