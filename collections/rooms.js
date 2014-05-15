Rooms = new Meteor.Collection('rooms');

Rooms.allow({
  insert: function(userId, room) {
    return true;
  }
});

Rooms.deny({
  update: function(userId, room, fieldNames) {
    return true;
  }
});

Meteor.methods({
  create: function() {
    var user = Meteor.user();

    if (!user) {
      return;
    }

    Meteor.users.update(
      user._id,
      { $set: { result: 0, played: false } }
    );

    var room = {
      hostId: user._id,
      status: 0,
      numbersLeft: 0,
      currentNumber: 0,
      users: []
    };

    var roomId = Rooms.insert(room);

    Meteor.users.update(
      user._id,
      { $set: { roomId: roomId } }
    );
  },

  join: function(roomId) {
    var user = Meteor.user();
    var room = Rooms.findOne(roomId);

    if (!user) {
      return;
    }

    if (!room) {
      return;
    }

    Meteor.users.update(
      user._id,
      { $set: { result: 0, played: false } }
    );

    Rooms.update(
      { _id: room._id },
      { $addToSet: { users: user._id } }
    );

    Meteor.users.update(
      user._id,
      { $set: { roomId: room._id } }
    );

    return;
  },

  exit: function() {
    var user = Meteor.user();

    if (!user) {
      return;
    }

    var room = Rooms.findOne(user.roomId);

    if (!room) {
      return;
    }

    var host = room.hostId;

    if (host === user._id) {
      Meteor.users.update(
        user._id,
        { $set: { roomId: 0 } }
      );

      var id = room._id;
      Rooms.remove(room._id);

      return;
    }

    if (!_.contains(room.users, user._id)) {
      return;
    }

    Meteor.users.update(
      user._id,
      { $set: { roomId: 0 } }
    );

    Rooms.update(room._id, { $pull : { users: user._id } });

    return;
  }
});
