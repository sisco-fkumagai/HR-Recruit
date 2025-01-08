from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from helpers.calendar import handle_calendar_action
from helpers.chatgpt import get_chatgpt_response
import pandas as pd
from io import BytesIO
import os
from dotenv import load_dotenv

# 環境変数の読み込み
load_dotenv()

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 必要に応じて許可するオリジンを制限
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
async def chat_endpoint(message: str, context: list):
    try:
        response = get_chatgpt_response(message, context)
        return {"reply": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ChatGPT API Error: {str(e)}")


@app.post("/upload_excel")
async def upload_excel(file: UploadFile = File(...)):
    try:
        # アップロードされたExcelファイルを読み取る
        content = await file.read()
        df = pd.read_excel(BytesIO(content))

        # ファイル内容を処理（例: データの解析）
        results = []
        for _, row in df.iterrows():
            results.append({
                "区分": row.get("区分"),
                "日程": row.get("日程"),
                "開始時間": row.get("開始時間"),
                "終了時間": row.get("終了時間"),
                "タイトル": row.get("タイトル")
            })

        return {"message": "ファイルを解析しました。", "data": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Excel Upload Error: {str(e)}")


@app.post("/calendar")
async def calendar_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        df = pd.read_excel(BytesIO(content))

        results = []
        for _, row in df.iterrows():
            action = row.get('区分', '').lower()
            title = row.get('タイトル', '')

            if title != '空き':
                continue  # "空き"以外のタイトルは無視

            if action == '追加':
                response = handle_calendar_action(
                    action='add',
                    summary='空き',
                    start=f"{row['日程']}T{row['開始時間']}:00",
                    end=f"{row['日程']}T{row['終了時間']}:00",
                )
            elif action == '削除':
                response = handle_calendar_action(
                    action='delete',
                    event_id=row.get('イベントID')
                )
            elif action == '修正':
                response = handle_calendar_action(
                    action='update',
                    event_id=row.get('イベントID'),
                    summary='空き',
                    start=f"{row['日程']}T{row['開始時間(修正版)']}:00",
                    end=f"{row['日程']}T{row['終了時間(修正版)']}:00",
                )
            else:
                response = {"status": "error", "message": f"不明な区分: {action}"}

            results.append(response)

        return {"message": "Googleカレンダー操作が完了しました。", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calendar Endpoint Error: {str(e)}")


@app.post("/faq")
async def faq_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        # FAQ編集ロジックを追加
        return {"message": "FAQファイルが編集されました。"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FAQ Upload Error: {str(e)}")
