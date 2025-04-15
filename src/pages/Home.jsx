import React, { useState } from 'react';
import Login from '../components/Auth/Login';
import Signup from '../components/Auth/Signup';
import '../styles/Home.css';

const Home = () => {
    const [isSignup, setIsSignup] = useState(true);

    return (
        <div className="home-container">
            <div className="guide-box">
                <h2>Welcome to VoiceBot!</h2>
                <p>💬 Talk or type to interact with the bot.</p>
                <p>🎤 Voice mode is enabled by default — you can switch to text anytime.</p>
                <p>🧠 Powered by AI — get help, generate ideas, and more!</p>
                <p>🔐 Your chats are private and saved to your account.</p>
                <p>Multi-Language support provided.</p>
                <p>Lots of other features and better UI under progress. Stay Tuned!</p>
            </div>


            <div className="form-container">
                {isSignup ? <Signup /> : <Login />}
                <p className="toggle-text">
                    {isSignup ? 'Already have an account?' : "Don't have an account?"}
                    <button className="toggle-btn" onClick={() => setIsSignup(!isSignup)}>
                        {isSignup ? 'Login' : 'Sign Up'}
                    </button>
                </p>
            </div>


        </div>
    );
};

export default Home;
