Meteor.publish('ownUser', function() {
  return Meteor.users.find(this.userId, { fields: { result: true, roomId: true } });
});

Meteor.publish('users', function() {
  return Meteor.users.find({ }, { fields: { result: true, emails: true } });
  /*
  var user = Meteor.users.findOne(this.userId);

  if (user && user.roomId) {
    return Meteor.users.find({ roomId: user.roomId }, { fields: { result: true } });
  }

  return 0;*/
});

Meteor.publish('rooms', function() {
  return Rooms.find({ });
});
