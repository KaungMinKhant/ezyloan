<script>
    import WalletCard from "../../components/WalletCard.svelte";
    import WalletForm from "../../components/WalletForm.svelte";
    import { urlRoot } from "../../constants.js";

    let wallet = null;

    async function createWallet() {
        try {
            const response = await fetch(`${urlRoot}/api/v1/wallet/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to create wallet");
            }

            wallet = await response.json();
        } catch (error) {
            console.error("Error creating wallet:", error);
        }
    }
</script>

<section class="create-wallet-container">
    <h1>Create a Wallet</h1>
    <p>Securely create a new wallet to manage your decentralized assets.</p>

    {#if wallet}
        <div class="wallet-display">
            <WalletCard {wallet} />
        </div>
    {:else}
        <div class="wallet-form">
            <WalletForm onCreateWallet={createWallet} />
        </div>
    {/if}
</section>

<style>
    .create-wallet-container {
        max-width: 700px;
        margin: 40px auto;
        padding: 20px;
        text-align: center;
        border: 1px solid #d3d3d3; /* Subtle gray for border */
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Soft shadow */
        background-color: #FFFFFF; /* White background */
    }

    h1 {
        font-size: 2rem;
        margin-bottom: 10px;
        color: #000000; /* Black text */
    }

    p {
        font-size: 1rem;
        margin-bottom: 20px;
        color: #555555; /* Gray text */
    }

    .wallet-display,
    .wallet-form {
        margin-top: 20px;
    }

    /* Button styling in WalletForm */
    button {
        padding: 10px 20px;
        font-size: 1rem;
        font-weight: bold;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    button.btn-primary {
        background-color: #FCE74A; /* Yellow button */
        color: #000000; /* Black text */
    }

    button.btn-primary:hover {
        opacity: 0.9; /* Slight hover effect */
    }
</style>
