window.addEventListener("load", function () {
  (function ($) {

    $(document).ready(function () {
      $(".bgvaction").click(function (e) {
        e.preventDefault();
        var check_type = $(this).attr("check_type")
        var entity_id = $(this).attr("entity_id")
        var bgv_instance_id = $(this).attr("bgv_instance_id")
        var doc_ref_id = $(this).attr("doc_ref_id")
        var professionId = $(this).attr("professionId")
        var host_url = window.location.origin + '/'
        var request_id = $(this).attr("request_id")
        var individual_id = $(this).attr("individual_id")
        var action_type = $(this).attr("action_type")
        var bodyData = {
          "entity_id": entity_id,
          "check_type": check_type,
          "host_url": host_url,
          "bgv_instance_id": bgv_instance_id,
          "professionId": professionId,
          "doc_ref_id": doc_ref_id,
          "individual_id": individual_id,
          "request_id": request_id,
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
            if (res.success==true){
              alert("Success :\n " + res.message);
            }else{
              alert("Error :\n " + res.message);
            }
            window.location.reload();
          }).catch((error) => {
            alert("Error :\nAn error occurred "+ JSON.stringify(error));
            window.location.reload();
          });
      })
    })
  })(django.jQuery);
});