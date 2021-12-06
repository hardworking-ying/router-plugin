
import React from 'react';
import { BrowserRouter as Router, Routes, Link } from 'react-router-dom';

const Hello = () => <>
    <h1>哈哈哈哈哈111111</h1>
    <Link to="/home">Home</Link> 
    <Link to="/profile">Profile</Link>
    <Link to="/test">Test</Link>
  </>;

const Test = () => <div>Test Router</div>;

export default (() => <div>
    <Router>
      <Hello />
      <Routes>
    </Routes>
    </Router>
  </div>);