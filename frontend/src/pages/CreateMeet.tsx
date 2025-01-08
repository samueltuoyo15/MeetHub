import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Link as RouterLink } from "react-router-dom";
import { Link as IconLink, Video, X, Copy, Share2 } from "lucide-react";
import JoinMeet from "../Components/JoinMeet";

const CreateMeet = () => {
  const [isCreateNewMeeting, setIsCreateNewMeeting] = useState(false);
  const [createNewMeetingModal, setCreateNewMeetingModal] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [toggleJoinMeeting, setToggleJoinMeeting] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const toggleCreateNewMeeting = () => setIsCreateNewMeeting((prev) => !prev);

  const generateUuid = () => {
  socket.emit("create-room", null, (roomId: string) => {
    setRoomId(roomId);
  });
};


  const openCreateMeetingModal = () => {
    generateUuid();
    setCreateNewMeetingModal(true);
  };

  const closeAllModals = () => {
    setCreateNewMeetingModal(false);
    setIsCreateNewMeeting(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !createNewMeetingModal &&
        isCreateNewMeeting &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsCreateNewMeeting(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCreateNewMeeting, createNewMeetingModal]);

  return (
    <>
      <section className="bg-gray-900 min-h-screen p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={toggleCreateNewMeeting}
            className="bg-green-500 mr-3 text-white text-lg p-2 w-full rounded-2xl"
          >
            New meeting
          </button>
          <button
            onClick={() => setToggleJoinMeeting((prev) => !prev)}
            className="border border-green-500 text-white text-lg p-2 w-full rounded-2xl"
          >
            Join with a code
          </button>
        </div>
        <figure className="mt-32 md:mt-44 mx-auto block text-center text-white">
          <img
            src="/Remote meeting-rafiki.png"
            alt="start a meeting"
            className="w-full md:w-64"
          />
          <figcaption className="font-bold text-2xl">
            Get a link you can share
          </figcaption>
          <figcaption className="text-lg">
            Tap <span className="font-bold">New meeting</span> to get a link you
            can send to people you want to meet with all over the world!
          </figcaption>
        </figure>
      </section>
      {isCreateNewMeeting && (
        <div className="fixed inset-0 bg-black opacity-50 z-10" />
      )}
      {isCreateNewMeeting && (
        <div
          ref={modalRef}
          style={{
            transform: isCreateNewMeeting
              ? "translateY(0)"
              : "translateY(100%)",
          }}
          className="fixed bottom-0 w-full p-2 text-white bg-gray-800 rounded-2xl transition-all ease-in-out delay-150 duration-300 z-20"
        >
          <div onClick={openCreateMeetingModal} className="flex items-center mb-5">
            <IconLink className="mr-3" />
            <span>Get a meeting link to share</span>
          </div>
          <RouterLink to={`/meet/room/${`meet-${uuidv4()}`}`} className="flex items-center">
            <Video className="mr-3" />
            <span>Start an instant meeting</span>
          </RouterLink>
        </div>
      )}
      {createNewMeetingModal && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-gray-800 text-white rounded-3xl p-6 z-30 transition-all duration-700 ease-in-out">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Meeting Link</h2>
            <X className="cursor-pointer" onClick={closeAllModals} />
          </div>
          <p className="text-center mb-6">
            Copy this link and send it to people you want to meet with. Be sure
            to save it so you can use it later.
          </p>
          <div className="mt-10 flex justify-between items-center p-3 bg-zinc-600 rounded-md">
            <span className="truncate">{roomId}</span>
            <Copy
              className="cursor-pointer"
              onClick={() => roomId && navigator.clipboard.writeText(roomId)}
            />
          </div>
          <div
            onClick={() => {
              const shareData = {
                title: "Your meeting code",
                text: roomId || "",
                url: "/",
              };
              navigator.share(shareData);
            }}
            className="flex items-center justify-center bg-green-500 text-white rounded-2xl mt-3 w-40 h-10 mx-auto block text-center"
          >
            <Share2 className="inline mr-3" />
            <span>Share Invite </span>
          </div>
        </div>
      )}
      <JoinMeet toggle={toggleJoinMeeting} setToggle={setToggleJoinMeeting} />
    </>
  );
};

export default CreateMeet;
