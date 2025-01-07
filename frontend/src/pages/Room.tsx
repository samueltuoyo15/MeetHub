import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
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
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const socket = useRef(io("http://localhost:10000"));

  useEffect(() => {
    const initializeRoom = async () => {
      await setupMediaDevices();
      setupSocketListeners();
      createPeerConnection();
      socket.current.emit("join-room", roomId);
    };

    initializeRoom();

    return () => {
      cleanup();
    };
  }, [roomId]);

  const setupMediaDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const setupSocketListeners = () => {
    socket.current.on("user-joined", (userId) => {
      console.log(`User ${userId} joined the room.`);
    });

    socket.current.on("offer", async (offer) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.current.emit("answer", { roomId, answer });
    });

    socket.current.on("answer", async (answer) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(answer);
    });

    socket.current.on("ice-candidate", (candidate) => {
      if (!peerConnection.current) return;
      peerConnection.current.addIceCandidate(candidate);
    });
  };

  const createPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, streamRef.current!);
      });
    }

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
  };

  const cleanup = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnection.current?.close();
    socket.current.disconnect();
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
    }
    setIsMicOn((prev) => !prev);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOn;
      });
    }
    setIsVideoOn((prev) => !prev);
  };

  const handleLeaveMeeting = () => {
    cleanup();
    setTimeout(() => {
      window.location.href = "/meet/new";
    }, 100);
  };

  return (
    <section className="p-2 bg-gray-800 text-white min-h-screen">
      <div className="mt-40">
        <h2 className="text-2xl font-bold">You are the only one here.</h2>
        <p className="mb-6">Share this meeting with others you want in this meeting.</p>
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

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="float-left relative w-52 h-52 rounded"
        ></video>
      </div>
      <footer className="p-4 bg-gray-700 rounded-3xl fixed bottom-3 w-full">
        <div className="flex justify-between items-center">
          <button onClick={toggleVideo}>
            {isVideoOn ? (
              <Video className="h-14 w-14 bg-gray-600 p-2 rounded-full" />
            ) : (
              <VideoOff className="h-14 w-14 bg-gray-600 p-2 rounded-full" />
            )}
          </button>
          <button onClick={toggleMic}>
            {isMicOn ? (
              <Mic className="h-14 w-14 bg-gray-600 p-2 rounded-full" />
            ) : (
              <MicOff className="h-14 w-14 bg-gray-600 p-2 rounded-full" />
            )}
          </button>
          <Hand className="h-14 w-14 bg-gray-600 p-2 rounded-full" />
          <EllipsisVertical className="h-14 w-14 bg-gray-600 p-2 rounded-full" />
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
