Meteor.subscribe('ownUser');
Meteor.subscribe('rooms');
Meteor.subscribe('users');

var currentNumber = 0;
var currentNumberDeps = new Deps.Dependency;;
var chosenNumber = -1;
var chosenNumberDeps = new Deps.Dependency;
var startTime = -1;
var timeLeftDeps = new Deps.Dependency;
var lastRound = 0;
var lastRoundDeps = new Deps.Dependency;
var userWinner;
var scoreWinner = -1;
var updateTime;
var inGameDeps = new Deps.Dependency;
var inGame = false;

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
  currentNumberDeps.depend();

  return currentNumber.toString();
};

Template.main.chosenNumber = function() {
  chosenNumberDeps.depend();

  return chosenNumber.toString();
};

Template.main.chosen = function() {
  chosenNumberDeps.depend();

  return chosenNumber >= 0;
};

Template.main.inGame = function() {
  inGameDeps.depend();

  return inGame > 0;
};

Template.main.currentTime = function() {
  timeLeftDeps.depend();

  var timeStr = "";
  var tmp = Math.max(10000.0 - (Date.now() - startTime), 0.0);

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
  lastRoundDeps.depend();

  return lastRound;
};

Template.main.events({
  'click #choose-number': function(event) {
    event.preventDefault();

    if (chosenNumber < 0) {
      Meteor.call('setResult', function(err, number) {
        if (err) {
          console.log('An error occured: ' + err);
        } else {
          chosenNumber = number;

          chosenNumberDeps.changed();
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
  currentNumber = number;
  currentNumberDeps.changed();

  if (startTime < 0) {
    startTime = Date.now();

    inGame = true;
    inGameDeps.changed();
  }

  Meteor.clearInterval(updateTime);
  updateTime = Meteor.setInterval(function() {
    timeLeftDeps.changed();    
  }, 100);
});

RoomStream.on("stop", function() {
  Meteor.clearInterval(updateTime);

  currentNumber = 0;
  currentNumberDeps.changed();

  chosenNumber = -1;
  chosenNumberDeps.changed();

  startTime = -1;

  inGame = false;
  inGameDeps.changed();

  lastRound = 1;
  lastRoundDeps.changed();
});
