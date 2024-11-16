<script>
    import { createEventDispatcher } from "svelte";
    import { navigate } from "svelte-routing";
    import { urlRoot } from "../../constants";
    
    let name = "";
    let email = "";
    const dispatch = createEventDispatcher();
    
    async function login() {
    console.log("Logging in...");
    const response = await fetch(`${urlRoot}/api/v1/login`, {
    method: "POST",
    headers: {
    "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email }),
    });
    
    if (response.ok) {
    const data = await response.json();
    localStorage.setItem("token", data.access_token);
    dispatch("login");
    navigate("/admin");
    } else {
    alert("Invalid credentials");
    }
    }
    </script>
    
    <div class="login-container">
    <h2  style="color: white;">Login To EZYLoan</h2>
    <form on:submit|preventDefault={login} class="login-form">
    <div class="form-group">
    <label for="username" style="color: white;">Username</label>
    <input type="text" id="username" bind:value={name} placeholder="Username" required />
    </div>
    <div class="form-group">
    <label for="email" style="color: white;">Email</label>
    <input type="email" id="emaild" bind:value={email} placeholder="Email" required />
    </div>
    <button type="submit" class="login-btn">Login</button>
    </form>
    </div>
    
    <style>
    .login-container {
    max-width: 400px;
    margin: 50px auto;
    padding: 20px;
    background-color: #000000;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    h2 {
    font-family: "Roboto Flex", sans-serif;
    text-align: center;
    margin-bottom: 20px;
    }
    
    .login-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    }
    
    .form-group {
    display: flex;
    flex-direction: column;
    }
    
    label {
    font-family: "Roboto Flex", sans-serif;
    margin-bottom: 5px;
    }
    
    input {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-family: "Roboto Flex", sans-serif;
    font-size: 14px;
    }
    
    input:focus {
    outline: none;
    border-color: var(--primary-color);
    }
    
    .login-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    background-color: #FCE74A;
    color: #000000;
    font-family: "Roboto Flex", sans-serif;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    }
    
    .login-btn:hover {
    background-color: #000000;
    color: white;
    }
    </style>