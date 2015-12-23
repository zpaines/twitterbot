$(document).ready(function() {
    
    $('#submitButton').click(submitEdit);
    $('#infoBody').keydown(function(e) {
        if (e.keyCode == 13) {
            submitEdit();
        }
    });
});

function submitEdit() {
    data = "";
      if ($('#guidePicture').val()) {
        data += "guidePicture=" +$('#guidePicture').val() + "&";
      }
      if ($('#guideMajor').val()) {
        data += "guideMajor=" +$('#guideMajor').val() + "&";
      }
      if ($('#guideLanguage').val()) {
        data += "guideLanguage=" +$('#guideLanguage').val() + "&";
      }
      if (data.length > 0) {
        data = data.slice(0,-1);
        console.log(data);
        var request = $.ajax({
           type: "PUT",
           url: "/api/profile",
           data: data, // serializes the form's elements.
         });
        request.complete(function(jqXHR, textStatus) {
            if (jqXHR.success) {
                console.log(jqXHR.status);
                window.location = "/profile";
            } else  {
                alert("Could not update profile.");
            }
        });
      } 
};
