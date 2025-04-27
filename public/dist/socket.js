const socket = io("http://localhost:4000")
let namespaceSocket;
function stringToHtml(str){
    const parser = new DOMParser()
    const doc = parser.parseFromString(str, "text/html")
    return doc.body.firstChild
}

function initNamespace(endpoint) {
    if (namespaceSocket) namespaceSocket.close();
    namespaceSocket = io(`http://localhost:4000/${endpoint}`)
    namespaceSocket.on("connect", () => {
        namespaceSocket.on("roomList", rooms => {
            getRoomInfo(endpoint, rooms[0].name)
            const roomsElement = document.querySelector("#contacts ul")
            roomsElement.innerHTML = ""
            for (const room of rooms) {
                const html = stringToHtml(`
                <li class="contact" roomName="${room.name}">
                    <div class="wrap">
                        <img src="${room.image}" height="40"/>
                        <div class="meta">
                            <p class="name">${room.name}</p>
                            <p class="preview" >${room.description}</p>
                        </div>
                    </div>
                </li>`)
                roomsElement.appendChild(html)
            }
            const roomNodes = document.querySelectorAll("ul li.contact");
            for (const room of roomNodes) {
                room.addEventListener("click", function(){
                    const roomName = this.getAttribute("roomName");
                    getRoomInfo(endpoint, roomName);
                })
            }
        })
    })
}

function getRoomInfo(endpoint, roomName) {
    document.querySelector("#roomName h3").setAttribute("roomName", roomName)
    document.querySelector("#roomName h3").setAttribute("endpoint", endpoint)
    namespaceSocket.emit("joinRoom", roomName)
    namespaceSocket.off("roomInfo")
    namespaceSocket.on("roomInfo", roomInfo => {
        document.querySelector(".messages ul").innerHTML = ""
        document.querySelector("#roomName h3").innerText = roomInfo.description
        const messages = roomInfo.messages || [];
        const locations = roomInfo.locations || [];
        const data = [...messages, ...locations].sort((con1, con2) => con1.dateTime - con2.dateTime)
        const userID = document.getElementById("userID").value;
        
        
        for (const item of data) {
            if (item.message) {
                
                const senderStr = String(item.sender);
                const userIDStr = String(userID);
                
                const li = document.createElement('li');
                li.className = (userIDStr === senderStr) ? 'sent' : 'replies';
                li.innerHTML = `
                    <img src="https://media-exp1.licdn.com/dms/image/C5603AQE3g9gHNfxGrQ/profile-displayphoto-shrink_200_200/0/1645507738281?e=1659571200&v=beta&t=wtwELdT1gp6ICp3UigC2EgutGAQgDP2sZKUx0mjCTwI"
                        alt="" />
                    <p>${item.message}</p>
                `;
                document.querySelector(".messages ul").appendChild(li);
            }
        }
    })
    namespaceSocket.on("onlineUsersCount", count => {
        document.getElementById("onlineCount").innerHTML = count
    })
}
function sendMessage(){
    const roomName =  document.querySelector("#roomName h3").getAttribute("roomName")
    const endpoint =  document.querySelector("#roomName h3").getAttribute("endpoint")
    let message = document.querySelector(".message-input input#messageInput").value;
    if(message.trim() == "")
        return alert("message cannot be empty")
    const userID = document.getElementById("userID").value
    namespaceSocket.off("confirmationMessage")
    namespaceSocket.on("confirmationMessage", data => {
        const senderStr = String(data.sender);
        const userIDStr = String(userID);
        
        const li = stringToHtml(`
             <li class="${(userIDStr === senderStr) ? 'sent' : 'replies'}">
             <img src="http://emilcarlsson.se/assets/harveyspecter.png"
                        alt="" />
                        <p>${data.message}</p>
                </li>
                `)
        document.querySelector(".messages ul").appendChild(li)
        document.querySelector(".message-input input#messageInput").value = ""
        const messageElement = document.querySelector(".messages")
        messageElement.scrollTo(0, messageElement.scrollHeight)
    })
    namespaceSocket.emit("newMessage", {
        message,
        roomName,
        endpoint,
        sender : userID
    })
}
socket.on("connect", ()=> {
    socket.on("namespaceList", namespaces => {
        const namespaceElement = document.getElementById("namespaces") 
        namespaceElement.innerHTML = ""
        initNamespace(namespaces[0].endpoint)
        for (const namespace of namespaces) {
            const li = document.createElement("li")
            const p = document.createElement("p")
            p.setAttribute("class", "namespaceTitle")
            p.setAttribute("endpoint", namespace.endpoint)
            p.innerText = namespace.title
            li.appendChild(p)
            namespaceElement.appendChild(li)
        }
        const namespaceNode = document.querySelectorAll("#namespaces li p.namespaceTitle")
        for (const namespace of namespaceNode) {
            namespace.addEventListener("click", ()=>{
                const endpoint = namespace.getAttribute("endpoint")
                initNamespace(endpoint)
            })
        }
    })
    window.addEventListener("keydown", (e) => {
        if(e.code == "Enter"){
            sendMessage()
        }
    })
    document.querySelector("button.submit").addEventListener("click", ()=>{
        sendMessage()
    })
})