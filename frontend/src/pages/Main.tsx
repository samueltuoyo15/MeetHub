import Header from '../Components/Header';
import {Link} from 'react-router-dom';
import {Video} from 'lucide-react';
const Main = () => {
  return (
    <>
    <Header />
    <section
    className="font-sans min-h-screen flex flex-col justify-center items-center bg-gray-950 p-2"
    >
      <div 
      className="leading-5 font-bold text-center">
        <h2 className="text-4xl text-green-500">Built for Conversations</h2> 
        <p className="text-3xl text-white">Scale to collaborations</p>
      </div>
      
      <Link to="/meet/new">
        <Video className="fixed w-14 h-14 bottom-5 right-7 text-green-500" />
      </Link>
    </section>
    </>
  )
}

export default Main;