Accounts.onCreateUser(function(options, user) {
  user.result = 0;
  user.played = false;

  return user;
});

RoomStream = new Meteor.Stream('room_streams');

RoomStream.permissions.read(function(eventName, roomId, arg1) {
  if (roomId) {
    var room = Rooms.findOne(roomId);
    var user = Meteor.users.findOne(this.userId);

    if (user && room) {
      if (room.hostId === user._id || _.contains(room.users, user._id)) {
        return true;
      }
    }
  }

  return false;
}, false);

RoomStream.permissions.write(function(eventName, roomId, arg1) {
  return false;
}, false);

var roomIntervals = { };

/* Paredes Distribution */
var getNumber = function() {
  var res = Math.ceil(7 * Math.log(1 / (1 - Math.random())));

  return res;
};

var gameOver = function(room) {
  RoomStream.emit('stop', room._id);

  Rooms.update(
    { _id: room._id },
    { $set: { status: 0,
              numbersLeft: 0,
              currentNumber: 0 }
    }
  );
};

var resetResults = function() {
  Meteor.users.update(
    { },
    { $set: { result: 0, played: false, roomId: 0 } },
    { multi: true }
  );
};

Meteor.startup(function() {
  resetResults();
  Rooms.remove({ });
});

Meteor.methods({
  /* Set result for user */
  setResult: function() {
    var user = Meteor.user();

    if (!user || user.roomId === '') {
      return 0;
    }

    var room = Rooms.findOne(user.roomId);

    if (!room || room.status !== 1) {
      return 0;
    }

    Meteor.users.update(
      user._id,
      { $set: { result: room.currentNumber, played: true }}
    );

    return room.currentNumber;
  },

  /* Start game function, called by host */
  startGame: function() {
    var user = Meteor.user();

    if (!user || user.roomId === '') {
      return;
    }

    var room = Rooms.findOne(user.roomId);

    if (!room || room.hostId !== user._id || room.status !== 0) {
      return;
    }

    Rooms.update(
      { _id: room._id },
      { $set: { status: 1,
                numbersLeft: 10,
                currentNumber: getNumber() }
      }
    );

    Meteor.users.update(
      { roomId: room._id },
      { $set: { result: 0, played: false } },
      { multi: true }
    );

    goRound(room);
  },

  /* Stop game function, called by host */
  stopGame: function() {
    var user = Meteor.user();

    if (!user || user.roomId === '') {
      return;
    }

    var room = Rooms.findOne(user.roomId);

    if (!room || room.hostId != user._id) {
      return;
    }

    Meteor.clearInterval(roomIntervals[room._id]);
    delete sessionHash[user._id];
    gameOver(room._id);
  }
});

var goRound = function(room) {
  var currentRoom = Rooms.findOne(room._id);

  if (currentRoom.numbersLeft === 0) {
    Meteor.clearTimeout(roomIntervals[room._id]);
    delete roomIntervals[room._id];

    gameOver(currentRoom);
  } else {
    var number = getNumber();

    Rooms.update(
      { _id: room._id },
      { $set: { currentNumber: number,
                numbersLeft: currentRoom.numbersLeft - 1 } }
    );

    RoomStream.emit('start', room._id, number);

    roomIntervals[room._id] = Meteor.setTimeout(function() {
      goRound(room);
    }, 1000);
  }
};
