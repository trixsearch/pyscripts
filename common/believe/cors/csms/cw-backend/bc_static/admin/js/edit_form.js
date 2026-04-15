function editForm(base_org_url, tenant, key, version, django_admin_url) {
  window.open("https://" + base_org_url + "/custom-workflow/org/" + tenant + "/formbuilder/edit?key="+key+"&version="+version+"&redirect=" + django_admin_url + "/cw/admin/org_form/organisationform?");
}