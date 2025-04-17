import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, provider, db } from '../../Firebase/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import '../../styles/form.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: username,
        email: email,
        mode: 'voice',
        chats: []
      });

      alert('User registered successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName,
        email: user.email,
        mode: 'voice',
        chats: []
      });

      alert('Google Sign-Up successful!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="form-box">
      <form onSubmit={handleEmailSignup}>
        <h2>Sign Up</h2>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
        />
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit">Register</button>
      </form>
      <div className="google-signup">
        <button onClick={handleGoogleSignup}>Sign Up with Google</button>
      </div>
    </div>
  );
};

export default Signup;
