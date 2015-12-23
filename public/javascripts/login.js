$(document).ready(function() {
	$("#loginForm").submit(function() {
		var request = $.ajax({
           type: "POST",
           url: "/api/login",
           data: $("#loginForm").serialize(), // serializes the form's elements.
         });
		request.complete(function(jqXHR, textStatus) {
			if (jqXHR.status == 215) {
				console.log("Bad Entry");
				$('#errorMessage').empty();
				$('#passwordField').css('border', '1px solid #ff0000');
				$('#emailField').css('border', '1px solid #ff0000');
				$('#errorMessage').append("<p style='color:red; font-size:15px'> Bad Username or Password </p>");
			} else if (jqXHR.status == 200) {
				window.location = "/profile";
			}
		});
		return false;
	});
});
