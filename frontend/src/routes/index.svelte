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
        <a href="/loan/request" class="btn btn-tertiary">Request a Loan</a>
    </div>
</section>

<style>
    .home-container {
        max-width: 800px;
        margin: auto;
        text-align: center;
        padding: 40px 20px;
        color: #000000; /* Text color */
    }

    .actions {
        margin-top: 20px;
    }

    .btn {
        display: inline-block;
        padding: 10px 20px;
        margin: 10px;
        text-decoration: none;
        color: #ffffff; /* Button text color */
        border-radius: 5px;
        font-weight: bold;
    }

    .btn-primary {
        background-color: #000000; /* Black button */
        border: 2px solid #fce74a;
    }

    .btn-secondary {
        background-color: #fce74a; /* Yellow button */
        color: #000000; /* Text color for yellow button */
    }

    .btn-tertiary {
        background-color: #000000;
        color: #FFFFFF;
    }

    .btn:hover {
        opacity: 0.8; /* Subtle hover effect */
    }
</style>
