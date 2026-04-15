window.addEventListener("load", function () {
  (function ($) {
    $(document).ready(function () {
      $(".process-diagram").click(function (e) {
        e.preventDefault();
        var url = $(this).data("url")
        var jsId = document.cookie;

        fetch(url, {
          method: 'POST'
        })
          .then(response => {
            return response.blob()
          })
          .then(res => {
            var temp = res.headers;
            const url1 = window.URL.createObjectURL(res);
            const link = document.createElement("a");
            link.href = url1;
            link.setAttribute("download", "process_diagram.png");
            document.body.appendChild(link);
            link.click();
            alert("Success :\nSuccessfully generated process diagram ");
          }).catch((err) => {
            alert("something went wrong");
          });
      })
    })
  })(django.jQuery);
});