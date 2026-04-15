# use to chop leading and training spaces before storing keys of extra_fields

def strip_keys(data):
    new_data = {}
    for key in data:
        new_data[key.strip()]=data[key]
    return new_data
