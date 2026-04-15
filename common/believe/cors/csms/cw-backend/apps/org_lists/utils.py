import csv
def get_csv_data(csv_file_path):
    request_data = []
    with open(csv_file_path) as csvfile:
        csv_data = csv.reader(csvfile)
        for index, row in enumerate(csv_data):
            if index == 0:
                key = row
            if index > 0:
                var = {}
                for i,j in enumerate(row):
                    var[key[i]] = j
                request_data.append(var)
    return request_data


def strip_list_data(x):
    if isinstance(x, str):
        # to remove both the leading and trailing white spaces from the string
        return x.strip()
    if isinstance(x, list):
        return [strip_list_data(v) for v in x]
    if isinstance(x, dict):
        return dict ((strip_list_data(a), strip_list_data(b))for (a, b) in x.items())
    return x
