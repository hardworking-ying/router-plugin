import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// import Home from "../page/home/index.jsx";
// import Profile from "../page/profile/index.jsx";

const Hello = () => (
  <>
    <h1>哈哈哈哈哈111111</h1>
    <Link to="/home">Home</Link>
    <Link to="/profile">Profile</Link>
    <Link to="/test">Test</Link>
  </>
);

const Test = () => <div>Test Router</div>;

export default (() =>
  <div>
    <Router>
      <Hello />
      <Routes>
        __AUTO_ROUTE
        {/* <Route path="profile" element={<Profile />} />
        <Route path="home" element={<Home />} /> */}
      </Routes>
    </Router>
  </div>
);
