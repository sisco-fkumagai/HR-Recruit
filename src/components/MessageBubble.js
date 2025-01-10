import React from 'react';

const MessageBubble = ({ role, content }) => (
    <div className={`message-bubble-container ${role}`}>
        {role === 'bot' && (
            <img
                src="/logo192.png" /* アイコン画像のパス (public/bot-icon.png) */
                alt="Bot Icon"
                className="bot-icon"
            />
        )}
        <div className={`message-bubble ${role}`}>
            <p>{content}</p>
        </div>
    </div>
);

export default MessageBubble;