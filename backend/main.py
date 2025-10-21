from app import create_app
import os 
import openai
proxy_url = os.getenv("PROXY_URL")
os.environ["HTTP_PROXY"] = proxy_url
os.environ["HTTPS_PROXY"] = proxy_url
openai.proxy = {
    "http": proxy_url,
    "https": proxy_url,
}
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'])