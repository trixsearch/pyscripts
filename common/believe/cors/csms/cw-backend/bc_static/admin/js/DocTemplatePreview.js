window.addEventListener("load", function () {
  (function ($) {
    const tenant_id = $(this).data('id_tenant');
    const API_URL = "/cw/" + tenant_id + "/config/parse_jinja";

    const getBlobURL = (code, type) => {
      const blob = new Blob([code], { type });
      return window.URL.createObjectURL(blob);
    };

    $(document).ready(function () {
    const tenant_id = $(this).data('id_tenant');
    const API_URL = "/cw/" + tenant_id + "/config/parse_jinja";

      // Button and an iframe is appended to the main content.

      $("#content-main").append(`
  <div class="container">
    <div>
      <h2 class="template-preview-toolbar-label">Template Preview Actions</h2>
      <span style="color:red;">Note: If there are any template filters, please remove them manually from extracted variables area.</span>
      <div class="template-preview-toolbar">
        <button id="extract-vars" class="preview-btn bg-black" title="Click to extract variables declared in template to below textarea.">Extract Variables</button>
        <button id="preview-btn" class="preview-btn bg-black">Preview Template</button>
        <button id="preview-pdf" class="preview-btn bg-black">Preview PDF</button>
      </div>
    </div>
    <div class="template-preview">
      <label for="template-variables">Variables declared in template</label>
      <textarea id="template-variables" placeholder="Add values for template in JSON format" />
    </div>
    <iframe id="preview-frame" style="height:1px;width: 1px;display:none"></iframe>
  </div>
  `);

      // iframe Element
      const previewFrame = frames["preview-frame"];

      // values text-area
      let variable_values = $("textarea#template-variables");

      // the id attribute of html text-area, is used to extract jinja-html text.
      const jinjaText = $("#id_html");

      const handleIframeDimensions = () => {
        // Initially Iframe is not displayed, once preview button is clicked
        // its height, width, and display properties are chnaged.
        previewFrame.style.display = "block";
        previewFrame.style.height = window.innerHeight + "px";
        previewFrame.style.width = "100%";
      };

      // Event handler for preview html button
      $("#preview-btn").click(function (e) {
        handleIframeDimensions();
        handleHTML(jinjaText, variable_values, previewFrame);
      });

      $("#preview-pdf").click(function (e) {
        handleIframeDimensions();
        handlePdf(jinjaText, variable_values, previewFrame);
      });

      $("#extract-vars").click(function (e) {
        let extracted_variables = extractVariables(jinjaText);

        let stringified_extracted_variables = JSON.stringify(
          extracted_variables.reduce(
            (acc, val) => ({
              ...acc,
              [val]: `\$\{${val}\}`,
            }),
            {}
          ),
          null,
          "\n"
        );

        if (extracted_variables.length) {
          variable_values.val(stringified_extracted_variables);
        }
      });
    });

    const extractVariables = (jinjaText) => {
      let result = (' ' + jinjaText.val()).slice(1);;
      result = result
        .split("data.")
        .slice(1)
        .map(ele => ele.split(/(\{\{|\}\}|%\}|\=\=|\|)/))
        .map(ele => (ele[0] && ele[0].trim()))
      console.log(result);
      return result;
    };


    const handleHTML = (jinjaText, values, previewFrame) => {
      let variables_data = values.val() ? JSON.parse(values.val()) : {};

      fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: jinjaText.val(),
          variables: variables_data,
          doc_type: "HTML",
        }),
      })
        .then((response) => response.text())
        .then((res) => {
          let BLOB_URL = getBlobURL(res, "text/html");

          previewFrame.src = BLOB_URL;
        })
        .catch((err) => {
          console.log(err);
          alert("something went wrong");
        });
    };

    const handlePdf = (jinjaText, values, previewFrame) => {
      let variables_data = values.val() ? JSON.parse(values.val()) : {};
      fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: jinjaText.val(),
          variables: variables_data,
          doc_type: "PDF",
        }),
      })
        .then((response) => response.blob())
        .then((res) => {
          let BLOB_URL = getBlobURL(res, "application/pdf");

          previewFrame.src = BLOB_URL;
        })
        .catch((err) => {
          console.log(err);
          alert("something went wrong");
        });
    };
  })(django.jQuery);
});