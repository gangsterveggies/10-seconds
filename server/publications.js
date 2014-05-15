Meteor.publish('ownUser', function() {
  return Meteor.users.find(this.userId, { fields: { result: true, roomId: true } });
});

Meteor.publish('users', function() {
  return Meteor.users.find({ }, { fields: { result: true, emails: true } });
});

Meteor.publish('rooms', function() {
  return Rooms.find({ });
});
