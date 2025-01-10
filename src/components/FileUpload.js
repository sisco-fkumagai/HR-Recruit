import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = ({ task, onFileUpload }) => {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(''); // アップロード状況
    const [isUploading, setIsUploading] = useState(false); // アップロード中かどうか

    // 環境変数からバックエンドAPI URLを取得
    const apiUrl = process.env.REACT_APP_BACKEND_API_URL || 'http://127.0.0.1:8080';

    // ファイル選択処理
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setUploadStatus(''); // ステータスをリセット
    };

    // ファイルアップロード処理
    const handleUpload = async () => {
        if (!file) {
            setUploadStatus('ファイルを選択してください。');
            return;
        }

        const endpoint = task === 'faq' ? 'faq' : 'calendar';
        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true); // アップロード中フラグをセット

        try {
            const response = await axios.post(`${apiUrl}${endpoint}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const successMessage = `アップロード成功: ${response.data.message}`;
            setUploadStatus(successMessage);

            // 親コンポーネントへの通知
            if (onFileUpload) {
                onFileUpload(successMessage);
            }
        } catch (error) {
            console.error(error);

            const errorMessage =
                error.response?.data?.detail || 'アップロードに失敗しました。再度お試しください。';
            setUploadStatus(errorMessage);

            // 親コンポーネントへの通知
            if (onFileUpload) {
                onFileUpload(errorMessage);
            }
        } finally {
            setIsUploading(false); // アップロード中フラグを解除
        }
    };

    return (
        <div className="file-upload">
            <div>
                <label htmlFor="file-upload">ファイルを選択: </label>
                <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                />
                {file && <p>選択されたファイル: {file.name}</p>}
            </div>
            <button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'アップロード中...' : 'アップロード'}
            </button>
            {uploadStatus && <p>{uploadStatus}</p>} {/* アップロード状況を表示 */}
        </div>
    );
};

export default FileUpload;
