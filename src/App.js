import React from 'react';
import { Routes,Route } from 'react-router-dom';
import Home from './Components/home';
import Webk6 from './Components/webk6';
import Apik6 from './Components/apik6';
import ApiGroup from './Components/api-group';


function App() {
  return (
    <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/webk6" element={<Webk6 />} />
    <Route path="/apik6" element={<Apik6 />}/>
    <Route path="/apigroupk6" element={<ApiGroup />}/>
  </Routes>
  );
}

export default App;
