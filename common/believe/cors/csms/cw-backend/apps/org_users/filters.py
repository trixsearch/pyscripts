OrganisationUser_filter_fields = ['userId', 'first_name', 'email','id', 'last_name', 'middle_name', 'manager__email', 'manager__first_name', 'location__name', 'employee_id', 'email_verified', 'gender', 'mobile', 'created_at', 'updated_at', 'is_active', 'is_staff']
OrganisationUser_search_fields = OrganisationUser_filter_fields + ['extra_fields']
ExternalUser_filter_fields = ['first_name', 'email', 'last_name', 'mobile', 'gender', 'created_at', 'updated_at']
ExternalUser_search_fields = ExternalUser_filter_fields + ['extra_fields']