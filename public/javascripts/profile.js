$(document).ready(function() {
    var panels = $('.user-infos');
    var panelsButton = $('.dropdown-user');
    panels.hide();

    if ($('#guideActivated').html() != "No") {
        updateTimeslotModal();
        updateAppointmentModal();
    }

    //console.log($('#guideActivated').html());

    $('.modal').on("click", '.timeslotDeleteButton', function() {
        var request = $.ajax({
           type: "DELETE",
           url: "/timeslot",
           data: {"randomID":this.id} // serializes the form's elements.
         });
        request.complete(function(jqXHR, textStatus) {
            if (jqXHR.status == 200) {
                updateTimeslotModal();
            }
        });
    });

    $('.modal').on("click", '.appointmentCancelButton', function() {
        var request = $.ajax({
           type: "DELETE",
           url: "/appointment/" + this.id,
         });
        request.complete(function(jqXHR, textStatus) {
            if (jqXHR.status == 200) {
                updateAppointmentModal();
            }
        });
    });

    $('.modal').on("click", '#newTimeslotButton', function() {
      postTimeslot();
    });

    $("#newTimeslotForm").submit(function(){
        postTimeslot();
        return false;
    });

    $('#newTimeslotForm').keydown(function(e) {
        if (e.keyCode == 13) {
            postTimeslot();
        }
    });

    //Click dropdown
    panelsButton.click(function() {
        //get data-for attribute
        var dataFor = $(this).attr('data-for');
        var idFor = $(dataFor);

        //current button
        var currentButton = $(this);
        idFor.slideToggle(400, function() {
            //Completed slidetoggle
            if(idFor.is(':visible'))
            {
                currentButton.html('<i class="glyphicon glyphicon-chevron-up text-muted"></i>');
            }
            else
            {
                currentButton.html('<i class="glyphicon glyphicon-chevron-down text-muted"></i>');
            }
        })
    });

});

function updateTimeslotModal() {
    var emailAddress = $('#guideEmailAddress').html();
    var request = $.ajax({
       type: "GET",
       url: "/guidetimes",
       data: {"guideEmail":emailAddress}, // serializes the form's elements.
     });
    request.success(function(jqXHR, textStatus) {
        $("#currentSlots").empty();
        $.each(request.responseJSON, function(index, value) {
            $('#currentSlots').append('<p name="slotID">' + value.time + ' on ' + value.date + '&nbsp &nbsp <a class="btn btn-sm btn-danger timeslotDeleteButton" id="' + value.randomID +'" data-original-title="Remove This Timeslot" data-toggle="tooltip" type="button"> <i>Delete</i> </a> </p>')
        });
    });
}

function updateAppointmentModal() {
    var request = $.ajax({
       type: "GET",
       url: "/appointments",
     });
    request.success(function(jqXHR, textStatus) {
        console.log("Test");
        $("#appointmentModalBody").empty();
        $.each(request.responseJSON, function(index, value) {
            $('#appointmentModalBody').append('<p name="slotID">' + value.time + ' on ' + value.date + ' with ' + value.responseEmail + '&nbsp &nbsp <a class="btn btn-sm btn-danger appointmentCancelButton" id="' + value.randomID +'" data-original-title="Cancle This Appointment" data-toggle="tooltip" type="button"> <i>Cancel</i> </a> </p>')
        });
    });
}

function postTimeslot() {
    var request = $.ajax({
           type: "POST",
           url: "/timeslot",
           data: $("#newTimeslotForm").serialize(), // serializes the form's elements.
         });
    request.complete(function(jqXHR, textStatus) {
    });
    updateTimeslotModal();
    document.getElementById("newTimeslotForm").reset();

}