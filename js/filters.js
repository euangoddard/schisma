'use strict';

angular.module('schisma.filters', []).
filter('default', function () {
    return function (value, default_value) {
        return String(value) || String(default_value);
    };
});
