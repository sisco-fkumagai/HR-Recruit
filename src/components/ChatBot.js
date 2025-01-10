import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MessageBubble from './MessageBubble';

const ChatBot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [currentTask, setCurrentTask] = useState(null); // 現在のタスクを追跡
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isComposing, setIsComposing] = useState(false); // 変換中かどうかを追跡

    const fileInputRef = useRef(null);

    // 環境変数からバックエンドAPI URLを取得
    const apiUrl = process.env.REACT_APP_BACKEND_API_URL || 'http://127.0.0.1:8080';

    // 初期化処理
    useEffect(() => {
        setMessages([
            { role: 'bot', content: "以下のどちらの編集をしますか？ \n 1. 日程調整 \n 2. FAQ" },
        ]);
    }, []);

    // ユーザーからのメッセージ送信処理
    const sendMessage = async () => {
        if (input.trim() === '' && !selectedFile) return;

        if (selectedFile) {
            handleFileUpload();
            return;
        }

        // ユーザーのメッセージを追加
        const userMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput(''); // 入力欄をクリア

        if (!currentTask) {
            // ユーザーの選択に応じてタスクを設定
            if (/faq|2/i.test(input)) {
                setCurrentTask('faq');
                setMessages((prev) => [
                    ...prev,
                    { role: 'bot', content: 'FAQファイルをアップロードしてください。' },
                ]);
            } else if (/日程|カレンダー|1/i.test(input)) {
                setCurrentTask('calendar');
                setMessages((prev) => [
                    ...prev,
                    { role: 'bot', content: 'Googleカレンダー用のExcelファイルをアップロードしてください。' },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: 'bot', content: '対応していない操作です。もう一度選択してください。(1: 日程調整, 2: FAQ)' },
                ]);
            }
        } else {
            try {
                const response = await axios.post(`${apiUrl}/chat`, {
                    message: input,
                    context: messages.map((msg) => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                });
                setMessages((prev) => [
                    ...prev,
                    { role: 'bot', content: response.data.reply },
                ]);
            } catch (error) {
                console.error('エラー:', error.response?.data || error.message);
                setMessages((prev) => [
                    ...prev,
                    { role: 'bot', content: '申し訳ありませんが、エラーが発生しました。' },
                ]);
            }
        }
    };

    // ファイルアップロード処理
    const handleFileUpload = async () => {
        if (!selectedFile) {
            setMessages((prev) => [
                ...prev,
                { role: 'bot', content: 'ファイルを選択してください。' },
            ]);
            return;
        }

        const endpoint = currentTask === 'faq' ? 'faq' : 'calendar';
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const userMessage = {
                role: 'user',
                content: `ファイル「${selectedFile.name}」をアップロードしました。`,
            };
            setMessages((prev) => [...prev, userMessage]);

            const response = await axios.post(`${apiUrl}${endpoint}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setMessages((prev) => [
                ...prev,
                { role: 'bot', content: `アップロード成功: ${response.data.message}` },

            ]);
            // ファイル入力をリセット
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // <input type="file"> の値をリセット
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { role: 'bot', content: 'ファイルアップロードに失敗しました。' },
            ]);
        } finally {
            setIsUploading(false);
        }
    };


    // Enterキーでメッセージ送信
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isComposing) {
            e.preventDefault(); // デフォルトのEnter動作を防ぐ
            sendMessage(); //送信処理を実行
        }
    };

    return (
        <div className="chatbot">
            <div className="messages">
                {messages.map((msg, index) => (
                    <MessageBubble key={index} role={msg.role} content={msg.content} />
                ))}
            </div>
            <div className="input-container">
                <div className="file-upload-container">
                    <input
                        type="file"
                        accept=".xlsx"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        ref={fileInputRef} // ここで参照を設定
                        id="file-upload"
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload" className="file-upload-label">
                        ファイルを選択
                    </label>
                    {/* ファイル名を表示し、アップロード後は非表示に */}
                    {selectedFile && <span>{selectedFile.name}</span>}
                    <button onClick={handleFileUpload} disabled={!selectedFile || isUploading}>
                        {isUploading ? 'アップロード中...' : 'アップロード'}
                    </button>
                </div>
                <div className="text-input">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown} // Enterキーの押下処理
                        onCompositionStart={() => setIsComposing(true)} // IME変換開始
                        onCompositionEnd={() => setIsComposing(false)} // IME変換終了
                        placeholder="メッセージを入力..."
                    />
                    <button onClick={sendMessage}>送信</button>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;