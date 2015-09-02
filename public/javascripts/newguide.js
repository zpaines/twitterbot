$(document).ready(function() {
	border = $("#passwordConfirm").css("border");
	$("#passwordConfirm").keyup(checkPasswordMatch);
	$("#formAddGuide").submit(function() {
		if (!(checkPasswordMatch())) {
			alert("Passwords Must Match");
			return false;
		}
	});
});

function checkPasswordMatch() {
    var password = $("#password").val();
    var confirmPassword = $("#passwordConfirm").val();

    if (confirmPassword.length == 0) {
    	$("#passwordConfirm").css("border", border);
    	return false;
    } else if (password != confirmPassword) {
    	$("#passwordConfirm").css("border", "1px solid red");
    	return false;
    } else {
    	$("#passwordConfirm").css("border", "1px solid green");
    	return true;
    }
}
