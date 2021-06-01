const express = require("express")
const http = require("http")
const app = express()
const server = http.createServer(app)
const socket = require("socket.io")
const io = require("socket.io")(server, {
    cors: {
        origin: "http//localhost:3000",
        methods: ["GET", "POST"]
    }
})


io.on("connection", (socket) => {
    socket.emit("me", socket.id)

    socket.on("disconnect", () => {
        socket.broadcast.emit("callEnded")
    })

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data })

        socket.on("answerCall", (data) => io.to(data.to).emit("callAccepted"), data.signal)
    })
})

