import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import Main from './pages/Main';
import CreateMeet from './pages/CreateMeet';
import Room from './pages/Room';
import NotFoundPage from './pages/NotFoundPage';
function App() {
 return (
    <>
     <Router>
      <Routes>
     <Route path="/" element={<Main />}/>
     <Route path="/meet/new" element={<CreateMeet />} />
     <Route path="/meet/room/:roomId" element={<Room />}/>
     <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
    </>
  )
}

export default App
