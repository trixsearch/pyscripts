window.addEventListener("load", function () {
    (function ($) {
        $(document).ready(function () {
            //Code that does the filtering
            let eduvElement = $("#id_education_doc_id_options");
            let empvElement = $("#id_pre_employment_doc_id_options");
            let prcElement = $("#id_professional_ref_doc_id_options");
            $("#id_profile").on('change', function (e) {
                e.preventDefault();
                $.getJSON(window.location.origin + '/api/entity/master/bgv_doc_data', { entity_id: $("#id_profile").val(), check_type: $("#id_check_type").val() }, function (j) {
                    var options = '<option value="">---??---</option>';
                    if($("#id_check_type").val() == "EDUV"){
                        for (var i = 0; i < j.length; i++) {
                            options += '<option value="' + j[i].pk + '">' + j[i].fields['level'] + '</option>';
                        }
                        $("#id_education_doc_id_options").html(options);
                        $("#id_education_doc_id_options option:first").attr('selected', 'selected');
                        prcElement.hide();
                        empvElement.hide();
                    }
                    else if($("#id_check_type").val() == "PRC"){
                        for (var i = 0; i < j.length; i++) {
                            options += '<option value="' + j[i].pk + '">' + j[i].fields['referenceProviderEmail'] + '</option>';
                        }
                        $("#id_professional_ref_doc_id_options").html(options);
                        $("#id_professional_ref_doc_id_options").attr('selected', 'selected');
                        eduvElement.hide();
                        empvElement.hide();
                        
                    }
                    else if($("#id_check_type").val() == "EMPV"){
                        for (var i = 0; i < j.length; i++) {
                            options += '<option value="' + j[i].pk + '">' + j[i].fields['employerName'] + '</option>';
                        }
                        $("#id_pre_employment_doc_id_options").html(options);
                        $("#id_pre_employment_doc_id_options").attr('selected', 'selected');
                        eduvElement.hide();
                        prcElement.hide();
                    }
                    else{
                        $("#id_education_doc_id_options").html(options);
                        $("#id_education_doc_id_options option:first").attr('selected', 'selected');
                        $("#id_professional_ref_doc_id_options").html(options);
                        $("#id_professional_ref_doc_id_options option:first").attr('selected', 'selected');
                        $("#id_pre_employment_doc_id_options").html(options);
                        $("#id_pre_employment_doc_id_options option:first").attr('selected', 'selected');
                        eduvElement.hide();
                        prcElement.hide();
                        empvElement.hide();
                    }
                });
                $("#id_profile").attr('selected', 'selected');
            });
            $("#id_check_type").on('change', function (e) {
                e.preventDefault();
                $.getJSON(window.location.origin + '/api/entity/master/bgv_doc_data', { entity_id: $("#id_profile").val(), check_type: $("#id_check_type").val() }, function (j) {
                    var options = '<option value="">---??---</option>';
                    if($("#id_check_type").val() == "EDUV"){
                        eduvElement.show();
                        for (var i = 0; i < j.length; i++) {
                            options += '<option value="' + j[i].pk + '">' + j[i].fields['level'] + '</option>';
                        }
                        $("#id_education_doc_id_options").html(options);
                        $("#id_education_doc_id_options option:first").attr('selected', 'selected');
                        prcElement.hide();
                        empvElement.hide();
                        $("#id_doc_ref_id").val('');
                    }
                    else if($("#id_check_type").val() == "PRC"){
                        prcElement.show();
                        for (var i = 0; i < j.length; i++) {
                            options += '<option value="' + j[i].pk + '">' + j[i].fields['referenceProviderEmail'] + '</option>';
                        }
                        $("#id_professional_ref_doc_id_options").html(options);
                        $("#id_professional_ref_doc_id_options").attr('selected', 'selected');
                        eduvElement.hide();
                        empvElement.hide();
                        $("#id_doc_ref_id").val('');
                    }
                    else if($("#id_check_type").val() == "EMPV"){
                        empvElement.show();
                        for (var i = 0; i < j.length; i++) {
                            options += '<option value="' + j[i].pk + '">' + j[i].fields['employerName'] + '</option>';
                        }
                        $("#id_pre_employment_doc_id_options").html(options);
                        $("#id_pre_employment_doc_id_options").attr('selected', 'selected');
                        eduvElement.hide();
                        prcElement.hide();
                        $("#id_doc_ref_id").val('');
                    }
                    else{
                        $("#id_education_doc_id_options").html(options);
                        $("#id_education_doc_id_options option:first").attr('selected', 'selected');
                        $("#id_professional_ref_doc_id_options").html(options);
                        $("#id_professional_ref_doc_id_options option:first").attr('selected', 'selected');
                        $("#id_pre_employment_doc_id_options").html(options);
                        $("#id_pre_employment_doc_id_options option:first").attr('selected', 'selected');
                        eduvElement.hide();
                        prcElement.hide();
                        empvElement.hide();
                        $("#id_doc_ref_id").val('');
                    }
                });
                $("#id_check_type").attr('selected', 'selected');
            });
            $("#id_education_doc_id_options").on('change', function (e) {
                e.preventDefault();
                $("#id_doc_id_options").attr('selected', 'selected');
                if($(this).val()){
                    $("#id_doc_ref_id").val($(this).val());
                }
            });
            $("#id_professional_ref_doc_id_options").on('change', function (e) {
                e.preventDefault();
                $("#id_doc_id_options").attr('selected', 'selected');
                if($(this).val()){
                    $("#id_doc_ref_id").val($(this).val());
                }
            });
            $("#id_pre_employment_doc_id_options").on('change', function (e) {
                e.preventDefault();
                $("#id_doc_id_options").attr('selected', 'selected');
                if($(this).val()){
                    $("#id_doc_ref_id").val($(this).val());
                }
            });

        })
    })(django.jQuery);
});