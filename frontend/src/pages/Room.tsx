import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate} from "react-router-dom";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Hand,
  EllipsisVertical,
  PhoneMissed,
  Copy,
  Share2,
} from "lucide-react";

const Room = () => {
  const { roomId } = useParams();
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null); 
  
  // grant access to push notifications 
  const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
    } else {
      console.log('Notification permission denied.');
    }
  }
};

// function to send the push notifications 
const sendPushNotification = () => {
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Join the Call!', {
          body: `Meeting Room: ${roomId}`,
          icon: '/icon.png',
          vibrate: [200, 100, 200],
          tag: 'call-reminder',
          actions: [
            {
              action: 'join',
              title: 'Join Call',
            },
          ],
        });
      });
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    sendPushNotification();
  }, []);
  

  useEffect(() => {
    const accessUserCamera = async () => {
      try {
        // Get user media devices
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream; 
        }
      } catch (error) {
        console.error("Error accessing User Media:", error);
      }
    };

    accessUserCamera();

    // Cleanup: Stop media tracks when the component unmounts
    return () => {
      stopMediaTracks();
    };
  }, []);

  // Function to stop all media tracks
  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null; 
    }
  };

  // Toggle mic functionality
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => (track.enabled = !isMicOn));
    }
    setIsMicOn((prev) => !prev);
  };

  // Toggle video functionality
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => (track.enabled = !isVideoOn));
    }
    setIsVideoOn((prev) => !prev);
  };
  
   // Handle leaving the meeting
  const handleLeaveMeeting = () => {
    stopMediaTracks();

    // Delaying the navigation to ensure tracks are stopped
    setTimeout(() => {
      window.location.href = "/meet/new";
    }, 100);
  };
  return (
    <section className="p-2 bg-gray-800 text-white min-h-screen">
      <div className="mt-40">
        <h2 className="text-2xl font-bold">You are the only one here.</h2>
        <p className="mb-6">
          Share this meeting with others you want in this meeting.
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
              text: roomId,
              url: "/",
            };
            navigator.share(shareData);
          }}
          className="flex items-center justify-center bg-green-500 text-white rounded-2xl mt-3 w-40 h-10 block text-center cursor-pointer"
        >
          <Share2 className="inline mr-3" />
          <span>Share Invite</span>
        </div>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="float-right relative w-52 h-52 rounded"
        ></video>
      </div>
      <footer className="p-4 bg-gray-700 rounded-3xl fixed bottom-3 w-full">
        <div className="flex justify-between items-center">
          {/* Video Toggle */}
          <button onClick={toggleVideo}>
            {isVideoOn ? (
              <Video className="h-14 w-14 bg-gray-600 p-2 rounded-full" />
            ) : (
              <VideoOff className="h-14 w-14 bg-gray-600 p-2 rounded-full" />
            )}
          </button>

          {/* Mic Toggle */}
          <button onClick={toggleMic}>
            {isMicOn ? (
              <Mic className="h-14 w-14 bg-gray-600 p-2 rounded-full" />
            ) : (
              <MicOff className="h-14 w-14 bg-gray-600 p-2 rounded-full" />
            )}
          </button>

          <Hand className="h-14 w-14 bg-gray-600 p-2 rounded-full" />
          <EllipsisVertical className="h-14 w-14 bg-gray-600 p-2 rounded-full" />

          {/* Leave Meeting */}
          <button 
            onClick={handleLeaveMeeting}
            className="h-14 w-14 bg-red-500 p-2 rounded-full flex items-center justify-center"
          >
            <PhoneMissed />
          </button>
        </div>
      </footer>
    </section>
  );
};

export default Room;
