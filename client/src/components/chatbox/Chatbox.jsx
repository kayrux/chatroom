import React, { useState, useRef, useEffect } from 'react';
import './Chatbox.css'; // import CSS for styling
import { Button } from '@mui/material';

// Message component to display individual messages
const Message = ({ message }) => {
  return (
    <div className="message">
      <span className="username">{message.username}: </span>
      <span className="content">{message.content}</span>
    </div>
  );
};

// Chatbox component to display the chat interface
const Chatbox = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  // Function to handle sending messages
  const sendMessage = () => {
    if (inputValue.trim() !== '') {
      const newMessage = {
        username: 'You', // Assuming the user is sending the message
        content: inputValue,
      };
      setMessages([...messages, newMessage]);
      setInputValue('');
    }
  };

    // Automatically scroll to the bottom of the chat window
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
  
    useEffect(() => {
      scrollToBottom();
    }, [messages]);

  // Function to handle creating commands
  const handleCommand = (command) => {
    // Add your logic here to handle different commands
    switch (command) {
      case '/clear':
        setMessages([]);
        break;
      default:
        // Command not recognized
        setMessages([
          ...messages,
          { username: 'Bot', content: `Command "${command}" not recognized.` },
        ]);
        break;
    }
  };

  return (
    <div className="chatbox">
      <div className="messages-container">
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (inputValue.startsWith('/')) {
                handleCommand(inputValue);
              } else {
                sendMessage();
              }
            }
          }}
        />
        {/* <button >Send</button> */}
        <Button variant="outlined" color="success" onClick={sendMessage}>
                Send
        </Button>
      </div>
    </div>
  );
};

export default Chatbox;
