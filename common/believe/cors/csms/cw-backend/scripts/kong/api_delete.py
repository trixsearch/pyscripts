import requests, json

reqUrl = "https://accounts-qa.betterplace.co.in/api/identity/resource/"

headersList = {
    "authorization": "Bearer PGge4npbVQPnRhhzlhkxfYBoiyetHZ6Leprdg_AUJuQ=",
    "content-type" : "application/json"
}

response_data = []
with open("/Users/vivek/Downloads/cw_qa.json", "r") as stream:
    json_object = json.load(stream)
    for item in json_object:
        payload = item
        url = reqUrl + payload["_id"]
        response = requests.request("DELETE", url,  headers=headersList)
        response_data.append(response.text)

with open("/Users/vivek/Downloads/cw_qa_resp.json", "a") as stream2:
    json.dump(response_data, stream2)