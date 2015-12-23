Date.prototype.toDateInputValue = (function() {
  var local = new Date(this);
  local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
  return local.toJSON().slice(0,10);
});

Date.isLeapYear = function (year) { 
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)); 
};

Date.getDaysInMonth = function (year, month) {
    return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};

Date.prototype.isLeapYear = function () { 
    return Date.isLeapYear(this.getFullYear()); 
};

Date.prototype.getDaysInMonth = function () { 
    return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
};

Date.prototype.addMonths = function (value) {
    var n = this.getDate();
    this.setDate(1);
    this.setMonth(this.getMonth() + value);
    this.setDate(Math.min(n, this.getDaysInMonth()));
    return this;
};

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
           url: "/api/timeslot",
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
           url: "/api/appointment/" + this.id,
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

    $('.modal').on("click", '#newRepeatButton', function() {
      console.log("new repeat");
      newRepeatSlot();
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

    $('#repeatingModalButton').click(function(){
      if ($('#newTimeslotTime').val()) {
        $('#repeatTime').val($('#newTimeslotTime').val());
      }
      if ($('#newTimeslotDate').val()) {
        console.log($('#newTimeslotDate').val());
        var tmp = new Date($('#newTimeslotDate').val());
        var date = new Date(tmp.getTime() + tmp.getTimezoneOffset()*60000);
        console.log(date.getDay());
        $('#dayOfWeek').val(date.getDay());
        $('#startDate').val(date.toDateInputValue());
        var future = date.addMonths(3);
        $('#endDate').val(future.toDateInputValue());
      } else {
        var today = new Date()
        $('#startDate').val(today.toDateInputValue());
        var future = today.addMonths(3);
        $('#endDate').val(future.toDateInputValue());
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
       url: "/api/guidetimes",
       data: {"guideEmail":emailAddress}, // serializes the form's elements.
     });
    request.success(function(jqXHR, textStatus) {
        $("#currentSlots").empty();
        $.each(request.responseJSON, function(index, value) {
            $('#currentSlots').append('<div class="row" style="margin-top:10px"><p name="slotID" class ="col-xs-4">' + value.time + ' on ' + value.date + '</p> <a class="btn btn-sm btn-danger timeslotDeleteButton col-xs-2  " id="' + value.randomID +'" data-original-title="Remove This Timeslot" data-toggle="tooltip" type="button"> <i>Delete</i> </a> </div>')
        });
    });
}

function updateAppointmentModal() {
    var request = $.ajax({
       type: "GET",
       url: "/api/appointments",
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
           url: "/api/timeslot",
           data: $("#newTimeslotForm").serialize(), // serializes the form's elements.
         });
    request.complete(function(jqXHR, textStatus) {
    });
    updateTimeslotModal();
    document.getElementById("newTimeslotForm").reset();

}

function newRepeatSlot() {
  var tmp = new Date($('#startDate').val());
  var startDate = new Date(tmp.getTime() + tmp.getTimezoneOffset()*60000);
  tmp = new Date($('#endDate').val());
  var endDate = new Date(tmp.getTime() + tmp.getTimezoneOffset()*60000);
  var weekDay = $('#dayOfWeek').val();
  console.log(startDate);
  console.log(endDate);
  console.log(weekDay);
  var firstDay = new Date(startDate);
  if (startDate.getDay() != weekDay) {
    if (weekDay - startDate.getDay() > 0) {
      firstDay.setDate(firstDay.getDate() + (weekDay - startDate.getDay()));
    } else {
      firstDay.setDate(firstDay.getDate() + (7 + (weekDay - startDate.getDay())));
    }
  }
  var current = new Date(firstDay);
  while (current <= endDate) {
    console.log(current);
    var request = $.ajax({
           type: "POST",
           url: "/api/timeslot",
           data: {'date': current.getFullYear()+"-"+(current.getMonth()+1)+"-"+current.getDate(), 'time':$('#repeatTime').val()}, // serializes the form's elements.
         });
    request.complete(function(jqXHR, textStatus) {
      console.log("Completed " + textStatus);
    });
    current.setDate(current.getDate() + 7);
  }
  updateTimeslotModal();
  document.getElementById("newTimeslotForm");
  $("#repeatingModal").modal('hide');

}