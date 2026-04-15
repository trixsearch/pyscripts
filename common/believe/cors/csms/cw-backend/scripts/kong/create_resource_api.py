import requests, json

reqUrl = "https://accounts-qa.betterplace.co.in/api/identity/resource"

headersList = {
    "authorization": "Bearer PGge4npbVQPnRhhzlhkxfYBoiyetHZ6Leprdg_AUJuQ=",
    "content-type" : "application/json"
}

response_data = []
with open("/Users/vivek/Downloads/cw_response5.json", "r") as stream:
    json_object = json.load(stream)
    for item in json_object:
        payload = item
        response = requests.request("POST", reqUrl, data=json.dumps(payload),  headers=headersList)
        response_data.append(response.text)

with open("/Users/vivek/Downloads/cw5.json", "a") as stream2:
    json.dump(response_data, stream2)