window.addEventListener("load", function () {
  (function ($) {
    $(document).ready(function () {
      $(".process-count").click(function (e) {
        e.preventDefault();
        var url = $(this).data("url")
        var jsId = document.cookie;
        var id = $(this).data("id")

        fetch(url)
          .then(response =>
            response.json()
          )
          .then(res => {
            htmlData = `
          
                <span>Completed : ${res.data.completed}</span>-
                <span>initiated : ${res.data.initiated}</span>-
                <span>withdrawn : ${res.data.withdrawn}</span>
            
    
            `
            $('#' + id).html(htmlData);
          }).catch((err) => {
            console.log(err);
            alert("something went wrong", err);
          });
      })
      $(".submitdate").click(function (e) {
        e.preventDefault();
        var instanceId = e.target.name

        var jsId = document.cookie;
        var from_date = $("." + instanceId + 'f').val()
        var to_date = $("." + instanceId + 't').val()
        var f = new Date(from_date);
        var t = new Date(to_date);
        t.setDate(t.getDate() + 1);
        var startYear = f.getFullYear();
        var startMonth = f.getMonth() + 1;
        var startDate = f.getDate();
        var endYear = t.getFullYear();
        var endMonth = t.getMonth() + 1;
        var endDate = t.getDate();
        var url = $(this).attr("data1") + `?startMonth=${startMonth}&startYear=${startYear}&startDate=${startDate}&endMonth=${endMonth}&endYear=${endYear}&endDate=${endDate}`
        fetch(url)
          .then(response =>
            response.json()
          )
          .then(res => {
            htmlData = `
          
                <span>Completed : ${res.data.completed}</span>-
                <span>initiated : ${res.data.initiated}</span>-
                <span>withdrawn : ${res.data.withdrawn}</span>
            
    
            `
            $('#' + instanceId).html(htmlData);
          }).catch((err) => {
            console.log(err);
            alert("something went wrong", err);
          });

      })
      $(".process-count").click()
    })
  })(django.jQuery);
});