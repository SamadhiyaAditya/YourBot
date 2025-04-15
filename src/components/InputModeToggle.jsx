import React from 'react';

const InputModeToggle = ({ inputMode, setInputMode }) => {
  const toggleMode = () => {
    const newMode = inputMode === 'voice' ? 'text' : 'voice';
    setInputMode(newMode);
    localStorage.setItem('preferredInputMode', newMode);
  };

  return (
    <div className="toggle-mode-container">
      <button onClick={toggleMode} className="toggle-mode-btn">
        {inputMode === 'voice' ? 'Switch to Text Mode' : 'Switch to Voice Mode'}
      </button>
    </div>
  );
};

export default InputModeToggle;
