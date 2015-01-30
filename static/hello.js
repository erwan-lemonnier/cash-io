$(document).ready(function() {
    $.ajax({
        url: "http://127.0.0.1:8080/learning/jquery"
    }).then(function(data) {
       $('.greeting-id').append(data.id);
       $('.greeting-content').append(data.content);
       $('.state-log').append('started<br>')
       $('.state-log').append('got '+data+'<br>')
    });
});