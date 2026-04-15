window.addEventListener("load", function () {
  (function ($) {

    $(document).ready(function () {
      $(".bgvprofilecreation").click(function (e) {
        e.preventDefault();
        var entity_id = $(this).attr("entity_id")
        var professionId = $(this).attr("professionId")
        var host_url = window.location.origin + '/'
        var action_type = $(this).attr("action_type")
        var bodyData = {
          "entity_id": entity_id,
          "host_url": host_url,
          "professionId": professionId,
          "action_type": action_type
        }
        var req_body = JSON.stringify(bodyData)
        var myHeaders = {
          "Content-Type": "application/json",
        }
        var requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: req_body,
          redirect: 'follow'
        };
        url = window.location.origin + '/api/entity/master/bgv_action'
        fetch(url, requestOptions)
          .then(response =>
            response.json()
          )
          .then(res => {
            location.reload();
            if (res.success==true){
              alert("Success :\n " + res.message);
            }else{
              alert("Error :\n " + res.message);
            }
          }).catch((error) => {
            location.reload();
            alert("Error :\nAn error occurred "+ JSON.stringify(error));
          });
      })
    })
  })(django.jQuery);
});