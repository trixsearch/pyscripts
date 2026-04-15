from django.contrib.admin.filters import (
    SimpleListFilter,
    AllValuesFieldListFilter,
    ChoicesFieldListFilter,
    RelatedFieldListFilter,
    RelatedOnlyFieldListFilter
)


class SimpleDropdownFilter(SimpleListFilter):
    template = 'utils/admin_filters/templates/dropdown_filter.html'


class DropdownFilter(AllValuesFieldListFilter):
    template = 'utils/admin_filters/templates/dropdown_filter.html'


class ChoiceDropdownFilter(ChoicesFieldListFilter):
    template = 'utils/admin_filters/templates/dropdown_filter.html'


class RelatedDropdownFilter(RelatedFieldListFilter):
    template = 'utils/admin_filters/templates/dropdown_filter.html'


class RelatedOnlyDropdownFilter(RelatedOnlyFieldListFilter):
    template = 'utils/admin_filters/templates/dropdown_filter.html'