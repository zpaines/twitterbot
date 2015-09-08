$(document).ready(function() {
    var id = $('#appointmentID').html();
  $('#deleteButton').click(function() {
      var request = $.ajax({
         type: "DELETE",
         url: "/appointment/" + id,
       });
  });
});