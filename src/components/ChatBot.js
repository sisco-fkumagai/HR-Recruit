import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageBubble from './MessageBubble';

const ChatBot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [currentTask, setCurrentTask] = useState(null); // 現在のタスクを追跡
    const [isComposing, setIsComposing] = useState(false); // 変換中かどうかを追跡
    const [selectedFile, setSelectedFile] = useState(null);

    // GAS URLの取得（環境変数）
    const GAS_URL = process.env.REACT_APP_GAS_URL;

    // 初期化処理
    useEffect(() => {
        setMessages([
            { role: 'bot', content: "面接日程とFAQどちらの編集をしますか？" },
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
        setMessages([...messages, userMessage]);
        setInput(''); // 入力欄をクリア

        if (!currentTask) {
            if (input.toLowerCase().includes('faq')) {
                setCurrentTask('faq');
                setMessages((prev) => [
                    ...prev,
                    { role: 'bot', content: 'FAQファイルをアップロードしてください。' },
                ]);
            } else if (input.toLowerCase().includes('日程') || input.toLowerCase().includes('カレンダー')) {
                setCurrentTask('calendar');
                setMessages((prev) => [
                    ...prev,
                    { role: 'bot', content: 'Googleカレンダー用のExcelファイルをアップロードしてください。' },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: 'bot', content: '対応していない操作です。もう一度選択してください。' },
                ]);
            }
        } else {
            // サーバーとの通信
            try {
                const response = await axios.post(`${GAS_URL}/chat`, {
                    message: input,
                    context: messages.map((msg) => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                });

                // サーバーの応答を追加
                const botMessage = { role: 'bot', content: response.data.reply };
                setMessages((prev) => [...prev, botMessage]);
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
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile); // キー名をバックエンドと一致させる

        try {
            const response = await axios.post(`${GAS_URL}/calendar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const successMessage = `アップロード成功: ${response.data.message}`;
            setMessages((prev) => [...prev, { role: 'bot', content: successMessage }]);
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'アップロードに失敗しました。';
            setMessages((prev) => [...prev, { role: 'bot', content: errorMessage }]);
        } finally {
            setSelectedFile(null); // 選択ファイルのリセット
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
                    <label htmlFor="file-upload" className="file-upload-label">
                        ファイルを選択
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".xlsx"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                    {selectedFile && <span>{selectedFile.name}</span>}
                    <button onClick={handleFileUpload} disabled={!selectedFile}>
                        アップロード
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
