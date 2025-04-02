from flask import Flask, request, Response
import requests

app = Flask(__name__)

BLOCKED_HOST = "service-fb-examly-io-7tvaoi4e5q-uk.a.run.app"

@app.route("/", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
@app.route("/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
def proxy(path):
    target_url = request.url.replace(request.host_url, "")

    # Block specific host
    if BLOCKED_HOST in target_url:
        return Response("Blocked", status=403)

    try:
        # Forward the request to the actual destination
        resp = requests.request(
            method=request.method,
            url=target_url,
            headers={key: value for key, value in request.headers if key.lower() != "host"},
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=True,
            stream=True
        )

        # Send the response back to the client
        return Response(resp.content, status=resp.status_code, headers=dict(resp.headers))

    except requests.exceptions.RequestException:
        return Response("Error forwarding request", status=500)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8055)
