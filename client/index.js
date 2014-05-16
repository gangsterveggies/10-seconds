Meteor.subscribe('ownUser');
Meteor.subscribe('rooms');
Meteor.subscribe('users');

var Game = {
  variables: { },

  dependencies: {
    currentNumberDeps: new Deps.Dependency,
    chosenNumberDeps: new Deps.Dependency,
    timeLeftDeps: new Deps.Dependency,
    onRoundEndDeps: new Deps.Dependency,
    inGameDeps: new Deps.Dependency
  },

  resetVariables: function() {
    this.variables.currentNumber = 0;
    this.variables.chosenNumber = -1;
    this.variables.startTime = -1;
    this.variables.onRoundEnd = 0;
    this.variables.scoreWinner = -1;
    this.variables.updateTime = 0;
    this.variables.inGame = false;

    this.dependencies.currentNumberDeps.changed();
    this.dependencies.chosenNumberDeps.changed();
    this.dependencies.timeLeftDeps.changed();
    this.dependencies.onRoundEndDeps.changed();
    this.dependencies.inGameDeps.changed();
  }
};

Game.resetVariables();

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
  Game.dependencies.currentNumberDeps.depend();

  return Game.variables.currentNumber.toString();
};

Template.main.chosenNumber = function() {
  Game.dependencies.chosenNumberDeps.depend();

  return Game.variables.chosenNumber.toString();
};

Template.main.chosen = function() {
  Game.dependencies.chosenNumberDeps.depend();

  return Game.variables.chosenNumber >= 0;
};

Template.main.inGame = function() {
  Game.dependencies.inGameDeps.depend();

  return Game.variables.inGame > 0;
};

Template.main.currentTime = function() {
  Game.dependencies.timeLeftDeps.depend();

  var timeStr = '';
  var tmp = Math.max(10000.0 - (Date.now() - Game.variables.startTime), 0.0);

  timeStr += (Math.floor(tmp / 1000)).toString() + ':';
  tmp -= Math.floor(tmp / 1000) * 1000;

  timeStr += (Math.floor(tmp / 10)).toString() + ':';
  tmp -= Math.floor(tmp / 10) * 10;

  timeStr += tmp;

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

Template.main.onRoundEnd = function() {
  Game.dependencies.onRoundEndDeps.depend();

  return Game.variables.onRoundEnd;
};

Template.main.events({
  'click #choose-number': function(event) {
    event.preventDefault();

    if (Game.variables.chosenNumber < 0) { // FIXME Client side??
      Meteor.call('setResult', function(error, result) {
        if (error) {
          console.log('An error occured: ' + error);
        } else {
          Game.variables.chosenNumber = result;

          Game.dependencies.chosenNumberDeps.changed();
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

RoomStream.on('start', function(roomId, number) {
  Game.variables.currentNumber = number;
  Game.dependencies.currentNumberDeps.changed();

  if (Game.variables.startTime < 0) {
    Game.variables.startTime = Date.now();

    Game.variables.inGame = true;
    Game.dependencies.inGameDeps.changed();
  }

  Meteor.clearInterval(Game.variables.updateTime);

  updateTime = Meteor.setInterval(function() {
    Game.dependencies.timeLeftDeps.changed();
  }, 100);
});

RoomStream.on('stop', function() {
  Meteor.clearInterval(updateTime);

  Game.resetVariables();
  Game.variables.onRoundEnd = 1;
});
