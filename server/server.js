Accounts.onCreateUser(function(options, user) {
  user.result = 1;
  user.played = false;

  return user;
});

var currentTime;
var gameRunning = false;

/* Paredes Distribution */
var getNumber = function() {
  if (!gameRunning) {
    return 1;
  }

  var a = 7;
  var res = Math.ceil(a * Math.log(1 / (1 - Math.random())));

  return res;
};

var resetResults = function() {
  Results.remove({ });

  var userList = Meteor.users.find({ });

  userList.forEach(function(user) {
    Meteor.users.update(
      { emails: user.emails },
      { $set: { result: 1, played: false } }
    );
  });
};


Meteor.startup(function() {
  resetResults();
});

Meteor.methods({
  /* Get current number */
  getNumber: function() {
    if (!gameRunning) {
      return 1;
    }

    return Numbers.findOne({ }, { sort: { index: -1 } }).value;
  },

  /* Set result for user */
  setResult: function(newResult) {
    if (!gameRunning) {
      return false;
    }

    if (Meteor.user().played) {
      return false;
    }

    Meteor.users.update(
      { emails: Meteor.user().emails },
      { $set: { result: newResult, played: true }}
    );

    Results.insert({ number: newResult, emails: Meteor.user().emails[0].address });

    return currentTime;
  },

  /* Get current time */
  getCurrentTime: function() {
    return currentTime;
  },
  
  /* Start game function, called by host */
  startGame: function() {
    gameRunning = true;

    currentTime = 10;

    Meteor.setInterval(function() {
      var currentIndex = Numbers.find({ }).fetch().length;

      currentTime--;
      
      Numbers.insert({ index: currentIndex, value: getNumber() });
    }, 1000);
  },

  /* Stop game function, called by host */
  stopGame: function() {
    gameRunning = false;
    resetResults();
  }
});
