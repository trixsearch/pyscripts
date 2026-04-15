from rest_framework import filters

class CustomSearchFilter(filters.SearchFilter):

    def get_search_fields(self, view, request):
        allowed_fields = []
        for item in request.query_params.keys():
            if item.endswith("_only"):
                allowed_fields.append(item[:-len("_only")])
        if allowed_fields:
            return allowed_fields
        return super(CustomSearchFilter, self).get_search_fields(view, request)
    
    def filter_queryset(self, request, queryset, view=None):
        return super().filter_queryset(request, queryset, view)




supported_operators_list = ['exact', 'iexact', 'contains','icontains','in','gt','gte','lt','lte','startswith','istartswith','endswith','iendswith']
def get_filter_fields(fields = None):
    filter_fields = {}
    for filter_field in fields:
        filter_fields[filter_field] = supported_operators_list
    return filter_fields