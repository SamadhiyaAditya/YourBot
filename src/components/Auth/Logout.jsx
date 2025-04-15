import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../Firebase/firebase';
import { useNavigate } from 'react-router-dom';
import '../../styles/Logout.css';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      Logout
    </button>
  );
};

export default Logout;
