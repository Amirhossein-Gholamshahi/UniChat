import { generateKeyPairAndStore, encryptMessage, decryptMessage, encryptGroupMessage } from './cryptoUtils.js';
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons()
  } else {
    console.warn("Lucide icons not initialized. Make sure to include the correct script.")
  }

  // Get the current page
  const currentPage = window.location.pathname.split("/").pop()

  // Login page functionality
  if (currentPage === "Login" || currentPage === "") {
    const loginForm = document.getElementById("login-form")
    const passwordInput = document.getElementById("Password")
    const passwordToggle = document.querySelector(".password-toggle")
    const showPasswordIcon = document.querySelector(".show-password")
    const hidePasswordIcon = document.querySelector(".hide-password")

    // Toggle password visibility
      if (passwordToggle) {
          debugger;
      passwordToggle.addEventListener("click", () => {
        if (passwordInput.type === "password") {
          passwordInput.type = "text"
          showPasswordIcon.classList.add("hidden")
          hidePasswordIcon.classList.remove("hidden")
        } else {
          passwordInput.type = "password"
          showPasswordIcon.classList.remove("hidden")
          hidePasswordIcon.classList.add("hidden")
        }
      })
    }

    // Handle login form submission
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault()

        const email = document.getElementById("email").value
        const password = document.getElementById("password").value

        // Show loading state
        const submitButton = loginForm.querySelector("button[type='submit']")
        const originalText = submitButton.innerHTML
        submitButton.disabled = true
        submitButton.innerHTML = `<span>Signing in...</span>`

        try {
          // login.js
          fetch('https://localhost:7114/account/login', {
              method: 'POST',
              credentials: 'include',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  username: 'amirhossein',
                  password: 'P@ssword123'
              })
          })
          .then(res => res.json())
          .then(data => console.log(data));

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1500))

          // In a real app, you would make an API call to authenticate
          console.log("Login with:", email, password)

          // Store authentication state
          localStorage.setItem("isAuthenticated", "true")
          localStorage.setItem(
            "user",
            JSON.stringify({
              email: email,
              name: email.split("@")[0],
              avatar: `https://i.pravatar.cc/150?u=${email}`,
            }),
          )

          // Redirect to the chat app
          window.location.href = "index.html"
        } catch (error) {
          console.error("Login failed:", error)
          alert("Login failed. Please try again.")
        } finally {
          // Reset button state
          submitButton.disabled = false
          submitButton.innerHTML = originalText
        }
      })
    }
  }

  // Signup page functionality
  if (currentPage === "SignUp") {
    const signupForm = document.getElementById("signup-form")
    const profilePictureInput = document.getElementById("profile-picture-input")
    const profilePreview = document.getElementById("profile-preview")
    const profilePlaceholder = document.querySelector(".profile-picture-placeholder")
    const phoneInput = document.getElementById("phone")
    const passwordToggles = document.querySelectorAll(".password-toggle")

    // Toggle password visibility
    passwordToggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const passwordInput = toggle.parentElement.querySelector("input")
        const showIcon = toggle.querySelector(".show-password")
        const hideIcon = toggle.querySelector(".hide-password")

        if (passwordInput.type === "password") {
          passwordInput.type = "text"
          showIcon.classList.add("hidden")
          hideIcon.classList.remove("hidden")
        } else {
          passwordInput.type = "password"
          showIcon.classList.remove("hidden")
          hideIcon.classList.add("hidden")
        }
      })
    })

    // Handle profile picture upload
    if (profilePictureInput) {
      const profilePictureOverlay = document.querySelector(".profile-picture-overlay")

      profilePictureOverlay.addEventListener("click", () => {
        profilePictureInput.click()
      })

      profilePictureInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader()

          reader.onload = (event) => {
            profilePreview.src = event.target.result
            profilePreview.classList.remove("hidden")
            profilePlaceholder.classList.add("hidden")
          }

          reader.readAsDataURL(e.target.files[0])
        }
      })
    }

    // Format phone number
    if (phoneInput) {
      phoneInput.addEventListener("input", (e) => {
        const formattedNumber = formatPhoneNumber(e.target.value)
        e.target.value = formattedNumber
      })
    }

    // Handle signup form submission
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault()

        const fullname = document.getElementById("fullname").value
        const email = document.getElementById("signup-email").value
        const phone = document.getElementById("phone").value
        const password = document.getElementById("signup-password").value
        const confirmPassword = document.getElementById("confirm-password").value
        const termsAccepted = document.getElementById("terms").checked

        // Validate form
        if (password !== confirmPassword) {
          alert("Passwords don't match")
          return
        }

        if (!termsAccepted) {
          alert("Please accept the terms and conditions")
          return
        }

        // Show loading state
        const submitButton = signupForm.querySelector("button[type='submit']")
        const originalText = submitButton.innerHTML
        submitButton.disabled = true
        submitButton.innerHTML = `<span>Creating account...</span>`

        try {
          // register.js
          fetch('https://localhost:7114/account/register', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  username: 'amirhossein',
                  email: 'amir@example.com',
                  password: 'P@ssword123'
              })
          })
          .then(res => res.json())
          .then(data => console.log(data));

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1500))

          // In a real app, you would make an API call to create an account
          console.log("Signup with:", {
            fullname,
            email,
            phone,
            password,
            profileImage: profilePreview.src || null,
          })

          // Store authentication state
          localStorage.setItem("isAuthenticated", "true")
          localStorage.setItem(
            "user",
            JSON.stringify({
              name: fullname,
              email: email,
              phone: phone,
              avatar: profilePreview.src || `https://i.pravatar.cc/150?u=${email}`,
            }),
          )

          // Redirect to the chat app
          window.location.href = "index.html"
        } catch (error) {
          console.error("Signup failed:", error)
          alert("Signup failed. Please try again.")
        } finally {
          // Reset button state
          submitButton.disabled = false
          submitButton.innerHTML = originalText
        }
      })
    }
  }
})

// Format phone number function
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



document.getElementById("signUpForm").addEventListener("submit", async function (e) {
    debugger
    e.preventDefault();

    // Generate key pair and store private key in IndexedDB, return public key in PEM format
    const publicKey = await generateKeyPairAndStore();

    // Set the public key in hidden input
    document.getElementById("publicKey").value = publicKey;

    // Now submit the form
    e.target.submit();
})

