Meteor.subscribe('ownUser');
Meteor.subscribe('rooms');
Meteor.subscribe('users');

var gameVariables = {
  currentNumber: 0,
  chosenNumber: -1,
  startTime: -1,
  lastRound: 0,
  scoreWinner: -1,
  updateTime: 0,
  inGame: false
};

var gameDependencies = {
  currentNumberDeps: new Deps.Dependency,
  chosenNumberDeps: new Deps.Dependency,
  timeLeftDeps: new Deps.Dependency,
  lastRoundDeps: new Deps.Dependency,
  inGameDeps: new Deps.Dependency
};

RoomStream = new Meteor.Stream('room_streams');

Template.roomList.roomCount = function() {
  return !! Rooms.find({ status: 0 }).count();
};

Template.roomList.rooms = function() {
  return Rooms.find({ status: 0 });
};

Template.room.hostMail = function() {
  return Meteor.users.findOne(this.hostId).emails[0].address;
};

Template.room.events({
  'click .join-button': function(event) {
    event.preventDefault();

    Meteor.call('join', this._id, function(error) {
      if (error) {
        throwError(error.reason);
      }
    });
  }
});

Template.roomList.events({
  'submit form': function(event) {
    event.preventDefault();

    Meteor.call('create', function(error) {
      if (error) {
        throwError(error.reason);
      }
    });
  }
});

Template.router.inRoom = function() {
  return Meteor.user().roomId;
};

Template.main.currentNumber = function() {
  gameDependencies.currentNumberDeps.depend();

  return gameVariables.currentNumber.toString();
};

Template.main.chosenNumber = function() {
  gameDependencies.chosenNumberDeps.depend();

  return gameVariables.chosenNumber.toString();
};

Template.main.chosen = function() {
  gameDependencies.chosenNumberDeps.depend();

  return gameVariables.chosenNumber >= 0;
};

Template.main.inGame = function() {
  gameDependencies.inGameDeps.depend();

  return gameVariables.inGame > 0;
};

Template.main.currentTime = function() {
  gameDependencies.timeLeftDeps.depend();

  var timeStr = "";
  var tmp = Math.max(10000.0 - (Date.now() - gameVariables.startTime), 0.0);

  timeStr += (Math.floor(tmp / 1000)).toString() + ":";
  tmp -= Math.floor(tmp / 1000) * 1000;

  timeStr += (Math.floor(tmp / 10)).toString() + ":";
  tmp -= Math.floor(tmp / 10) * 10;

  timeStr += tmp.toString();

  return timeStr;
};

Template.main.users = function() {
  var room = Rooms.findOne(Meteor.user().roomId);
  var usernames = room.users;
  var users = [];
  usernames.push(room.hostId);

  for (var i = 0; i < usernames.length; i++) {
    users.push({ email: Meteor.users.findOne(usernames[i]).emails[0].address });
  }

  return users;
};

Template.main.results = function() {
  var room = Rooms.findOne(Meteor.user().roomId);
  var usernames = room.users;
  var users = [];
  usernames.push(room.hostId);

  for (var i = 0; i < usernames.length; i++) {
    var user = Meteor.users.findOne(usernames[i]);

    users.push({ email: user.emails[0].address, number: user.result });
  }

  users.sort(function(u1, u2) {
    return u1.number < u2.number;
  });

  if (users.length > 1) {
    if (users[0].number > users[1].number) {
      userWinner = users[0].email;
      scoreWinner = users[0].number;
    } else {
      scoreWinner = -1;
    }
  } else {
    userWinner = users[0].email;
    scoreWinner = users[0].number;
  }

  return users;

};

Template.main.winner = function() {
  return scoreWinner >= 0;
};

Template.main.roundWinner = function() {
  return userWinner;
};

Template.main.roundWinnerScore = function() {
  return scoreWinner;
};

Template.main.lastRound = function() {
  gameDependencies.lastRoundDeps.depend();

  return gameVariables.lastRound;
};

Template.main.events({
  'click #choose-number': function(event) {
    event.preventDefault();

    if (gameVariables.chosenNumber < 0) {
      Meteor.call('setResult', function(err, number) {
        if (err) {
          console.log('An error occured: ' + err);
        } else {
          gameVariables.chosenNumber = number;

          gameDependencies.chosenNumberDeps.changed();
        }
      });
    }
  },

  'click #start-game-button': function() {
    Meteor.call('startGame');
  },

  'click #stop-game-button': function() {
    Meteor.call('stopGame');
  }
});

RoomStream.on("start", function(roomId, number) {
  gameVariables.currentNumber = number;
  gameDependencies.currentNumberDeps.changed();

  if (gameVariables.startTime < 0) {
    gameVariables.startTime = Date.now();

    gameVariables.inGame = true;
    gameDependencies.inGameDeps.changed();
  }

  Meteor.clearInterval(gameVariables.updateTime);
  updateTime = Meteor.setInterval(function() {
    gameDependencies.timeLeftDeps.changed();
  }, 100);
});

RoomStream.on("stop", function() {
  Meteor.clearInterval(updateTime);

  gameVariables.currentNumber = 0;
  gameDependencies.currentNumberDeps.changed();

  gameVariables.chosenNumber = -1;
  gameDependencies.chosenNumberDeps.changed();

  gameVariables.startTime = -1;

  gameVariables.inGame = false;
  gameDependencies.inGameDeps.changed();

  gameVariables.lastRound = 1;
  gameDependencies.lastRoundDeps.changed();
});
