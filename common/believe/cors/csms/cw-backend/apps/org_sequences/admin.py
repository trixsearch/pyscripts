from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django import forms

from import_export.admin import ImportExportActionModelAdmin

from .models import Sequence
from .resources import SequenceResource
from admin_adv_search_builder.filters import AdvancedSearchBuilder
from apps.organisations.admin import MyTenantFilterAdmin

# Register your models here.
class SequenceForm(forms.ModelForm):
    class Meta:
        model = Sequence
        fields = "__all__"
        help_texts = {'prefix': _("""from datetime import datetime<br>
                                                    CREATE_DATE_YEAR = datetime.now().year<br>
                                                    CREATE_DATE_MONTH = datetime.now().month<br>
                                                    CREATE_DATE_DAY = datetime.now().day<br>
                                                    prefix = str(eval('CREATE_DATE_YEAR')) + '/' + str(eval('CREATE_DATE_MONTH')) + '/' + str(eval('CREATE_DATE_DAY'))<br>
                                                    eval('prefix')""")

                    ,'suffix':_("""from datetime import datetime<br>
                                                    CREATE_DATE_YEAR = datetime.now().year<br>
                                                    CREATE_DATE_MONTH = datetime.now().month<br>
                                                    CREATE_DATE_DAY = datetime.now().day<br>
                                                    suffix = str(eval('CREATE_DATE_YEAR')) + '/' + str(eval('CREATE_DATE_MONTH')) + '/' + str(eval('CREATE_DATE_DAY'))<br>
                                                    eval('suffix')""")}
    def clean(self):
        name = self.cleaned_data.get('name')
        initial_value = self.cleaned_data.get('initial_value')
        obj = Sequence.objects.filter(name = name).first()
        if not initial_value:
            raise forms.ValidationError('initial value is required')
        if obj:
            if initial_value == obj.initial_value:
                self.cleaned_data['last'] = obj.last
                return self.cleaned_data
            if initial_value < obj.initial_value:
                raise forms.ValidationError('can not reset initial value less than '+ str(obj.initial_value))
            elif initial_value > obj.initial_value:
                if obj.last:
                    if initial_value > obj.last:
                        self.cleaned_data['last'] = None
                        return self.cleaned_data
                    else:
                        raise forms.ValidationError('can not reset initial value less than last value '+str(obj.last))
        return self.cleaned_data

class SequenceAdmin(ImportExportActionModelAdmin,MyTenantFilterAdmin):

    list_display = ['name', 'last', 'tenant']
    resource_class = SequenceResource
    form = SequenceForm
    search_fields = ['name']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10
    class Media:
        js = ("admin/js/sequence.js",)

admin.site.register(Sequence, SequenceAdmin)
