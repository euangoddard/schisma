'use strict';

/* Controllers */

var WelcomeController = function ($scope) {
    $scope.app_name = 'Schisma';
    _gaq.push(['_trackPageview', '/welcome']);
};

var CreationController = function ($scope, $location, Schism) {
    
    $scope.create_schism = function () {
        Schism.save($scope.schism, function (schism) {
            $location.path('/schisms/' + schism._id.$oid);
        });
    };
};

var SchismController = function ($scope, $location, $routeParams, Schism) {
    
    // Read the data from the backend
    $scope.$parent.is_loading = true;
    Schism.get({id: $routeParams.schism_id}, function (schism) {
        $scope.schism = new Schism(schism);
        if (!$scope.schism.currency) {
            $scope.schism.currency = '\u00A3';
        }
        if (!$scope.schism.payments) {
            $scope.schism.payments = [];
        }
        group_payments_by_name($scope.schism.payments);
        $scope.$parent.is_loading = false;
    });
    
    // Initial state for the scope
    $scope.CURRENCIES = ['$', '\u00A3', '\u20AC', '\u00A5'];
    $scope.is_editing_schism = false;
    $scope.new_payment = {};
    
    // Public functions exposed to the view
    
    $scope.add_payment = function () {
        $scope.schism.payments.push($scope.new_payment);
        $scope.new_payment = {};
        group_payments_by_name($scope.schism.payments);
        commit_changes_to_remote();
    };
    
    $scope.remove_payment = function (index) {
        $scope.schism.payments.splice(index, 1);
        group_payments_by_name($scope.schism.payments);
        commit_changes_to_remote();
    };
    
    $scope.save_schism = commit_changes_to_remote;
    
    // Private functions for this controller
    
    var group_payments_by_name = function (payments) {
        var totals_per_person = calculate_totals_per_person(payments);
        $scope.names_and_amounts = totals_per_person;
        $scope.reimburments = calculate_reimbursements(totals_per_person);
    };
    
    var commit_changes_to_remote = function () {
        $scope.is_saving = true;
        $scope.schism.update(function () {
            $scope.is_saving = false;
        });
    };
    
    _gaq.push(['_trackPageview', $location.path()]);
};

var calculate_totals_per_person = function (payments) {
    // Collect together all the amounts paid by person and determine the
    // entire spend of the group
    var total_amount = 0;
    var total_payees = 0;
    var amounts_by_name = {};
    angular.forEach(payments, function (payment) {
        var payment_name = payment.name;
        var new_amount = payment.amount;
        total_amount += new_amount;
        if (payment_name in amounts_by_name) {
            new_amount += amounts_by_name[payment_name];
        } else {
            total_payees += 1;
        }
        amounts_by_name[payment_name] = new_amount;
    });
    
    var average_payment_per_person = total_amount / total_payees;
    
    // Convert the amounts keyed by name into an array for sorting
    var names_and_amounts = [];
    angular.forEach(amounts_by_name, function (amount, name) {
        var difference_from_average = amount - average_payment_per_person;
        var name_totals = {
            name: name,
            total_payment: amount,
            difference_from_average: difference_from_average
        };
        names_and_amounts.push(name_totals);
    });
    names_and_amounts.sort(compare_objects_by_name_key);
    return names_and_amounts;
};


var calculate_reimbursements = function (names_and_amounts) {
    var credits = [];
    var debts = [];
    var reimbusements = [];
    
    angular.forEach(names_and_amounts, function (data) {
        if (data.difference_from_average > 0) {
            credits.push({
                name: data.name,
                amount: Math.abs(data.difference_from_average)
            });
        } else if (data.difference_from_average < 0) {
            debts.push({
                name: data.name,
                amount: Math.abs(data.difference_from_average)
            });
        }
    });
    
    credits.sort(compare_objects_by_amount_key);
    debts.sort(compare_objects_by_amount_key);
    
    angular.forEach(credits, function (credit) {
        angular.forEach(debts, function (debt) {
            if (debt.amount && debt.amount <= credit.amount) {
                reimbusements.push({
                    creditor: credit.name,
                    debtor: debt.name,
                    amount: debt.amount
                });
                credit.amount -= debt.amount;
                debt.amount = 0;
            }
        });
        
        // There haven't been enough small enough amounts from the debtors to
        // easily pay off this creditor, so partially recover payment from the
        // debtors
        if (credit.amount) {
            angular.forEach(debts, function (debt) {
                if (debt.amount && credit.amount) {
                    reimbusements.push({
                        creditor: credit.name,
                        debtor: debt.name,
                        amount: credit.amount
                    });
                    debt.amount -= credit.amount;
                    credit.amount = 0;
                }
            });
        }
    });
    
    return reimbusements;
};


var compare_objects_by_name_key = function (a, b) {
    if (a.name === b.name) {
        return 0;
    } else if (a.name < b.name) {
        return -1;
    } else {
        return 1;
    }
};


var compare_objects_by_amount_key = function (a, b) {
    return b.amount - a.amount;
};
