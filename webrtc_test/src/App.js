import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"

// const socket = io.connect("http://localhost:5000")
const socket = io.connect("https://web-rtc-test-v1.herokuapp.com/")

function App() {

  const [me, setMe] = useState("")
  const [stream, setStream] = useState()
  const [receivingCall, setReceivingCall] = useState(false)
  const [caller, setCaller] = useState("")
  const [callerSignal, setCallerSignal] = useState()
  const [callAccepted, setCallAccepted] = useState(false)
  const [idToCall, setIdToCall] = useState("")
  const [callEnded, setCallEnded] = useState(false)
  const [name, setName] = useState("")

  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef = useRef()

  //connect device
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setStream(stream)
      myVideo.current.srcObject = stream
    })

    socket.on('me', (id) => { setMe(id) })
    socket.on("callUser", (data) => {
      setReceivingCall(true)
      setCaller(data.from)
      setName(data.name)
      setCallerSignal(data.signal)
    })
  }, [])

  // function
  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    })

    // sent text data
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name
      })
    })

    // sent vdo
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream
    })


    socket.on("callAccepted", (signal) => {
      setCallAccepted(true)
      peer.signal(signal)
    })

    connectionRef.current = peer
  }


  const answerCall = () => {
    setCallAccepted(true)
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    })

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller })
    })

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream
    })

    peer.signal(callerSignal)
    connectionRef.current = peer
  }

  const leaveCall = () => {
    setCallEnded(true)
    connectionRef.current.destroy()
  }

  return (
    <>
      <h1 style={{ textAlign: "center", color: "#fff" }}>Web Video Conference</h1>

      {/* video box*/}
      <div className="container">
        <div className="video-container">
          <div className="video">
            {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
          </div>

          <div className="video">
            {callAccepted && !callEnded ? <video playsInline ref={userVideo} autoPlay style={{ width: "300px" }} /> : null}
          </div>
        </div>
      </div>

      <div className="myId">

        {/*enter name */}
        <TextField
          id="filled-basic"
          label="Name"
          variant="filled"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: "20px" }}
        />

        {/* copy id */}
        <CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
          <Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
            Copy ID
					</Button>
        </CopyToClipboard>

        {/*enter id */}
        <TextField
          id="filled-basic"
          label="ID to call"
          variant="filled"
          value={idToCall}
          onChange={(e) => setIdToCall(e.target.value)}
        />

        {/*call button */}
        <div className="call-button">
          {callAccepted && !callEnded ? (
            <Button variant="contained" color="secondary" onClick={leaveCall}>
              End Call
            </Button>
          ) : (
            <IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
              <PhoneIcon fontSize="large" />
            </IconButton>
          )}
          {idToCall}
        </div>
      </div>


      {/*Incoming Call , Answer button , Must not calling*/}
      <div>
        {receivingCall && !callAccepted ? (
          <div className="caller">
            <h1 >{name} is calling...</h1>
            <Button variant="contained" color="primary" onClick={answerCall}>
              Answer
						</Button>
          </div>
        ) : null}
      </div>
    </>
  );
}

export default App;
