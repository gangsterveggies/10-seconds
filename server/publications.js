Meteor.publish('ownUser', function() {
  return Meteor.users.find(this.userId, { fields: { result: true } });
});

Meteor.publish('results', function() {
  return Results.find({ });
});

Meteor.publish('numbers', function() {
  return Numbers.find({ });
});
