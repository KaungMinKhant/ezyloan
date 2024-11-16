<script>
    import { onMount } from "svelte";
    let appName = "EzyLoan";
</script>

<section class="home-container">
    <h1>Welcome to {appName}</h1>
    <p>Your one-stop solution for decentralized loans and wallet management.</p>

    <div class="actions">
        <a href="/wallet" class="btn btn-primary">View Wallets</a>
        <a href="/wallet/create" class="btn btn-secondary">Create a Wallet</a>
    </div>
</section>

<style>
    .home-container {
        max-width: 800px;
        margin: auto;
        text-align: center;
        padding: 40px 20px;
    }
    .actions {
        margin-top: 20px;
    }
    .btn {
        display: inline-block;
        padding: 10px 20px;
        margin: 10px;
        text-decoration: none;
        color: white;
        border-radius: 5px;
    }
    .btn-primary {
        background-color: #3498db;
    }
    .btn-secondary {
        background-color: #2ecc71;
    }
</style>
