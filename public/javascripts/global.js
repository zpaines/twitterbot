// Userlist data array for filling in info box
var userListData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
    populateTable();
    console.log("test");
        // Username link click
    //$('#userList table tbody').on('click', 'td a.linkshowuser', showUserInfo);

});

// Functions =============================================================

// Fill table with data
function populateTable() {

    // Empty content string
    var tableContent = '';

    // jQuery AJAX call for JSON
    $.getJSON( '/guidelist', function( data ) {
        userListData = data;
        // For each item in our JSON, add a table row and cells to the content string
        console.log("Populating");
        $.each(data, function(){
            tableContent += '<p id="userInfo">';
            tableContent += '<img style="width:75px;height:auto;float:left" src=' + this.photoPath + '>';
            tableContent += '<span> Name: ' + this.guide + '</span> <br>';
            tableContent += '<span> Major: ' + this.major + '</span> <br>';
            tableContent += '<span> Language: ' + this.language + '</span><br>';
            tableContent += '</p> <br>';
        });
        console.log(tableContent);
        // Inject the whole content string into our existing HTML table
        $('#wrapper').html(tableContent);
    });
};
/*
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
*/