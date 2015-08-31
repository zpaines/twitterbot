// Userlist data array for filling in info box
//var userListData = [];
timeslots = [];
guideTimeslots = [];
startDate = null;
endDate = null;
// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
        // Username link click
    //$('#userList table tbody').on('click', 'td a.linkshowuser', showUserInfo);
    $('#updateButton').click(function() {
    	getData(filterGuidesDate());
      //filterGuidesDate();
    });

    var nowTemp = new Date();
    var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);

    var checkin = $('#dpd1').datepicker({
      onRender: function(date) {
        return date.valueOf() < now.valueOf() ? 'disabled' : '';
      }
    }).on('changeDate', function(ev) {
      startDate = ev.date.getFullYear() * 10000 + (ev.date.getMonth()+1) * 100 + ev.date.getDate();
      if (ev.date.valueOf() > checkout.date.valueOf()) {
        var newDate = new Date(ev.date)
        console.log(startDate);
        console.log(endDate);
        newDate.setDate(newDate.getDate() + 1);
        endDate = newDate.getFullYear() * 10000 + (newDate.getMonth()+1) * 100 + newDate.getDate();
        checkout.setValue(newDate);
      }
      checkin.hide();
      $('#dpd2')[0].focus();
    }).data('datepicker');
    var checkout = $('#dpd2').datepicker({
      onRender: function(date) {
        return date.valueOf() <= checkin.date.valueOf() ? 'disabled' : '';
      }
    }).on('changeDate', function(ev) {
      endDate = ev.date.getFullYear() * 10000 + (ev.date.getMonth()+1) * 100 + ev.date.getDate();
      console.log(startDate);
      console.log(endDate);
      checkout.hide();
    }).data('datepicker');

    $('#filterEntry').keyup( function() {
    	var textVal = $(this).val().toLowerCase();
    	$("li.col-sm-4").each(function() {
    		var text = $(this).text().toLowerCase();
    		(text.indexOf(textVal) >= 0) ? $(this).show() : $(this).hide();
    	});

    });
    $('#team_list').on("click", '.team-member', function() {
      console.log("test");
    });
    getTimeslots();

  });

// Functions =============================================================


function filterGuidesDate() {
  var validID = [];
  for (var i = startDate; i <= endDate; i++) {
    if (timeslots[i]) {
      console.log(i);
      for (var z = 0; z<timeslots[i].length; z++) {
        validID.push(timeslots[i][z].guideID);
        console.log(timeslots[i][z].guideID);
        console.log(validID);
      }
    }
  }
  console.log(validID);
  return validID;
};
// Fill table with data
function getData(validIDs) {

    // Empty content string
    var items = [];

    // jQuery AJAX call for JSON
    $.ajax({
      url: 'http://localhost:3000/guidelist',
      type: "GET",
      dataType: "json",
      error: function(jqXHR, textStatus, errorThrown) { alert(errorThrown)},
    }).done(function(data) {
      $.each(data, function(){
          //if ($.inArray(this._id, validIDs) > -1) {
            console.log(this);
            items.push(populateBox(this));
          //}
        });
      console.log(items);
      $('#team_list').html(items.join("\n"));
    });

    $('.team-member').click(function() {
    	alert("test");
    });

  };

  function populateBox(guideInfo) {
	/*boxHTML = '<li class="guideBox" style="background-color: #D3D3D3; width: 500px; margin-left: 20px; margin-right: 20px; padding-bottom: 8px; padding-left: 8px; padding-right: 8px; padding-top: 8px;">';
	boxHTML += '<a style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0"  src="' + guideInfo.photoPath +'"" width="100"/></a>';
	boxHTML += '<b>This is a colored box</b><br/>';
	boxHTML += '';
	boxHTML += '</li>';*/

	boxHTML =  '<li class="col-sm-4">' +
  '<div class="team-member">' +
  '<img src=' +  guideInfo.photoPath + ' class="img-responsive img-circle" alt="">' +
  '<h4>' + guideInfo.name + '</h4>' +
  '<p class="text-muted">' + guideInfo.major + '</p>' +
  '<button type="button" class="btn btn-primary btn-lg" data-toggle="modal" data-target="#myModal' + guideInfo._id + '">' + 
  'Make Appointment' +
  '</button>' + '<br> <br>' +
  '<ul class="list-inline social-buttons"> ' +
  '<li><a href="#"><i class="fa fa-twitter"></i></a></li>' +
  '<li><a href="#"><i class="fa fa-facebook"></i></a></li>'+
  '<li><a href="#"><i class="fa fa-linkedin"></i></a></li>' +
  '</ul>' +
  '</div>' +
  '</li>' +

  '<div class="modal fade" id="myModal' + guideInfo._id + '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">' +
  '<div class="modal-dialog" role="document">' + 
  '<div class="modal-content">' +
  '<div class="modal-header">' +
  '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
  '<h4 class="modal-title" id="myModalLabel">Modal title</h4>'+
  '</div>'+
  '<form action="/appointment" method="post">' +
  '<div class="modal-body">' +
  'Make Appointment With ' + guideInfo.major +
  '<br>Possible Times are: <br>';
  console.log(guideTimeslots[guideInfo._id]);
  if (guideTimeslots[guideInfo._id]) {
    for (var i=0; i<guideTimeslots[guideInfo._id].length; i++) {
      var slot = guideTimeslots[guideInfo._id][i];
      console.log(slot);
      boxHTML += '<input type="radio" name="slotID" value = "' + slot._id + '">' + slot.time + ' on ' + slot.dateString + '<br>';
    }
    boxHTML += '<div class="form-group">' + 
               '<label for="email">Email:</label>' + 
               '<input type="text" class="form-control" name="responseEmail" id="email">' + 
               '</div>';
  }


  boxHTML +='</div>' +
  '<div class="modal-footer">' +
  '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
  '<button type="button submit" class="btn btn-primary">Save changes</button>' +
  '</form>' +
  '</div>' +
  '</div>' +
  '</div>' +
  '</div>';

  return boxHTML;
};

function getTimeslots() {
  $.ajax({
    url: 'http://localhost:3000/times',
    type: "GET",
    dataType: "json",
    error: function(jqXHR, textStatus, errorThrown) { alert(errorThrown)},
  }).done(function(data) {
    $.each(data, function(){
      this.dateString = this.date;
      if (!guideTimeslots[this.guideID]) {
        guideTimeslots[this.guideID] = [];
      }
      guideTimeslots[this.guideID].push(this);

      this.date = this.date.split('-').join('');
      if (!timeslots[parseInt(this.date)]) {
        timeslots[parseInt(this.date)] = [];
      }
      timeslots[parseInt(this.date)].push(this);

      console.log(timeslots);
    });
  });
};

// Show User Info
function showUserInfo(event) {

    // Prevent Link from Firing
    event.preventDefault();

    // Retrieve username from link rel attribute
    var thisUserName = $(this).attr('rel');

    // Get Index of object based on id value
    var arrayPosition = userListData.map(function(arrayItem) { return arrayItem.guide; }).indexOf(thisUserName);
        // Get our User Object
        var thisUserObject = userListData[arrayPosition];

    //Populate Info Box
    $('#guideName').text(thisUserObject.guide);
    $('#guideMajor').text(thisUserObject.major);
    $('#guideLanguage').text(thisUserObject.language);
    $('#guidePicture').attr("src", thisUserObject.photoPath);

  };
