$(document).ready(function() {
    var emailAddress = $('#guideEmailAddress').html();
    console.log(emailAddress);
    console.log("test");
    var panels = $('.user-infos');
    var panelsButton = $('.dropdown-user');
    panels.hide();

    var request = $.ajax({
       type: "GET",
       url: "/guidetimes",
       data: {"guideEmail":emailAddress}, // serializes the form's elements.
     });
    request.success(function(jqXHR, textStatus) {
        console.log("Test");
        $.each(request.responseJSON, function(index, value) {
            console.log(value);
            $('#timeslotModalBody').append('<p name="slotID">' + value.time + ' on ' + value.date + '</p>')
            console.log("appended");
        });
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


    $('[data-toggle="tooltip"]').tooltip();

    $('button').click(function(e) {
        e.preventDefault();
        alert("This is a demo.\n :-)");
    });
});