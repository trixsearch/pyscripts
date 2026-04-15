def parse_flowable_content(data, formkey):
    form_io_data = {}
    for i in data:
        form_io_data[i['name']] = i["value"]
    return form_io_data


def parse_historic_flowable_content(response, formkey):
    proxy_data_dict = {}
    for i in response['data']:
        temp_varaiable = i.get('variable')
        if temp_varaiable.get("name") is not None:
            proxy_data_dict[temp_varaiable.get(
                "name")] = temp_varaiable.get("value")
            response['proxy_data'] = proxy_data_dict
    response.pop('data')
    return response
