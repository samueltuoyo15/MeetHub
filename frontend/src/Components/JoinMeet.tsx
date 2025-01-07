import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {useNavigate} from "react-router-dom";
const JoinMeet = ({toggle, setToggle}: {toggle: boolean; setToggle: React.Dispatch<React.SetStateAction<boolean>>}) => {
  const [input, setInput] = useState<string | null>(null);
  const[error, setError] = useState<string| null>(null);
  const navigate = useNavigate();
  
  const handleSubmit = (e: React.MouseEvent<HTMLDivElement>) => {
    if(!input) return setError('Please enter a valid code')
    if(!input.startsWith('meet-')) return setError('Meeting does not exists please check and try again later')
    navigate(`/meet/room/${input}`)
  }
  
return (
   <>
   {toggle && (
    <section className={`p-2 fixed top-0 left-0 z-50 h-full w-full bg-gray-800 transition-transform duration-300 ${toggle ? 'transform translate-x-0' : 'transform -translate-x-full'}`}>
      <header className="text-white flex justify-between items-center">
        <div className="text-3xl">
          <ArrowLeft onClick={() => setToggle((prev: boolean) => !prev)} className="inline mr-4" />
          <span>Join with a code</span>
        </div>
        <div className={`${!input ? 'text-gray-700' : 'text-white'} text-2xl`} onClick={handleSubmit}>Join</div>
      </header>
      
      {/* input field to paste or type the meeting id*/}
        <div className="mt-32 text-white">
        <label htmlFor="input" className="text-lg block mb-6">Enter the the meeting code or id provided by the meeting organizer.</label>
        <input
        type="text"
        id="input"
        name="input" 
        placeholder="meet-aa0e3bd7-6f57-460a-a7bf-839a62631ed5"
        onChange={(e) => setInput(e.target.value)}
        className="w-full p-4 rounded bg-gray-700 text-white"
        />
        {error && (<p className="text-red-500">{error}</p>)}
       </div>
    </section>
   )}
  </>
  );
}

export default JoinMeet;