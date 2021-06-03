import Button from "@material-ui/core/Button"
import Grid from "@material-ui/core/Grid"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"
import MicIcon from '@material-ui/icons/Mic';
import VideocamIcon from '@material-ui/icons/Videocam';
import VolumeMuteIcon from '@material-ui/icons/VolumeMute';
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
  const [userName, setUserName] = useState("")

  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef = useRef()

  const [devices_list, set_devices_list] = useState([])
  const [mic_list, set_mic_list] = useState([])
  const [sound_output_list, set_sound_output_list] = useState([])

  //connect device
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setStream(stream)
      myVideo.current.srcObject = stream

      navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
          set_devices_list(devices.filter((device) => device.kind === 'videoinput'))
          set_mic_list(devices.filter((device) => device.kind === 'audioinput'))
          set_sound_output_list(devices.filter((device) => (device.kind === 'audiooutput')))

        })
        .catch(function (err) {
          console.log(err.name + ": " + err.message);
        })
      // .then(() => {
      //   console.log("here");
      //   console.log(devices_list);
      // })

    }).catch(function (err) {
      console.log(err.name + ": " + err.message);
    })

    socket.on('me', (id) => { setMe(id) })
    socket.on("callUser", (data) => {
      setReceivingCall(true)
      setCaller(data.from)
      setUserName(data.name)
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
      userVideo.current.muted = false
    })

    peer.signal(callerSignal)
    connectionRef.current = peer
  }

  const leaveCall = () => {
    setCallEnded(true)
    connectionRef.current.destroy()
    window.location.reload();
  }

  const toggleMic = () => {
    stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled
  }

  const toggleVideo = () => {
    stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled
  }

  const toggleSound = () => {
    userVideo.current.muted = !userVideo.current.muted
  }

  const onWebCamChange = (event) => {
    console.log(event.target.value);
    navigator.mediaDevices.getUserMedia({
      video: { deviceId: event.target.value ? { exact: event.target.value } : undefined },
      audio: true
    }).then((stream) => {
      setStream(stream)
    })
  }

  const onMicChange = (event) => {
    console.log(event.target.value);

    navigator.mediaDevices.getUserMedia({
      audio: { deviceId: event.target.value ? { exact: event.target.value } : undefined },
      video: true
    }).then((stream) => {
      setStream(stream)
    })

  }

  const onSoundOutputChange = (event) => {
    console.log(event.target.value);
  }


  return (
    <>
      <h1 style={{ textAlign: "center", color: "#fff" }}>Web Video Conference</h1>

      {/* video box*/}
      <Grid
        container
        direction="row"
        justify="center"
        alignItems="center"
        spacing="10"
      >
        <Grid item>
          {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
        </Grid>
        <Grid item>
          {callAccepted && !callEnded ? <video muted playsInline ref={userVideo} autoPlay style={{ width: "300px" }} /> : null}
        </Grid>

      </Grid>

      <div className="myId">

        <Grid
          container
          direction="row"
          justify="center"
          alignItems="center"
          spacing={1}
        >
          <Grid item xs={3}>
            <IconButton color="primary" aria-label="Mic" onClick={toggleMic}>
              <MicIcon fontSize="large" />
            </IconButton>
          </Grid>
          <Grid item xs={3}>
            <IconButton color="primary" aria-label="Video" onClick={toggleVideo}>
              <VideocamIcon fontSize="large" />
            </IconButton>
          </Grid>
          <Grid item xs={3}>
            <IconButton color="primary" aria-label="Video" onClick={toggleSound}>
              <VolumeMuteIcon fontSize="large" />
            </IconButton>
          </Grid>
        </Grid>

        {/* change webcam */}
        <select onChange={onWebCamChange} style={{ marginBottom: "20px", marginTop: "20px" }}>
          {
            devices_list.map(device => (
              <option key={device.deviceId} value={device.deviceId}>- {device.label} </option>))
          }

        </select>

        {/* change mic */}
        <select onChange={onMicChange} style={{ marginBottom: "20px" }}>
          {
            mic_list.map(device => (
              <option key={device.deviceId} value={device.deviceId}>- {device.label} </option>))
          }

        </select>

        {/* change sound output */}
        <select onChange={onSoundOutputChange} style={{ marginBottom: "20px" }}>
          {
            sound_output_list.map(device => (
              <option key={device.deviceId} value={device.id}>- {device.label} </option>))
          }

        </select>

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
        </div>
      </div>


      {/*Incoming Call , Answer button , Must not calling*/}
      <div>
        {receivingCall && !callAccepted ? (
          <div className="caller">
            <h1 >{userName} is calling...</h1>
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
