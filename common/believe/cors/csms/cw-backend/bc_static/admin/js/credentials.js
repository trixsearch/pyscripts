window.addEventListener("load", function () {
  (function ($) {

    $(document).ready(function () {
      $(".clickme1").click(function (e) {
        e.preventDefault();
        var instanceId = e.target.name
        var url = $(this).attr("data1")
        var base_org_domain_url = $(this).attr("data2")

        $.ajax({
          url: url,
          type: "POST",
          data: {
            "instance_id": instanceId,
          },
          success: function (response) {
            designer_url = response.data.designer_url
            username = response.data.username
            password = response.data.password
            token = response.data.token
            idm_url = response.data.idm_url
            platform_url = response.data.platform_url
            htmlData = `
        <form name="formModelerIdm" action=${idm_url}  method="post">
            <input hidden id="j_username" type="text" value=${username} name="j_username" />
            <input hidden id="j_password" type="text" value=${password} name="j_password" />
            <input hidden id="_spring_security_remember_me" type="text" value="true" name="_spring_security_remember_me" />
            <input hidden id="j_modelerhost" type="text" value=${designer_url} name="j_modelerhost" />
            <input hidden id="j_apitoken" type="text" value=${token} name="j_apitoken" />
            <input hidden id="j_platform_url" type="text" value=${platform_url} name="j_platform_url" />
            <input hidden id="j_hostname" type="text" value=${window.location.href} name="j_hostname" />
            <input hidden id="submit" type="text" value="Login" name="submit" />
            <div>
              <button class="button clickme1" type="submit">Click here to go to Modeller</button>
            </div>
        </form>
        `
            $('#content').html(htmlData);

          },
          error: function (jqXHR, textStatus, ex) {
            if (jqXHR.responseJSON && jqXHR.responseJSON.message) alert("Error :\n" + jqXHR.responseJSON.message);
            else alert("Error :\nAn error occurred ");
          }
        });
      })
    })
  })(django.jQuery);
});

