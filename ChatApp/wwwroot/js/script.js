//import { encryptMessage, decryptMessage } from './cryptoUtils.js';

//const { encryptGroupMessage } = require("./cryptoUtils");

document.addEventListener("DOMContentLoaded", async () => {

    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
        lucide.createIcons()
    } else {
        console.warn("Lucide icons not initialized. Make sure to include the correct script.")
    }


    async function getCurrentUserData() {
        try {
            const response = await fetch('/api/AccountApi/GetCurrentUserData');

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    async function getCurrentUserMessages() {
        try {
            const response = await fetch('/api/AccountApi/GetCurrentUserMessages');

            if (!response.ok) {
                throw new Error('Failed to fetch user messages');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching user messages:', error);
            return null;
        }
    }

    async function getUserByUserName(userName) {
        try {
            const response = await fetch('/api/AccountApi/GetUserByUserName/' + userName);

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    async function decryptAllMessages(messages) {
        for (let message of messages) {
            try {
                if (message.senderId == "ai-1" || message.receiverId == "ai-1" || message.messageTypeId != 1 ) {
                    continue;
                }
                if (message.isGroup) {
                    const key = userData.contacts.filter(u => u.id == message.receiverId)[0].publicKey;
                    const decrypted = await decryptGroupMessage(message.content, key);
                    message.content = decrypted; // Replace encrypted content with decrypted one
                }
                else {
                    const decrypted = await decryptMessage(message.content);
                    message.content = decrypted; // Replace encrypted content with decrypted one

                }
            } catch (error) {
                console.error("Failed to decrypt message:", message, error);
                message.content = "[Encrypted Message]"; // fallback if decryption fails
            }

        }
        return messages;
    }
    async function decryptAllLatestMessages(contacts) {
        for (let contact of contacts) {
            try {
                if (contact.lastMessage === "" || contact.isGroup) continue;
                const decrypted = await decryptMessage(contact.lastMessage);
                contact.lastMessage = decrypted; // Replace encrypted content with decrypted one
            } catch (error) {
                console.error("Failed to decrypt message:", contact.lastMessage, error);
                contact.lastMessage = "[Encrypted Message]"; // fallback if decryption fails
            }

        }
        return contacts;
    }
    async function decryptGroupKeys(contacts) {
        for (let contact of contacts) {
            try {
                if (contact.isGroup)
                {
                    const decrypted = await decryptGroupKey(contact.publicKey);
                    contact.publicKey = decrypted; // Replace encrypted content with decrypted one
                }
            } catch (error) {
                console.error("Failed to decrypt message:", contact.lastMessage, error);
                contact.lastMessage = "[Encrypted Message]"; // fallback if decryption fails
            }

        }
        return contacts;
    }
    let userData = await getCurrentUserData();
    userData.contacts = await decryptAllLatestMessages(userData.contacts);
    userData.contacts = await decryptGroupKeys(userData.contacts);
    let userMessages = await getCurrentUserMessages();
    userMessages = await decryptAllMessages(userMessages);

   
    // SignalR connection
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/chathub")
        .build()


    const aiAssistant = {
        id: "ai-1",
        name: "AI Assistant",
        avatar: "https://cdn-icons-png.flaticon.com/512/4712/4712100.png",
        status: "online",
        unread: 0,
        lastMessage: userData.lastAiResponse ?? "Hello! How can I help you today?",
        isGroup: false,
        typing: false
    };

    // get contacts
    const Allcontacts = userData.contacts.map(c => ({
        id: c.id.toString(),
        name: c.contactName,
        avatar: c.profilePicUrl,
        status: c.status.toLowerCase(),
        unread: 0,
        lastMessage: c.lastMessage,
        publicKey: c.publicKey,
        isGroup:c.isGroup,
        typing: false
    }));

    const users = [aiAssistant, ...Allcontacts];

    // get contacts
    const messages = userMessages.map(m => ({
        id: m.messageId.toString(),
        content: m.content,
        sender: m.senderId,
        receiver: m.receiverId,
        timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        messageTypeId: m.messageTypeId,
        status: m.isSeen === true ? "seen" : "sent",
        isGroup : m.isGroup
    }));
    if (!messages.some(m => m.sender == "ai-1" || m.receiver == "ai-1")) {
        messages.push({
            id: "AI_Welcome_Message",
            content: "Hello! How can I help you today?",
            sender: "ai-1",
            receiver: userData.id,
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            }),
            status: "seen"
        });
    }


    // Sample user data
    const userss = [
        {
            id: "1",
            name: "Emma Thompson",
            avatar: "https://i.pravatar.cc/150?img=1",
            status: "online",
            unread: 3,
            lastMessage: "Hey, how's it going?",
            typing: false,
        },
        {
            id: "2",
            name: "James Wilson",
            avatar: "https://i.pravatar.cc/150?img=2",
            status: "online",
            unread: 0,
            lastMessage: "Can we discuss the project?",
            typing: false,
        },
        {
            id: "3",
            name: "Sophia Martinez",
            avatar: "https://i.pravatar.cc/150?img=3",
            status: "offline",
            unread: 0,
            lastMessage: "Thanks for your help!",
            typing: false,
        },
        {
            id: "4",
            name: "Liam Johnson",
            avatar: "https://i.pravatar.cc/150?img=4",
            status: "away",
            unread: 1,
            lastMessage: "I'll send you the files later",
            typing: false,
        },
        {
            id: "5",
            name: "Olivia Davis",
            avatar: "https://i.pravatar.cc/150?img=5",
            status: "online",
            unread: 0,
            lastMessage: "Let's meet tomorrow",
            typing: false,
        },
    ]
    //user = [];
    //users = formattedContacts;
    // Initial messages
    const messagess = [
        {
            id: "1",
            content: "Hello! How can I help you today?",
            sender: "assistant",
            timestamp: new Date(),
            status: "seen", // Message status: 'sent', 'delivered', or 'seen'
        },
    ]

    // DOM elements
    const userList = document.getElementById("user-list")
    const chatMessages = document.getElementById("chat-messages")
    const messageInput = document.getElementById("message-input")
    const sendButton = document.getElementById("send-button")
    const sidebar = document.getElementById("sidebar")
    const searchInput = document.getElementById("search-input")
    const chatAvatar = document.getElementById("chat-avatar")
    const chatName = document.getElementById("chat-name")
    const chatStatus = document.getElementById("chat-status")
    const themeToggle = document.getElementById("theme-toggle")
    const chatHeaderTyping = document.getElementById("chat-header-typing")

    // Add Contact Modal Elements
    const addContactBtn = document.getElementById("add-contact-btn")
    const addContactModal = document.getElementById("add-contact-modal")
    const closeModalBtn = document.getElementById("close-modal")
    const addContactForm = document.getElementById("add-contact-form")

    // Settings Modal Elements
    const settingsBtn = document.getElementById("settings-btn")
    const settingsModal = document.getElementById("settings-modal")
    const closeSettingsModalBtn = document.getElementById("close-settings-modal")
    const settingsEditButton = document.getElementById("settings-edit-button")
    const settingsSaveButton = document.getElementById("settings-save-button")
    const settingsBackButton = document.getElementById("settings-back-button")
    const profilePicture = document.getElementById("profile-picture")
    const profilePictureOverlay = document.getElementById("profile-picture-overlay")
    const saveProfile = document.getElementById("save-profile")
    const profilePictureInput = document.getElementById("profile-picture-input")
    const EditprofilePicture = document.getElementById("Edit-profile-picture")
    //const EditprofilePictureOverlay = document.getElementById("Edit-profile-picture-overlay")
    //const EditprofilePictureInput = document.getElementById("Edit-profile-picture-input")
    const profileName = document.getElementById("profile-name")
    const settingsPhone = document.getElementById("settings-phone")
    const settingsUsername = document.getElementById("settings-username")
    const settingsBio = document.getElementById("settings-bio")

    // Edit Profile Modal Elements
    const editProfileModal = document.getElementById("edit-profile-modal")
    const closeEditProfileModalBtn = document.getElementById("close-edit-profile-modal")
    const editProfileForm = document.getElementById("edit-profile-form")
    const editUsername = document.getElementById("edit-username")
    const editPhone = document.getElementById("edit-phone")
    const editBio = document.getElementById("edit-bio")

    // Emoji Picker Elements
    const emojiButton = document.getElementById("emoji-button")
    const emojiPickerContainer = document.getElementById("emoji-picker-container")
    const emojiPicker = document.querySelector("emoji-picker")

    // Sidebar resize elements
    const sidebarResizeHandle = document.getElementById("sidebar-resize-handle")

    const micButton = document.querySelector('.mic-button');
    const recordingUI = document.getElementById('voice-recording-ui');
    const stopButton = document.getElementById('stop-recording');
    const timer = document.getElementById('recording-timer');

    profileName.innerHTML = userData.userName;


    // Initialize username from user data
    //const username = userData.name || ""
    const username = userData.userName;
    let selectedUser = null
    const isTyping = false
    let typingTimeout = null

    // User profile data
    let userProfile = {
        name: userData.userName,
        username: userData.userName,
        phone: userData.phoneNumber,
        bio: userData.bio,
        avatar: userData.profilePicUrl,
        status: "online",
    }

    // Initialize profile picture
    if (profilePicture && userData.profilePicUrl) {
        profilePicture.innerHTML = `<img src="${userData.profilePicUrl}" alt="${userProfile.name}">`
    }

    // Message status icons - SVG for the tick marks
    const statusIcons = {
        sent: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        delivered: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L7 17L2 12"></path><path d="M22 10L13 19L11 17"></path></svg>`,
        seen: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L7 17L2 12"></path><path d="M22 10L13 19L11 17"></path></svg>`,
    }
    let isViewOnlyPreview = false;

    // Theme handling
    function setTheme(isDark) {
        if (isDark) {
            document.documentElement.classList.add("dark")
            document.documentElement.classList.remove("light")
            localStorage.setItem("theme", "dark")
        } else {
            document.documentElement.classList.add("light")
            document.documentElement.classList.remove("dark")
            localStorage.setItem("theme", "light")
        }

        // Refresh Lucide icons after theme change
        if (typeof lucide !== "undefined") {
            lucide.createIcons()
        }
    }

    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        setTheme(true)
        if (themeToggle) themeToggle.checked = true
    } else {
        setTheme(false)
        if (themeToggle) themeToggle.checked = false
    }

    // Toggle theme
    if (themeToggle) {
        themeToggle.addEventListener("change", function () {
            setTheme(this.checked)
        })

        // Set initial state based on saved theme
        const savedTheme = localStorage.getItem("theme")
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

        if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
            themeToggle.checked = true
            setTheme(true)
        } else {
            themeToggle.checked = false
            setTheme(false)
        }
    }

    // Render user list
    //function renderUsers(filteredUsers = users) {
    //    if (!userList) return
    //    let selectedUserId = null
    //    let selectedUser = users.find((u) => u.isActiveChat == true)
    //    if (selectedUser)
    //    {
    //        selectedUserId = selectedUser.id
    //    }
    //    // Store current sidebar width before modifying content
    //    const currentWidth = sidebar.style.width

    //    userList.innerHTML = ""

    //    filteredUsers.forEach((user) => {
    //        const userItem = document.createElement("li")
    //        userItem.className = `user-item ${selectedUserId === user.id ? "active" : ""}`
    //        userItem.dataset.userId = user.id

    //        userItem.innerHTML = `
    //<div class="user-avatar-container">
    //    <div class="user-avatar">
    //    <img src="${user.avatar}" alt="${user.name}">
    //    </div>
    //    <div class="user-status status-${user.status}"></div>
    //</div>
    //<div class="user-info">
    //    <div class="user-name-container">
    //    <span class="user-name">${user.name}</span>
    //    ${user.unread > 0 ? `<span class="unread-badge">${user.unread}</span>` : ""}
    //    </div>
    //    ${user.typing
    //                ? `<div class="user-typing">
    //        typing<span class="user-typing-dots">
    //            <span class="user-typing-dot"></span>
    //            <span class="user-typing-dot"></span>
    //            <span class="user-typing-dot"></span>
    //        </span>
    //        </div>`
    //                : `<div class="user-last-message">${user.lastMessage}</div>`
    //            }
    //</div>
    //`

    //        userItem.addEventListener("click", () => selectUser(user.id))
    //        userList.appendChild(userItem)
    //    })

    //    // Restore sidebar width after content change
    //    if (currentWidth) {
    //        sidebar.style.width = currentWidth
    //    }
    //}
    function renderUsers(filteredUsers = users) {
        if (!userList) return;
        let selectedUserId = null;
        let selectedUser = users.find((u) => u.isActiveChat == true);
        if (selectedUser) {
            selectedUserId = selectedUser.id;
        }

        const currentWidth = sidebar.style.width;
        userList.innerHTML = "";

        filteredUsers.forEach((user) => {
            const userItem = document.createElement("li");
            userItem.className = `user-item ${selectedUserId === user.id ? "active" : ""}`;
            userItem.dataset.userId = user.id;

            // Generate initials if no avatar
            const hasAvatar = user.avatar && user.avatar.trim() !== "";
            const initials = getInitials(user.name)

            const avatarHTML = hasAvatar
                ? `<img src="${user.avatar}" alt="${user.name}">`
                : `<div class="avatar-initials">${initials}</div>`;

            userItem.innerHTML = `
<div class="user-avatar-container">
    <div class="user-avatar">
        ${avatarHTML}
    </div>
    <div class="user-status status-${user.status}"></div>
</div>
<div class="user-info">
    <div class="user-name-container">
        <span class="user-name">${user.name}</span>
        ${user.unread > 0 ? `<span class="unread-badge">${user.unread}</span>` : ""}
    </div>
    ${user.typing
                    ? `<div class="user-typing">
            typing<span class="user-typing-dots">
                <span class="user-typing-dot"></span>
                <span class="user-typing-dot"></span>
                <span class="user-typing-dot"></span>
            </span>
        </div>`
                    : `<div class="user-last-message">${user.lastMessage}</div>`
                }
</div>
        `;

            userItem.addEventListener("click", () => selectUser(user.id));
            userList.appendChild(userItem);
        });

        if (currentWidth) {
            sidebar.style.width = currentWidth;
        }
    }

    function getInitials(name) {
        const words = name.trim().split(" ");
        if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase(); // "Am"
        }
        return (words[0][0] + "." + words[1][0]).toUpperCase(); // "A.M"
    }
    // Select a user
    function selectUser(userId) {
        selectedUser = userId
        users.forEach(u => u.isActiveChat = false);

        // Set selected user active
        const user = users.find(u => u.id === userId);
        if (user) {
            user.isActiveChat = true;
        }

        // Update chat header
        if (user) {
            const hasAvatar = user.avatar && user.avatar.trim() !== "";
            const initials = getInitials(user.name)
            const avatarHTML = hasAvatar
                ? `<img src="${user.avatar}" alt="${user.name}">`
                : `<div class="avatar-initials">${initials}</div>`;
            chatAvatar.innerHTML = avatarHTML
            chatName.textContent = user.name
            chatStatus.textContent = user.isGroup ? user.lastMessage :  user.status

            // Show/hide typing indicator based on user's typing status
            chatHeaderTyping.style.display = user.typing ? "flex" : "none"

            // Reset unread count
            user.unread = 0

            // Notify this contact that i seen ur message
            if (typeof connection !== "undefined") {
                connection.invoke("markMessagesAsSeen", user.id).catch((err) => console.error(err))
            }
        } else {
            chatAvatar.innerHTML = `<div class="avatar-content">AI</div>`
            chatName.textContent = "AI Assistant"
            chatStatus.textContent = "Always online"
            chatHeaderTyping.style.display = "none"
        }

        // Re-render user list to update active state
        renderUsers()

        // Re-render messages to update status indicators
        renderMessages()

        // On mobile, collapse sidebar after selection
        if (window.innerWidth < 768) {
            sidebar.classList.add("collapsed")
        }
    }

    // Mark messages as seen
    function markMessagesAsSeen(senderId) {
        let updated = false

        messages.forEach((message) => {
            if (message.receiver === senderId && message.sender === userData.id && message.status !== "seen") {
                message.status = "seen"
                updated = true
            }
        })

        if (updated) {
            renderMessages()
        }
    }

    // Render messages
    function renderMessages() {
        if (!chatMessages) return

        chatMessages.innerHTML = ""

        const friendUsername = document.getElementById("chat-name").textContent

        let currentUserId = userData.id;
        let friendUser = users.find((u) => u.isActiveChat == true)
        let friendUserId = "liadlkasd";
        if (friendUser) {
            friendUserId = friendUser.id
        }

        const relevantMessages = messages.filter(
            (message) =>
                (message.sender === currentUserId && message.receiver === friendUserId) ||
                (message.sender === friendUserId && message.receiver === currentUserId) ||
                (message.isGroup && message.receiver == friendUserId),
        )//.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); 

        relevantMessages.forEach((message) => {
            const friendUsername = document.getElementById("chat-name").textContent
            if (
                (message.sender === currentUserId && message.receiver === friendUserId) ||
                (message.sender === friendUserId && message.receiver === currentUserId) ||
                (message.isGroup && message.receiver == friendUserId)
            ) {
            }
            const messageContainer = document.createElement("div")
            messageContainer.className = "message-container"

            const messageWrapper = document.createElement("div")
            messageWrapper.className = `message-wrapper ${message.sender === currentUserId ? "sent" : "received"}`

           

            const messageElement = document.createElement("div")
            messageElement.className = `message ${message.sender === currentUserId ? "sent" : "received"}`

            // If group message, show sender's name above the message
            if (message.isGroup) {
                const senderName = document.createElement('div');
                senderName.classList.add('message-sender-name');
                const senderUser =  users.filter(u => u.id == message.sender)[0];
                senderName.textContent = senderUser ? Number(message.id) > 300000 ? message.realSenderId : senderUser.name : userData.userName; // make sure message has senderName property
                messageElement.appendChild(senderName);
            }

            // Create message content
            const messageContent = document.createElement("div")
            messageContent.className = "message-content"
            messageElement.setAttribute("dir", "auto");
            messageContent.textContent = message.content
            messageContent.style.whiteSpace = "pre-wrap";


            if (message.messageTypeId && message.messageTypeId != 1 ) {
                // It's a file message
                const fileUrl = message.content;
                messageContent.textContent = "";
                // If image, show preview
                if (message.content.match(/\.(jpg|jpeg|png|gif)$/i)) {
                    const img = document.createElement("img");
                    img.src = fileUrl;
                    img.style.maxWidth = "200px";
                    img.style.maxHeight = "300px";
                    img.style.display = "block";
                    img.style.marginBottom = "5px";
                    messageContent.appendChild(img);

                    img.addEventListener("click", () => {
                        const modal = document.getElementById("file-preview-modal");
                        const filePreview = document.getElementById("file-preview");
                        const sendFileBtn = document.getElementById("send-file-btn");

                        // Set flag and clear existing content
                        isViewOnlyPreview = true;
                        filePreview.innerHTML = "";

                        // Create a larger image preview
                        const previewImg = document.createElement("img");
                        previewImg.src = img.src;
                        previewImg.style.maxWidth = "90vw";
                        previewImg.style.maxHeight = "80vh";
                        previewImg.style.borderRadius = "8px";
                        filePreview.appendChild(previewImg);

                        // Hide send button in view-only mode
                        sendFileBtn.style.display = "none";
                        previewImg.removeAttribute("style");
                        //previewImg.src = newImageUrl;

                        // Show modal
                        modal.classList.remove("hidden");
                    });
                }

                
                //const filelink = document.createelement("a");
                //filelink.href = fileurl;
                //filelink.target = "_blank";
                //filelink.textcontent = "⬇️";
                //filelink.style.color = "#1e3a8a";
                //messagecontent.appendchild(filelink);


            } else {
                // Regular text message
                messageContent.textContent = message.content;
            }

            // Create message time container (includes time and status for sent messages)
            const messageTimeContainer = document.createElement("div")
            messageTimeContainer.className = "message-time-container"

            // Add time
            const messageTime = document.createElement("span")
            messageTime.className = "message-time"
            messageTime.textContent = formatTime(message.timestamp)
            messageTimeContainer.appendChild(messageTime)

            // Add status indicator for sent messages
            if (message.sender === currentUserId) {
                const messageStatus = document.createElement("div")
                messageStatus.className = `message-status status-${message.status || "sent"}`
                messageStatus.innerHTML = statusIcons[message.status || "sent"]
                messageTimeContainer.appendChild(messageStatus)
            }

            // Add content and time to message
            messageElement.appendChild(messageContent)
            messageElement.appendChild(messageTimeContainer)

            messageWrapper.appendChild(messageElement)
            messageContainer.appendChild(messageWrapper)
            chatMessages.appendChild(messageContainer)
        })

        // Add typing indicator if needed
        if (isTyping) {
            const typingContainer = document.createElement("div")
            typingContainer.className = "message-container"

            const typingIndicator = document.createElement("div")
            typingIndicator.className = "typing-indicator"
            typingIndicator.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    `

            typingContainer.appendChild(typingIndicator)
            chatMessages.appendChild(typingContainer)
        }

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight
    }

    // Format time
    function formatTime(date) {
        if (typeof date === "string") {
            return date; // already a string, return as is
        }
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    // Format phone number
    function formatPhoneNumber(input) {
        // Remove all non-digit characters
        let phoneNumber = input.replace(/\D/g, "")

        // Ensure it starts with +98
        if (!phoneNumber.startsWith("98")) {
            phoneNumber = "98" + phoneNumber
        }

        // Format the phone number
        if (phoneNumber.length > 2) {
            phoneNumber =
                "+" +
                phoneNumber.substring(0, 2) +
                " " +
                (phoneNumber.substring(2, 5) || "___") +
                " " +
                (phoneNumber.substring(5, 8) || "___") +
                " " +
                (phoneNumber.substring(8, 12) || "____")
        } else {
            phoneNumber = "+98 ___ ___ ____"
        }

        return phoneNumber
    }
    // Encrypt message using recipient's public key (PEM format)
    async function encryptMessage(message, recipientPublicKeyPem) {
        const publicKey = await window.crypto.subtle.importKey(
            "spki",
            pemToArrayBuffer(recipientPublicKeyPem),
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        );

        const encoded = new TextEncoder().encode(message);
        const encrypted = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            encoded
        );

        return arrayBufferToBase64(encrypted); // Return Base64 string
    }

    // Decrypt message using private key from IndexedDB
    async function decryptMessage(messageBase64) {
        const encryptedArrayBuffer = base64ToArrayBuffer(messageBase64);

        const privateKey = await getPrivateKeyFromIndexedDB();

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedArrayBuffer
        );

        return new TextDecoder().decode(decrypted);
    }
    async function decryptGroupKey(encryptedGroupKeyBase64) {
        // Convert base64 to ArrayBuffer
        const encryptedArrayBuffer = base64ToArrayBuffer(encryptedGroupKeyBase64);

        // Retrieve RSA private key from IndexedDB
        const privateKey = await getPrivateKeyFromIndexedDB();

        // Decrypt the AES key using RSA-OAEP with SHA-256 (matches your C# encryption)
        const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP",
                hash: { name: "SHA-256" } // VERY important: matches RSAEncryptionPadding.OaepSHA256
            },
            privateKey,
            encryptedArrayBuffer
        );

        // Convert the raw AES key bytes into Base64 so you can use it later (e.g., groupAesKeyBase64)
        const groupAesKeyBase64 = arrayBufferToBase64(decryptedKeyBuffer);

        return groupAesKeyBase64;
    }
    // Utility: Convert ArrayBuffer to Base64
    function arrayBufferToBase64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    // Utility: Convert Base64 to ArrayBuffer
    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Utility: PEM to ArrayBuffer
    function pemToArrayBuffer(pem) {
        const base64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
        return base64ToArrayBuffer(base64);
    }

    // Utility: ArrayBuffer to PEM
    function arrayBufferToPem(buffer, type = "PUBLIC KEY") {
        const base64 = arrayBufferToBase64(buffer);
        const formatted = base64.match(/.{1,64}/g).join("\n");
        return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`;
    }

    // IndexedDB: Save private key
    async function savePrivateKeyToIndexedDB(privateKeyBuffer) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("ChatAppKeys", 1);
            request.onupgradeneeded = function (e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("keys")) {
                    db.createObjectStore("keys");
                }
            };
            request.onsuccess = function (e) {
                const db = e.target.result;
                const tx = db.transaction("keys", "readwrite");
                const store = tx.objectStore("keys");
                store.put(privateKeyBuffer, "privateKey");
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // IndexedDB: Get private key
    async function getPrivateKeyFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("ChatAppKeys", 1);
            request.onsuccess = function (e) {
                const db = e.target.result;
                const tx = db.transaction("keys", "readonly");
                const store = tx.objectStore("keys");
                const getRequest = store.get("privateKey");
                getRequest.onsuccess = async () => {
                    const buffer = getRequest.result;
                    if (!buffer) return reject("Private key not found in IndexedDB");
                    try {
                        const key = await window.crypto.subtle.importKey(
                            "pkcs8",
                            buffer,
                            { name: "RSA-OAEP", hash: "SHA-256" },
                            true,
                            ["decrypt"]
                        );
                        resolve(key);
                    } catch (err) {
                        reject(err);
                    }
                };
                getRequest.onerror = () => reject(getRequest.error);
            };
            request.onerror = () => reject(request.error);
        });
    }
    // Send message
    async function sendMessage() {
        if (!messageInput || !chatMessages) return

        const friendUsername = document.getElementById("chat-name").textContent
        let currentUserId = userData.id;
        let friendUser = users.find((u) => u.isActiveChat == true)

        const content = messageInput.value.trim()
        if (!content) return

        let encryptedContent;
        let encryptedContentForSender;
        // skip E2E for Ai Assiatnt
        if (friendUser.id == "ai-1") {
            encryptedContent = content;
            encryptedContentForSender = content;
        }
        else if (friendUser.isGroup) {
            encryptedContent = await encryptGroupMessage(content, friendUser.publicKey);
            encryptedContentForSender = encryptedContent;
        }
        else
        {
            encryptedContent = await encryptMessage(content, friendUser.publicKey);
            encryptedContentForSender = await encryptMessage(content, userData.publicKey);
        }
        // Add user message
        const userMessage = {
            id: Date.now().toString(),
            content: content,
            contentForSender: encryptedContentForSender,
            sender: currentUserId,
            receiver: friendUser.id,
            timestamp: new Date(),
            status: friendUser.id == "ai-1" ? "seen" : "sent", // Initial status is 'sent'
            realSenderId: userData.userName,
            isGroup: friendUser.isGroup
        }

        messages.push(userMessage)
        messageInput.value = ""
        sendButton.disabled = true

        // Render messages
        renderMessages()
        if (friendUser.id == "ai-1") showAiThinking();

        const targetUser = users.find((u) => u.name === friendUsername);
        const groupName = targetUser.isGroup ? targetUser.name : "";
        // Send message via SignalR
        if (typeof connection !== "undefined") {
            connection
                .invoke("SendPrivateMessageToUser", targetUser.id, encryptedContent, encryptedContentForSender, groupName)
                .catch((err) => console.error(err))
        }
    }




    // Add a new contact
    async function addContact(name, identifier, contactType, status) {

        let user = await getUserByUserName(name);

        if (!user) {
            const errorDiv = document.getElementById("username-error");

            // Reset any previous error message
            errorDiv.textContent = "";
            errorDiv.textContent = "Username not Found!";
            return;
        }
        //const relativePath = user.profilePicUrl.replace(/\\/g, "/").split("/uploads")[1];
        //const webPath = "/uploads" + relativePath;
        //const avatar = webPath;

        // Create new user object
        const newUser = {
            id: user.id,
            name: name,
            avatar: user.profilePicUrl,
            status: user.status.toLowerCase(),
            unread: 0,
            publicKey: user.publicKey,
            lastMessage: `Added via ${contactType === "phone" ? "phone number" : "user ID"}: ${identifier}`,
            typing: false,
        }

        // Add to users array
        users.unshift(newUser)

        // Re-render user list
        renderUsers()

        return newUser
    }

    // Update profile information
    function updateProfile(newProfile) {
        userProfile = { ...userProfile, ...newProfile }

        // Update profile UI
        if (profileName) profileName.textContent = userProfile.name
        if (settingsPhone) settingsPhone.textContent = userProfile.phone
        if (settingsUsername) settingsUsername.textContent = userProfile.username
        if (settingsBio) settingsBio.textContent = userProfile.bio

        if (userProfile.avatar && EditprofilePicture) {
            EditprofilePicture.innerHTML = `<img src="${userProfile.avatar}" alt="${userProfile.name}">`
            profilePicture.innerHTML = `<img src="${userProfile.avatar}" alt="${userProfile.name}">`
        }
    }

    // Initialize edit profile form
    function initEditProfileForm() {
        if (editUsername) editUsername.value = userProfile.username
        if (settingsUsername) settingsUsername.textContent = userProfile.username
        if (editPhone) editPhone.value = userProfile.phone
        if (editBio) editBio.value = userProfile.bio
        // Initialize profile picture
        if (EditprofilePicture && userData.profilePicUrl) {
            const relativePath = userData.profilePicUrl.replace(/\\/g, "/").split("/uploads")[1];

            // Add leading slash to make it a valid URL path
            const webPath = "/uploads" + relativePath;
            EditprofilePicture.innerHTML = `<img src="${webPath}" alt="${userProfile.name}">`
        }

    }



    // Sidebar resize functionality
    let isResizing = false
    let lastDownX = 0

    // Load saved sidebar width from localStorage
    const savedSidebarWidth = localStorage.getItem("sidebarWidth")
    if (savedSidebarWidth && sidebar) {
        sidebar.style.width = savedSidebarWidth + "px"
        document.documentElement.style.setProperty("--sidebar-width", savedSidebarWidth + "px")
    }

    if (sidebarResizeHandle) {
        sidebarResizeHandle.addEventListener("mousedown", (e) => {
            isResizing = true
            lastDownX = e.clientX
            sidebarResizeHandle.classList.add("active")

            // Add event listeners for mouse movement and release
            document.addEventListener("mousemove", handleMouseMove)
            document.addEventListener("mouseup", handleMouseUp)

            // Prevent text selection during resize
            document.body.style.userSelect = "none"
            e.preventDefault()
        })
    }

    function handleMouseMove(e) {
        if (!isResizing) return

        const minWidth = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sidebar-min-width"))
        const maxWidth = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sidebar-max-width"))

        // Calculate new width
        const offsetRight = document.body.offsetWidth - (e.clientX - document.body.offsetLeft)
        const newWidth = document.body.offsetWidth - offsetRight

        // Apply constraints
        if (newWidth >= minWidth && newWidth <= maxWidth) {
            sidebar.style.width = newWidth + "px"
            document.documentElement.style.setProperty("--sidebar-width", newWidth + "px")
        }
    }

    function handleMouseUp() {
        if (isResizing) {
            isResizing = false
            sidebarResizeHandle.classList.remove("active")

            // Save sidebar width to localStorage
            localStorage.setItem("sidebarWidth", sidebar.style.width)

            // Remove event listeners
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)

            // Restore text selection
            document.body.style.userSelect = ""
        }
    }

    // Event listeners
    if (messageInput) {
        messageInput.addEventListener("input", function () {
            sendButton.disabled = this.value.trim() === ""
        })

        messageInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                sendMessage()
            }
        })
    }

    if (sendButton) {
        sendButton.addEventListener("click", sendMessage)
    }

    if (searchInput) {
        searchInput.addEventListener("input", function () {
            const query = this.value.toLowerCase()
            const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(query))

            // Store current sidebar width
            const currentWidth = sidebar.style.width

            renderUsers(filteredUsers)

            // Ensure width is maintained after rendering
            if (currentWidth) {
                sidebar.style.width = currentWidth
                document.documentElement.style.setProperty("--sidebar-width", currentWidth)
            }
        })
    }

    // Add Contact Modal Event Listeners
    if (addContactBtn && addContactModal) {
        addContactBtn.addEventListener("click", () => {
            addContactForm.reset()
            const errorDiv = document.getElementById("username-error");

            // Reset any previous error message
            errorDiv.textContent = "";
            addContactModal.classList.add("active")
        })
    }

    if (closeModalBtn && addContactModal) {
        closeModalBtn.addEventListener("click", () => {
            addContactModal.classList.remove("active")
        })
    }

    // Close modal when clicking outside
    if (addContactModal) {
        addContactModal.addEventListener("click", (e) => {
            if (e.target === addContactModal) {
                addContactModal.classList.remove("active")
            }
        })
    }

    // Handle form submission
    if (addContactForm) {
        addContactForm.addEventListener("submit", async (e) => {
            e.preventDefault()

            const name = document.getElementById("contact-name").value.trim()

            // Add the new contact
            const newContact = await addContact(name, name, "userName", "offline")
            if (!newContact) {
                addContactForm.reset()
                return;
            }

            // Close modal and reset form
            addContactModal.classList.remove("active")
            addContactForm.reset()
            const errorDiv = document.getElementById("username-error");

            // Reset any previous error message
            errorDiv.textContent = "";

            // Select the new contact
            selectUser(newContact.id)
        })
    }

    // Settings Modal Event Listeners
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener("click", () => {
            if (settingsUsername) settingsUsername.innerHTML = userProfile.username
            if (settingsPhone) settingsPhone.innerHTML = userProfile.phone
            if (settingsBio) settingsBio.innerHTML = userProfile.bio

            profilePicture.innerHTML = `<img src="${userProfile.avatar}" alt="${userProfile.name}">`

            settingsModal.classList.add("active")
        })
    }

    if (closeSettingsModalBtn && settingsModal) {
        closeSettingsModalBtn.addEventListener("click", () => {
            settingsModal.classList.remove("active")
        })
    }

    if (settingsBackButton && settingsModal) {
        settingsBackButton.addEventListener("click", () => {
            settingsModal.classList.remove("active")
            // remove selected photo
            EditprofilePicture.innerHTML = "";
            profilePicture.innerHTML = "";
        })
    }

    // Close settings modal when clicking outside
    if (settingsModal) {
        settingsModal.addEventListener("click", (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove("active")
            }
        })
    }

    // Edit Profile Button
    if (settingsEditButton && editProfileModal) {
        settingsEditButton.addEventListener("click", () => {
            initEditProfileForm()
            editProfileModal.classList.add("active")
        })
    }

    // Save Profile Pic
    if (settingsSaveButton && editProfileModal) {
        settingsSaveButton.addEventListener("click", () => {
            SaveProfilePic()
        })
    }

    if (closeEditProfileModalBtn && editProfileModal) {
        closeEditProfileModalBtn.addEventListener("click", () => {
            editProfileModal.classList.remove("active")
        })
    }

    // Close edit profile modal when clicking outside
    if (editProfileModal) {
        editProfileModal.addEventListener("click", (e) => {
            if (e.target === editProfileModal) {
                editProfileModal.classList.remove("active")
            }
        })
    }

    // Edit Profile Form Submission
    if (editProfileForm) {
        editProfileForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const form = e.target;
            const formData = new FormData(form);
            for (let pair of formData.entries()) {
                console.log(pair[0], pair[1]);
            }


            try {
                const response = await fetch("/api/AccountApi/UpdateProfile", {
                    method: "POST",
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log("Saved:", result);
                    // Optionally show success UI feedback
                } else {
                    const errorText = await response.text();
                    console.error("Failed:", errorText);
                }
            } catch (err) {
                console.error("Error submitting form:", err);
            }
            e.preventDefault()

            const newProfile = {
                username: editUsername.value.trim(),
                phone: editPhone.value.trim(),
                bio: editBio.value.trim(),
            }

            //updateProfile(newProfile)

            // set setting fields from db
            var newUserData = await getCurrentUserData();
            userProfile.bio = newUserData.bio
            userProfile.phone = newUserData.phoneNumber
            userProfile.avatar = newUserData.profilePicUrl
            userProfile.username = newUserData.userName
            updateProfile(newProfile)
            editProfileModal.classList.remove("active")
            //settingsPhone.innerHTML = userProfile.phone
            //settingsBio.innerHTML = userProfile.bio
            //settingsUsername.innerHTML = userProfile.username
            //profilePicture.innerHTML = `<img src="${userProfile.avatar}" alt="${userProfile.name}">`


        })
    }

    // Profile Picture Upload
    if (profilePictureOverlay && profilePictureInput) {
        profilePictureOverlay.addEventListener("click", () => {
            profilePictureInput.click()
        })

        profilePictureInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader()

                reader.onload = (event) => {
                    const newAvatar = event.target.result
                    updateProfile({ avatar: newAvatar })
                }

                reader.readAsDataURL(e.target.files[0])
            }
        })
    }

    // Emoji Picker
    if (emojiButton && emojiPickerContainer) {
        emojiButton.addEventListener("click", () => {
            emojiPickerContainer.classList.toggle("active")
        })

        // Close emoji picker when clicking outside
        document.addEventListener("click", (e) => {
            if (!emojiButton.contains(e.target) && !emojiPickerContainer.contains(e.target)) {
                emojiPickerContainer.classList.remove("active")
            }
        })
    }

    // Handle emoji selection
    if (emojiPicker && messageInput) {
        emojiPicker.addEventListener("emoji-click", (event) => {
            const emoji = event.detail.unicode
            messageInput.value += emoji
            messageInput.focus()
            sendButton.disabled = messageInput.value.trim() === ""
        })
    }

    // Handle responsive behavior
    window.addEventListener("resize", () => {
        if (window.innerWidth >= 768 && sidebar) {
            sidebar.classList.remove("collapsed")
        }
    })

    // Phone number formatting
    if (editPhone) {
        editPhone.addEventListener("input", (e) => {
            const formattedNumber = formatPhoneNumber(e.target.value)
            e.target.value = formattedNumber
        })
    }


    // Logout functionality
    const logoutButton = document.querySelector(".sidebar-footer .sidebar-menu-button:last-child")
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            // Clear authentication data
            localStorage.removeItem("isAuthenticated")
            localStorage.removeItem("user")

            // Redirect to login page
            window.location.href = "login.html"
        })
    }

    // Initialize
    renderUsers()
    renderMessages()

    // Make sure icons are created after DOM is fully loaded
    setTimeout(() => {
        if (typeof lucide !== "undefined") {
            lucide.createIcons()
        }
    }, 100)

    //Handle receiving messages
    connection.on("ReceiveMessage", async (senderId, message, groupId, realSenderId) => {
        let decryptedMessage;
        if (senderId == "ai-1" || message.startsWith("/uploads") ) // skip Decpryption for Ai
        {
            decryptedMessage = message;
            hideAiThinking();
        }
        else if (groupId && groupId != "") {
            const key = users.filter(u => u.id == groupId)[0].publicKey;
            decryptedMessage = await decryptGroupMessage(message, key);
        }
        else {
            decryptedMessage = await decryptMessage(message);
        }
        // If the sender is AI and the last message is also from AI,
        // append to that message instead of pushing a new one
        // wait 3 seconds before showing this chunk
        //await new Promise(resolve => setTimeout(resolve, 3000));
        const AisenderUser = users.find((u) => u.id === "ai-1")
        if (senderId === "ai-1") {
            let lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.sender === "ai-1") {
                lastMessage.content += decryptedMessage; // append text
                renderMessages();
                AisenderUser.lastMessage = lastMessage.content
                renderUsers()
                return;
            }
        }

        const receivedMessage = {
            id: Date.now().toString(),
            content: decryptedMessage,
            sender: senderId,
            receiver: userData.id,
            timestamp: new Date(),
            messageTypeId: decryptedMessage.startsWith("/uploads") ? 2 : 1,
            status: "seen", // Messages from others are automatically seen
            isGroup: groupId && groupId != "",
            realSenderId: realSenderId
        }
        const senderUser = users.find((u) => u.id === senderId)
        showNotification(receivedMessage.messageTypeId != 1 ? "🖼️" : decryptedMessage, senderUser.name);

        messages.push(receivedMessage)
        renderMessages()

        // Update last message for the user
        const selectedUser = users.find((u) => u.isActiveChat == true)
        if (senderUser) {
            senderUser.lastMessage = receivedMessage.messageTypeId != 1 ? "🖼️" : decryptedMessage;

            // Increment unread count if this is not the selected user
            if (selectedUser?.id !== senderUser.id) {
                senderUser.unread++
            } else {
                if (typeof connection !== "undefined") {
                    connection.invoke("markMessagesAsSeen", senderUser.id).catch((err) => console.error(err))
                }
            }

            renderUsers()
        }
    })
    // Elements
    const imagePreviewModal = document.getElementById("imagePreviewModal");
    const previewedImage = document.getElementById("previewedImage");
    const closeImagePreview = document.getElementById("closeImagePreview");

    // Close button handler
    closeImagePreview.onclick = () => {
        imagePreviewModal.classList.add("hidden");
        previewedImage.src = "";
    };


    connection.on("MessageSeen", (userId) => {
        markMessagesAsSeen(userId)
    })

    // Start SignalR connection
    connection
        .start()
        .then(() => {
            console.log("Connected to SignalR")
            connection.invoke("RegisterUserId")
            if ("Notification" in window) {
                Notification.requestPermission().then((perm) => {
                    if (perm === "granted") {
                        console.log("Desktop notifications enabled");
                    }
                });
            }

        })
        .catch((err) => console.error("Connection failed:", err))

    // Typing indicator functions
    function showTypingIndicator(typingUserId) {
        // Find the user by name
        const user = users.find((u) => u.id === typingUserId)
        if (user) {
            user.typing = true
            renderUsers() // Re-render to show typing indicator

            // Show typing indicator in chat header if this user is selected
            if (selectedUser === user.id) {
                chatHeaderTyping.style.display = "flex"
            }
        }
    }

    function hideTypingIndicator(typingUserId) {
        // Find the user by name
        const user = users.find((u) => u.id === typingUserId)
        if (user) {
            user.typing = false
            renderUsers() // Re-render to hide typing indicator

            // Hide typing indicator in chat header if this user is selected
            if (selectedUser === user.id) {
                chatHeaderTyping.style.display = "none"
            }
        }
    }
    function showAiThinking() {
        document.getElementById("message-input").disabled = true;

        const chatContainer = document.querySelector(".chat-messages"); // your message area container

        // Remove old thinking bubble if any (optional)
        const oldThinking = document.querySelector(".thinking-bubble");
        if (oldThinking) oldThinking.remove();

        // Create the AI thinking container
        const thinkingDiv = document.createElement("div");
        thinkingDiv.className = "message-wrapper received thinking-bubble";

        const bubble = document.createElement("div");
        bubble.className = "message received ai-thinking";

        // Add text + dots
        bubble.innerHTML = `
        <div class="thinking-text">Thinking  <span class="dot dot1"></span><span class="dot dot2"></span><span class="dot dot3"></span></div>
    `;

        thinkingDiv.appendChild(bubble);
        chatContainer.appendChild(thinkingDiv);

        chatContainer.scrollTop = chatContainer.scrollHeight; // auto scroll
    }


    function hideAiThinking() {
        document.getElementById("message-input").disabled = false;

        const bubble = document.querySelector(".thinking-bubble");
        if (bubble) bubble.remove();
    }

    // Handle typing events
    let _isTyping = false
    if (messageInput) {
        messageInput.addEventListener("input", () => {
            //const friendUsername = document.getElementById("chat-name").innerText
            const friendUser = users.find((u) => u.isActiveChat == true)

            if (!_isTyping) {
                if (typeof connection !== "undefined") {
                    connection.invoke("UserTyping", friendUser.id).catch((err) => console.error(err))
                }
                _isTyping = true
            }

            clearTimeout(typingTimeout)
            typingTimeout = setTimeout(() => {
                if (typeof connection !== "undefined") {
                    connection.invoke("UserStoppedTyping", friendUser.id).catch((err) => console.error(err))
                }
                _isTyping = false
            }, 2000)
        })
    }
    const fileInput = document.getElementById("file-input");
    const attachButton = document.getElementById("btnPaperclip");
    const imageButton = document.getElementById("btnImage");

    // Safe: prevent re-binding if code runs again
    if (!window.fileHandlersInitialized) {
        attachButton.addEventListener("click", () => fileInput.click());
        imageButton.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", handleFileSelect);
        window.fileHandlersInitialized = true;
    }

    // Function for file selection + Telegram-style preview
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const modal = document.getElementById("file-preview-modal");
        const preview = document.getElementById("file-preview");
        const closeBtn = modal.querySelector(".close-btn");
        const sendBtn = document.getElementById("send-file-btn");

        preview.innerHTML = ""; // clear previous preview

        // Show preview
        if (file.type.startsWith("image")) {
            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.className = "preview-image";
            preview.appendChild(img);
        } else if (file.type.startsWith("video")) {
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);
            video.controls = true;
            video.className = "preview-video";
            preview.appendChild(video);
        }
        sendBtn.style.display = "block";
        isViewOnlyPreview = false;
        // Show modal
        modal.classList.remove("hidden");

        // Close button
        closeBtn.onclick = () => {
            modal.classList.add("hidden");
            fileInput.value = "";
        };

        // Send button (hook to your sendMessage logic later)
        sendBtn.onclick = async () => {
            const file = fileInput.files[0];
            if (!file) return;

            modal.classList.add("hidden");

            try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/AccountApi/upload", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                console.log("Upload result:", result);

                let friendUser = users.find(u => u.isActiveChat);
                let friendUserId = friendUser ? friendUser.id : "unknown";


                const fileMessage = {
                    id: "fl" + Date.now().toString(), // or generate unique ID
                    sender: userData.id,
                    receiver: friendUserId,
                    content: result.filePath, // optional text
                    messageTypeId: 2, // this is important for rendering multimedia
                    timestamp: new Date(),
                    status: "sent"
                };
                // send message 
                if (typeof connection !== "undefined") {
                    connection
                        .invoke("SendPrivateMessageToUser", friendUserId, fileMessage.content, fileMessage.content, "")
                        .catch((err) => console.error(err))
                }
                // Add message to your messages array and render
                messages.push(fileMessage);
                renderMessages();

            } catch (err) {
                console.error("Error uploading file:", err);
            } finally {
                fileInput.value = "";
            }
        };
    }
    document.querySelector("#file-preview-modal .close-btn").onclick = () => {
        const modal = document.getElementById("file-preview-modal");
        const sendFileBtn = document.getElementById("send-file-btn");

        // Hide modal
        modal.classList.add("hidden");

        // Reset view-only state
        isViewOnlyPreview = false;

        // Restore send button for next time (e.g., when sending new files)
        //sendFileBtn.style.display = "";
        isViewOnlyPreview = false;
        sendFileBtn.style.display = "block"; // always show when reopening later
    };

    const previewModal = document.getElementById("file-preview-modal");
    const previewContent = document.querySelector(".file-preview-content");
    const closeBtn = document.querySelector(".close-btn");

    // Existing close button click
    closeBtn.onclick = () => {
        previewModal.classList.add("hidden");
    };

    // NEW: close when clicking outside content
    previewModal.addEventListener("click", (e) => {
        if (!previewContent.contains(e.target)) {
            previewModal.classList.add("hidden");
        }
    });
    let recording = false;
    let seconds = 0;
    let timerInterval;

    micButton.addEventListener('click', () => {
        if (!recording) {
            recording = true;
            recordingUI.classList.remove('hidden');
            startTimer();
            // TODO: start actual recording
        }
    });

    stopButton.addEventListener('click', () => {
        recording = false;
        recordingUI.classList.add('hidden');
        stopTimer();
        // TODO: stop and send voice blob
    });

    function startTimer() {
        seconds = 0;
        timerInterval = setInterval(() => {
            seconds++;
            const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
            const secs = String(seconds % 60).padStart(2, '0');
            timer.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timer.textContent = "00:00";
    }
    const groupchatNewBtn = document.getElementById("groupchat-new-btn");
    const groupchatModal = document.getElementById("groupchat-modal");
    const groupchatCancelBtn = document.getElementById("groupchat-cancel-btn");
    const groupchatCreateBtn = document.getElementById("groupchat-create-btn");
    const errorDiv = document.getElementById("groupchat-error");
    groupchatNewBtn.addEventListener("click", () => {
        groupchatModal.classList.remove("groupchat-hidden");
        populateGroupChatUsers(userData.contacts);
    });

    groupchatCancelBtn.addEventListener("click", () => {
        errorDiv.style.display = "none"; // Hide previous errors
        groupchatModal.classList.add("groupchat-hidden");
    });
    groupchatCreateBtn.addEventListener("click", async () => {
        errorDiv.style.display = "none"; // Hide previous errors

        const groupName = document.getElementById('groupchat-name-input').value.trim();

        // Get selected user IDs from checkboxes
        const checkboxes = document.querySelectorAll('.groupchat-contact-list input[type="checkbox"]:checked');
        const userIds = Array.from(checkboxes).map(cb => cb.value);

        // Client-side validation
        if (!groupName) {
            errorDiv.textContent = "Please enter a group name!";
            errorDiv.style.display = "block";
            return;
        }
        if (userIds.length === 0) {
            errorDiv.textContent = "Please select at least one user!";
            errorDiv.style.display = "block";
            return;
        }

        try {
            const response = await fetch('/api/AccountApi/CreateGroupChat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupName, userIds })
            });

            if (response.ok) {
                //const result = await response.json();
                //console.log("Group created:", result);

                // Reset inputs
                document.getElementById('groupchat-name-input').value = '';
                checkboxes.forEach(cb => cb.checked = false);

                // Close modal
                groupchatModal.classList.add("groupchat-hidden");
                const newGroup = {
                    id: "newGroup",
                    name: document.getElementById('groupchat-name-input').value,
                    avatar: "",
                    status: "online",
                    unread: 0,
                    lastMessage: "New Group Created",
                    typing: false
                };
                user.push(newGroup);
                renderUsers();
            } else {
               // const errorText = await response.text();
                errorDiv.textContent = errorText || "Failed to create group.";
                errorDiv.style.display = "block";
            }
        } catch (err) {
            console.error(err);
            errorDiv.textContent = "An error occurred while creating the group.";
            errorDiv.style.display = "block";
        }
    });

    function populateGroupChatUsers(users) {
        const listContainer = document.getElementById('groupchat-contact-list');
        listContainer.innerHTML = ''; // clear existing content

        users.filter(u => !u.isGroup).forEach(user => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = user.id;
            label.appendChild(checkbox);
            label.append(` ${user.contactName}`);
            listContainer.appendChild(label);
        });
    }
    function base64ToArrayBufferG(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    function arrayBufferToBase64G(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
    const fixedIv = new Uint8Array(16); // 16 zero bytes

    async function encryptGroupMessage(message, groupAesKeyBase64) {
        const rawKey = base64ToArrayBuffer(groupAesKeyBase64);
        const aesKey = await crypto.subtle.importKey("raw", rawKey, { name: "AES-CBC" }, false, ["encrypt"]);
        const encoded = new TextEncoder().encode(message);
        const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv: new Uint8Array(16) }, aesKey, encoded);
        return arrayBufferToBase64(encrypted);
    }

    async function decryptGroupMessage(encryptedBase64, groupAesKeyBase64) {
        const rawKey = base64ToArrayBuffer(groupAesKeyBase64);
        const aesKey = await crypto.subtle.importKey("raw", rawKey, { name: "AES-CBC" }, false, ["decrypt"]);
        const encrypted = base64ToArrayBuffer(encryptedBase64);
        const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv: new Uint8Array(16) }, aesKey, encrypted);
        return new TextDecoder().decode(decrypted);
    }

    function showNotification(message, contactName) {
        debugger;
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {

            const n = new Notification(contactName, {
                body: message,
                icon: "/assets/NotificationBell.png", 
                badge: "/assets/NotificationBell.png",
                timestamp: Date.now()
            });

            n.onclick = () => {
                window.focus();
                n.close();
            };
        }
    }


    // Handle typing notifications
    connection.on("ShowTyping", (typingUserId) => {
        showTypingIndicator(typingUserId)
    })

    connection.on("HideTyping", (typingUserId) => {
        hideTypingIndicator(typingUserId)
    })

    connection.on("UserOnline", (userId) => {
        // Update UI: show green dot, mark as online
        var user = users.find((u) => u.id == userId)
        if (user) {
            user.status = "online"
            renderUsers()
            const chatStatus = document.getElementById("chat-status")
            let selectedContact = users.find((u) => u.isActiveChat == true)
            if (selectedContact.id == userId) {
                chatStatus.innerHTML = "Online"
            }
        }
    })

    connection.on("UserOffline", (userId) => {
        // Update UI: gray dot, mark as offline
        var user = users.find((u) => u.id == userId)
        if (user) {
            user.status = "offline"
            renderUsers()
            const chatStatus = document.getElementById("chat-status")
            let selectedContact = users.find((u) => u.isActiveChat == true)
            if (selectedContact.id == userId) {
                chatStatus.innerHTML = "Offline"
            }
        }
    })
})

// Declare lucide
var lucide

var signalR;
