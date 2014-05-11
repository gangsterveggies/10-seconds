Meteor.publish(null, function() {
  Meteor.users.find({ "status.online": true }).observe({
    removed: function(user) {
      if (user.roomId) {
        var room = Rooms.findOne(user.roomId);

        if (room) {
          Meteor.call('exit', user._id);
        }
      }
    }
  });
});
