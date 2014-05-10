Meteor.subscribe('ownUser');
Meteor.subscribe('results');

var currentNumber = 1;
var currentNumberDeps = new Deps.Dependency;

Template.main.currentNumber = function() {
  currentNumberDeps.depend();

  return currentNumber;
};

Template.main.results = function() {
  return Results.find({ }, { sort: { number: -1 } });
};

Template.main.currentTime = function() {
  currentNumberDeps.depend();

  var time;

  Meteor.call('getCurrentTime', function(err, res) {
    if (err) {
      console.log('An error occured: ' + err);
    } else {
      time = res;
    }
  });

  return time;
};

Template.main.rendered = function() {
  setInterval(function() {
    currentNumberDeps.changed();

    Meteor.call('getNumber', function(err, res) {
      if (err) {
        console.log('An error occured: ' + err);
      } else {
        currentNumber = res;
      }
    });
  }, 1000);
};

Template.main.events({
  'click #current-number': function(event) {
    var newResult = Number(event.currentTarget.innerHTML);

    Meteor.call('setResult', newResult, function(err, res) {
      if (err) {
        console.log('An error occured: ' + err);
      } else { }
    });
  },

  'click #start-game-button': function() {
    Meteor.call('startGame', function(err, res) {
      if (err) {

      } else {

      }
    });
  },

  'click #stop-game-button': function() {
    Meteor.call('stopGame', function(err, res) {
      if (err) {

      } else {

      }
    });
  }
});
