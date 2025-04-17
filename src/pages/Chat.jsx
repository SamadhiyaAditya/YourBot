import React, { useEffect, useState, useRef } from 'react';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    doc,
    getDocs,
    deleteDoc,
    updateDoc
} from 'firebase/firestore';
import { db, auth } from '../Firebase/firebase';
import useChatbot from '../components/useChatbot';
import InputModeToggle from '../components/InputModeToggle';
import '../styles/InputModeToggle.css';
import Logout from '../components/Auth/Logout';
import '../styles/Chat.css';
import VoiceHandler from '../components/VoiceHandler';
import '../styles/VoiceHandler.css';

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [chatId, setChatId] = useState(null);
    const [chatName, setChatName] = useState('');
    const [userChats, setUserChats] = useState([]);
    const [chatStartTime, setChatStartTime] = useState(null);
    const [isChatCreated, setIsChatCreated] = useState(false);
    const [inputMode, setInputMode] = useState(localStorage.getItem('preferredInputMode') || 'voice');
    const [botVoiceOutput, setBotVoiceOutput] = useState('');
    const [isBotSpeaking, setIsBotSpeaking] = useState(false);
    const [isStopButtonVisible, setIsStopButtonVisible] = useState(false);
    const { sendMessage } = useChatbot();
    const inputRef = useRef(null)


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    useEffect(() => {
        if (chatId) setIsChatCreated(true);
    }, [chatId]);

    const sortedChats = [...userChats].sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());

    const startNewChat = () => {
        const defaultName = new Date().toLocaleString();
        setChatName(defaultName);
        setChatStartTime(Date.now());
        setMessages([]);
        setChatId(null);
        setIsChatCreated(false);
    };

    const loadMessages = (id) => {
        const q = query(
            collection(db, 'users', auth.currentUser.uid, 'chats', id, 'messages'),
            orderBy('timestamp')
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = [];
            querySnapshot.forEach(doc => msgs.push(doc.data()));
            setMessages(msgs);
            setLoadingMessages(false);
        });
        return unsubscribe;
    };

    const loadChatList = async () => {
        const q = query(
            collection(db, 'users', auth.currentUser.uid, 'chats'),
            orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const chats = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setUserChats(chats);
    };

    useEffect(() => {
        startNewChat();
        loadChatList();
    }, []);

    useEffect(() => {
        if (!chatId) return;
        setLoadingMessages(true);
        const unsubscribe = loadMessages(chatId);
        return () => unsubscribe();
    }, [chatId]);

    useEffect(() => {
        if (chatStartTime && Date.now() - chatStartTime > 300000) {
            if (messages.length === 0 && isChatCreated) {
                deleteChat(chatId);
            }
        }
    }, [messages, chatStartTime, isChatCreated, chatId]);

    const handleInputChange = (e) => {
        setMessage(e.target.value);
        setIsTyping(true);
        clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => setIsTyping(false), 1500);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
    
        setLoadingMessages(true);
        setIsBotSpeaking(true);
        setIsStopButtonVisible(true);
    
        try {
            let currentChatId = chatId;
    
            if (!isChatCreated) {
                const defaultName = chatName || new Date().toLocaleString();
                const newChatRef = await addDoc(collection(db, 'users', auth.currentUser.uid, 'chats'), {
                    name: defaultName,
                    createdAt: serverTimestamp(),
                    timestamp: serverTimestamp(),
                });
                currentChatId = newChatRef.id;
                setChatId(currentChatId);
                setIsChatCreated(true);
                setChatStartTime(Date.now());
            } else {
                const existingChatRef = doc(db, 'users', auth.currentUser.uid, 'chats', currentChatId);
                await updateDoc(existingChatRef, {
                    timestamp: serverTimestamp()
                });
            }

            await addDoc(
                collection(db, 'users', auth.currentUser.uid, 'chats', currentChatId, 'messages'),
                {
                    message,
                    uid: auth.currentUser.uid,
                    displayName: auth.currentUser.displayName,
                    timestamp: serverTimestamp(),
                    sender: 'user'
                }
            );
    
            setMessage('');
            await loadChatList();
    
            const systemPrompt = `You are a multilingual chatbot. Detect the language of the user's input. If it’s not English, respond in that same language and also provide the English translation in brackets. If it is English, reply normally.`;
    
            const { botMessage } = await sendMessage(message, systemPrompt);
    
            await addDoc(
                collection(db, 'users', auth.currentUser.uid, 'chats', currentChatId, 'messages'),
                {
                    message: botMessage,
                    uid: 'bot',
                    displayName: 'AI Bot',
                    timestamp: serverTimestamp(),
                    sender: 'bot'
                }
            );
    
            setBotVoiceOutput(botMessage);
    
            window.speechSynthesis.cancel();
    
            const speech = new SpeechSynthesisUtterance(botMessage);
    
            speech.onend = () => {
                setIsBotSpeaking(false);
                setLoadingMessages(false);
                setIsStopButtonVisible(false);
            }

            window.speechSynthesis.speak(speech);
    
            if (inputMode !== 'text') {
                setIsStopButtonVisible(true);
            }
    
        } catch (error) {
            console.error('Error sending message:', error);
            setIsBotSpeaking(false);
            setLoadingMessages(false);
            setIsStopButtonVisible(false);
        }
    };
    

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setIsBotSpeaking(false);
        setLoadingMessages(false);
        setIsStopButtonVisible(false);
    };

    const deleteChat = async (id) => {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'chats', id));
        loadChatList();
        if (chatId === id) startNewChat();
    };

    const handleRenameChat = async (newName) => {
        if (!chatId || !isChatCreated || !newName?.trim()) {
            alert("Can't rename an empty chat!");
            return;
        }

        try {
            const chatRef = doc(db, 'users', auth.currentUser.uid, 'chats', chatId);
            await updateDoc(chatRef, { name: newName });
            setChatName(newName);
            loadChatList();
        } catch (error) {
            console.error('Error renaming chat:', error);
        }
    };

    return (
        <div className="chat-layout">
            <div className="sidebar">
                <button onClick={startNewChat} className="new-chat-button">+ New Chat</button>
                <div className="chat-history">
                    {sortedChats.map(chat => (
                        <div key={chat.id} className={`chat-item ${chat.id === chatId ? 'active' : ''}`}>
                            <span onClick={() => {
                                setChatId(chat.id);
                                setChatName(chat.name);
                                setLoadingMessages(true);
                                setIsChatCreated(true)
                            }}>
                                {chat.name}
                            </span>
                            <button className="delete-chat-btn" onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Delete this chat?')) deleteChat(chat.id);
                            }}>
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
                <Logout />
            </div>

            <div className="chat-container">
                <h2>
                    <InputModeToggle inputMode={inputMode} setInputMode={setInputMode} />
                    {chatName}
                    <button onClick={() => {
                        const newName = prompt("Enter new name for the chat");
                        if (newName) handleRenameChat(newName);
                    }}>
                        Rename
                    </button>
                </h2>

                <div className="messages-container">
                    {loadingMessages ? (
                        <div className="spinner">Loading messages...</div>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className="message">
                                <span className="message-user">{msg.displayName}: </span>
                                <span className="message-text">{msg.message}</span>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {isTyping && <div className="typing-indicator">You're typing...</div>}
                {inputMode === 'voice' && (
                    <VoiceHandler
                        inputMode={inputMode}
                        onVoiceInput={(voiceText) => {
                            setMessage(voiceText);
                            inputRef.current?.focus();
                        }}

                        botResponseToSpeak={botVoiceOutput}
                    />
                )}





                <form onSubmit={handleSendMessage} className="message-form">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type your message"
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                    />

                    {(loadingMessages || isBotSpeaking) && (
                        <div className="loader"></div>
                    )}
                    {isStopButtonVisible && (
                        <button onClick={handleStop}>Stop</button>
                    )}


                    <button type="submit">Send</button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
