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
  const [participants, setParticipants] = useState<string[]>([]); // Store participants' socket ids

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<HTMLVideoElement[]>([]); // To store references for remote video elements
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map()); // Store peer connections for each participant
  const socket = useRef(io(`${import.meta.env.VITE_BASE_URL}`));

  useEffect(() => {
    const initializeRoom = async () => {
      await setupMediaDevices();
      setupSocketListeners();
      socket.current.emit("join-room", roomId);
    };

    initializeRoom();

    return () => {
      cleanup();
    };
  }, [roomId]);

  const setupSocketListeners = () => {
    socket.current.on("user-joined", (userId) => {
      console.log(`User ${userId} joined the room.`);
      setParticipants((prev) => [...prev, userId]); // Add new participant to the list
      createOffer(userId); // Create offer for the new user
    });

    socket.current.on("existing-participants", (existingParticipants) => {
      console.log("Existing participants:", existingParticipants);
      setParticipants(existingParticipants); // Set the initial participants
      existingParticipants.forEach((participantId) => {
        createOffer(participantId); // Create offer for each existing participant
      });
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
      console.log(`User ${userId} disconnected.`);
      setParticipants((prev) => prev.filter((id) => id !== userId)); // Remove disconnected user
      // Close the peer connection for the disconnected user
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

    // Add media stream tracks to peer connection
    streamRef.current?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, streamRef.current!);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("ice-candidate", { target: targetId, candidate: event.candidate });
      }
    };

    peerConnection.ontrack = (event) => {
      // Find the remote video element to display the remote stream
      const remoteVideo = remoteVideoRefs.current.find((video) => !video.srcObject);
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
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
      console.error("Error accessing media devices:", error);
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
    setTimeout(() => {
      window.location.href = "/meet/new";
    }, 100);
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
        {participants.length > 1 && (
          <div className="mt-4">
            {participants.map((participantId, index) => (
              <video
                key={participantId}
                ref={(el) => {
                  remoteVideoRefs.current[index] = el!;
                }}
                autoPlay
                playsInline
                className="float-left relative w-52 h-52 rounded"
              ></video>
            ))}
          </div>
        )}
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
