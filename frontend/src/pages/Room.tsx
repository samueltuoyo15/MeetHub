import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import socket from "../utils/socket-connection";
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
  const [participants, setParticipants] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<{ [id: string]: HTMLVideoElement }>({});
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  useEffect(() => {
    const initializeRoom = async () => {
      await setupMediaDevices();
      setupSocketListeners();
      socket.current.emit("join-room", roomId, (response: any) => {
        if (response.success) {
          setParticipants(response.participants);
        } else {
          alert(response.message);
        }
      });
    };

    initializeRoom();

    return () => {
      cleanup();
    };
  }, [roomId]);

  const setupSocketListeners = () => {
    socket.current.on("user-joined", (userId) => {
      setParticipants((prev) => [...prev, userId]);
      createOffer(userId);
    });

    socket.current.on("offer", async (data) => {
      if (!peerConnections.current.has(data.sender)) {
        createPeerConnection(data.sender);
      }
      const peerConnection = peerConnections.current.get(data.sender)!;
      await peerConnection.setRemoteDescription(data.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.current.emit("answer", { target: data.sender, answer });
    });

    socket.current.on("answer", async (data) => {
      const peerConnection = peerConnections.current.get(data.sender);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(data.answer);
      }
    });

    socket.current.on("ice-candidate", (data) => {
      const peerConnection = peerConnections.current.get(data.sender);
      if (peerConnection) {
        peerConnection.addIceCandidate(data.candidate);
      }
    });

    socket.current.on("user-disconnected", (userId) => {
      setParticipants((prev) => prev.filter((id) => id !== userId));
      if (peerConnections.current.has(userId)) {
        peerConnections.current.get(userId)?.close();
        peerConnections.current.delete(userId);
      }
    });
  };

  const createOffer = async (targetId: string) => {
    if (!peerConnections.current.has(targetId)) {
      createPeerConnection(targetId);
    }
    const peerConnection = peerConnections.current.get(targetId)!;
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.current.emit("offer", { target: targetId, offer });
  };

  const createPeerConnection = (targetId: string) => {
    const peerConnection = new RTCPeerConnection();
    peerConnections.current.set(targetId, peerConnection);

    streamRef.current?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, streamRef.current!);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("ice-candidate", { target: targetId, candidate: event.candidate });
      }
    };

    peerConnection.ontrack = (event) => {
      if (!remoteVideoRefs.current[targetId]) {
        const videoElement = document.createElement("video");
        videoElement.srcObject = event.streams[0];
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        remoteVideoRefs.current[targetId] = videoElement;

        const videoContainer = document.getElementById("remote-videos");
        if (videoContainer) {
          videoContainer.appendChild(videoElement);
        }
      }
    };
  };

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
      alert("Please allow access to your camera and microphone.");
    }
  };

  const cleanup = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnections.current.forEach((peerConnection) => peerConnection.close());
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
    window.location.href = "/meet/new";
  };

  return (
    <section className="p-2 bg-gray-800 text-white min-h-screen">
      <div className="mt-40">
        {participants.length > 1 ? (
          <h2 className="text-2xl font-bold">People joined: {participants.length}</h2>
        ) : (
          <h2 className="text-2xl font-bold">You are the only one here.</h2>
        )}
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
              text: roomId || "",
              url: "/",
            };
            navigator.share(shareData);
          }}
          className="flex items-center justify-center bg-green-500 text-white rounded-2xl mt-3 w-40 h-10 block text-center cursor-pointer"
        >
          <Share2 className="inline mr-3" />
          <span>Share Invite</span>
        </div>

        {/* Local Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="float-right relative w-52 h-52 rounded"
        ></video>

        {/* Remote Video(s) */}
        <div id="remote-videos" className="mt-4 flex flex-wrap gap-4">
          {participants.map((participantId) => (
            <video
              key={participantId}
              ref={(el) => {
                if (el && !remoteVideoRefs.current[participantId]) {
                  remoteVideoRefs.current[participantId] = el;
                }
              }}
              autoPlay
              playsInline
              className="float-left relative w-52 h-52 rounded"
            ></video>
          ))}
        </div>
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
