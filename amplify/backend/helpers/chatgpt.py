import openai
import os

# 環境変数からAPIキーを取得
openai.api_key = os.getenv("REACT_APP_CHATGPT_API_KEY")

def get_chatgpt_response(message, context):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "あなたはFAQとGoogleカレンダーの編集をサポートするアシスタントです。"},
                *context,
                {"role": "user", "content": message},
            ]
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        raise RuntimeError(f"ChatGPT API Error: {str(e)}")
