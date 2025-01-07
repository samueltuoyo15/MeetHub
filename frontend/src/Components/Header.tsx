import {Github, AlignJustify} from 'lucide-react'
const Header = () => {
  return (
    <header
    className="fixed w-full text-lg flex justify-between items-center bg-gray-950 p-2">
      <div className="text-white">
        <AlignJustify className="inline mr-3"/>
        Video Call
        </div>
      
      <div
      className="bg-black px-5 text-white rounded py-2"
      ><Github className="mr-3 inline"/> Github</div>
    </header>
  );
};

export default Header;